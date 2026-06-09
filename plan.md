# TipsyTracker Frontend Overhaul Plan

Goal: turn the current half-MUI / half-hand-rolled UI into a single, polished,
functioning app. Fix real bugs, unify the design system on MUI, and bring every
page (auth, onboarding, home, account) up to the same standard.

## Decisions

- **Design system: MUI** (Material UI), already a dependency and used by ~half
  the app. We commit to it everywhere and delete the competing hand-rolled CSS.
- **Theme-driven, not inline.** A single `ThemeProvider` holds the brand palette
  and typography. No more repeated `sx={{ color: "#034078" }}`.
- **Brand palette** (from existing usage): primary `#034078`, ink `#22303a`,
  muted `#5b6b75`, surface `#f5f8fa`, border `#dbe4ea`.
- **API base stays empty in prod** (`.env.production`); all `authedFetch` paths
  already include `/api`.

## Confirmed backend facts (verified in source)

- `GET /api/users/:id` looks up by internal `users.id` (= Clerk user id),
  **not** username. So shareable `/users/:username` URLs need a new lookup.
- Routes exist for: bars, auth/sync, feed, posts (CRUD + stops + publish),
  comments, likes, users/:id, users/:id/posts, users/me/profile (PATCH).

## Bugs to fix (not just polish)

1. **`/users/:username` always shows the logged-in user.** `Account.tsx` ignores
   the route param and loads `user.id`. Viewing other people's profiles is broken.
   Requires a backend username lookup + frontend wiring.
2. **Post composer is a fragile 4+ request chain** (draft → caption → each stop →
   publish) with weak feedback and orphaned drafts on partial failure.
3. **Onboarding errors use `alert()`** and lack field validation.
4. **Comment list flickers** — optimistic prepend followed by a full refetch.
5. **Loading states are bare `<p>Loading...</p>`** everywhere.

## Phases

### Phase 1 — Design system foundation
- Add `ThemeProvider` + `CssBaseline` in `main.tsx` with the brand theme
  (`src/theme.ts`): palette, typography, component default props/overrides
  (rounded buttons, no uppercase, consistent TextField variant).
- Remove hardcoded inline colors in `header.tsx`, `post.tsx` in favor of theme
  `primary`.
- Build shared primitives in `src/components/ui/`:
  - `Loading` (centered `CircularProgress`)
  - `EmptyState` (icon + title + optional action)
  - `ErrorState` (message + retry)
  - `PageShell` (Header + responsive `Container` layout)

### Phase 2 — Fix the bugs
- **Backend:** add `GET /api/users/by-username/:username` (DAL `getUserProfileByUsername`)
  plus posts-by-username, returning the same shape as the id route.
- **Profile route:** `Account.tsx` reads `:username` param; when present, loads the
  other user by username and hides edit/sign-out controls (read-only view).
  When on `/account` (own profile), keep edit + sign out.
- **Post composer:** centralize the request chain with clear step-by-step error
  messages, a busy state on the Post button, disable inputs while saving, and
  surface a single clear error. (Best-effort cleanup of the draft on failure.)
- **Comments:** drop the redundant `fetchComments()` after optimistic insert;
  keep the optimistic prepend only. Add empty + loading states inside the dialog.
- **Onboarding:** replace `alert()` with inline MUI error `Alert`/helper text.

### Phase 3 — Page conversions & polish
- **Onboarding:** rebuild as MUI form (`TextField`s, char counters, validation,
  submit spinner) inside a centered `Card`.
- **Account:** convert summary card, stats, edit form, and posts list to MUI
  (`Card`, `Avatar`, `Stack`, `TextField`, `Button`); add loading/empty/error
  states; read-only mode for other users.
- **Auth pages:** wrap Clerk `<SignIn>/<SignUp>` in a themed MUI shell; theme
  Clerk appearance to match brand.
- **Post card:** redesign on MUI `Card`; proper icon buttons with `aria-label`,
  show comment count, cleaner like/comment row, relative timestamps.
- **Header:** replace `+` text button with an `IconButton`/`Button` + `AddIcon`
  and a tooltip/label ("New post"); a11y labels on icon-only controls.
- **Mobile:** `fullScreen` dialogs on small screens; verify the home layout and
  header adapt; sensible breakpoints.
- **Sidebar copy:** clean up the hangover-cure copy/typos ("pull trig",
  "Redbull no vodka", "Pending on your plans", etc.).
- **Empty/error states** applied app-wide via the Phase 1 primitives.

### Verification
- `tsc -b` typecheck, `eslint .`, `vite build` all clean.
- Manual smoke: sign in, onboarding, create post, like, comment, view own
  account + edit, view another user's profile, sign out, mobile widths.
- Deploy via `npm run build && wrangler deploy`.

## Out of scope (flag for later)
- Backend CORS origin hardcoded to `http://localhost:5173` (fine for same-origin
  prod, revisit if cross-origin is needed).
- Post composer true server-side atomicity (single endpoint) — larger backend change.
- Pagination / infinite scroll on feed and account posts.

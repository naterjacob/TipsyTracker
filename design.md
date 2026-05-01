# TipsyTracker — Scoped Design Doc

*CSC 307 Class Project — "Strava for drinking"*

---

## Scope

This is a scoped-down version of the [original BarTrack design](./bartrack_design.md) sized for a class project. The following features are **cut**:

- Photo uploads (no R2 bucket, no presigned URLs, no lightbox)
- Profile editing (no settings screen)
- Infinite scroll (basic pagination only)

What remains is the core loop: **sign up → log a night out → publish → browse the feed → view profiles**.

---

## Architecture

| Layer | Technology |
|---|---|
| Frontend | React + Vite (TypeScript) |
| Backend API | Cloudflare Workers + Hono |
| Database | Cloudflare D1 (SQLite) |
| Auth | Clerk (JWT) |
| Monorepo | npm workspaces (`packages/frontend`, `packages/backend`) |

---

## Data Model

### `users`

```sql
CREATE TABLE users (
  id          TEXT PRIMARY KEY,       -- Clerk user ID
  username    TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url  TEXT,
  created_at  INTEGER NOT NULL
);
```

### `bars`

```sql
CREATE TABLE bars (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  neighborhood  TEXT,
  created_at    INTEGER NOT NULL
);
```

### `posts`

```sql
CREATE TABLE posts (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users(id),
  caption      TEXT,
  status       TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  total_drinks INTEGER NOT NULL DEFAULT 0,
  created_at   INTEGER NOT NULL,
  published_at INTEGER
);
CREATE INDEX idx_posts_user   ON posts(user_id);
CREATE INDEX idx_posts_status ON posts(status, published_at DESC);
```

### `stops`

```sql
CREATE TABLE stops (
  id          TEXT PRIMARY KEY,
  post_id     TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  bar_id      TEXT NOT NULL REFERENCES bars(id),
  drink_count INTEGER NOT NULL DEFAULT 0,
  note        TEXT,
  stop_order  INTEGER NOT NULL,
  arrived_at  INTEGER NOT NULL
);
CREATE INDEX idx_stops_post ON stops(post_id, stop_order);
```

---

## API Routes

All routes prefixed `/api`. Auth middleware verifies Clerk JWT and populates `userId`.

### Auth

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/sync` | Required | Upsert user record in D1 after Clerk sign-in |

### Feed

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/feed?cursor=&limit=20` | Required | Paginated published posts, newest first |

### Posts

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/posts/:id` | Required | Full post detail with stops and bar info |
| POST | `/api/posts` | Required | Create a new draft (must have no existing draft) |
| PATCH | `/api/posts/:id` | Required (owner) | Update caption of a draft |
| POST | `/api/posts/:id/publish` | Required (owner) | Publish draft, recompute total_drinks |
| DELETE | `/api/posts/:id` | Required (owner) | Delete a draft |

### Stops

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/posts/:id/stops` | Required (owner) | Add a stop to a draft |
| PATCH | `/api/posts/:id/stops/:stopId` | Required (owner) | Update drink count or note |
| DELETE | `/api/posts/:id/stops/:stopId` | Required (owner) | Remove a stop |

### Users & Bars

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/users/:id` | Required | User profile + computed stats |
| GET | `/api/users/:id/posts?cursor=` | Required | User's published posts |
| GET | `/api/bars` | Required | Full bar list for the picker |

---

## Frontend Routes

All routes require authentication.

```
/                   Feed (protected)
/post/:id           Post detail (protected)
/profile/:userId    User profile (protected)
/new                Create/edit draft (protected)
```

---

## User Stories & Tasks

### Story 1: Project Setup

> As a developer, I can run the frontend and backend locally so I can start building features.

- **Task 1.1** — Configure `wrangler.toml` with D1 database binding
- **Task 1.2** — Write the D1 migration SQL (users, bars, posts, stops tables + indexes)
- **Task 1.3** — Run `wrangler d1 migrations apply` to create the schema
- **Task 1.4** — Set up Hono app with CORS middleware and a health check route
- **Task 1.5** — Install React Router in the frontend and set up route scaffolding (`/`, `/post/:id`, `/profile/:userId`, `/new`)
- **Task 1.6** — Add a proxy config in `vite.config.ts` to forward `/api` requests to the Worker dev server
- **Task 1.7** — Seed the `bars` table with 10–15 local bars using a SQL seed script

---

### Story 2: Authentication

> As a user, I can sign up, log in, and log out so I have an account on the platform.

- **Task 2.1** — Create a Clerk application and add the publishable key to the frontend env
- **Task 2.2** — Install `@clerk/clerk-react` and wrap the app in `<ClerkProvider>`
- **Task 2.3** — Add `<SignInButton>`, `<SignUpButton>`, and `<UserButton>` to the NavBar
- **Task 2.4** — Create a protected route wrapper component that redirects unauthenticated users
- **Task 2.5** — Write Hono auth middleware that verifies the Clerk JWT from the `Authorization` header
- **Task 2.6** — Implement `POST /api/auth/sync` — upsert the user into D1 using the Clerk user ID, username, and avatar URL from the JWT claims
- **Task 2.7** — Call `/api/auth/sync` from the frontend after successful sign-in (e.g., in a `useEffect` on the auth state)

---

### Story 3: Bar Picker

> As a user creating a post, I can search and select a bar from a predefined list.

- **Task 3.1** — Implement `GET /api/bars` endpoint that returns all bars ordered by name
- **Task 3.2** — Build a `BarPicker` component: a searchable dropdown that filters bars by name client-side
- **Task 3.3** — Style the bar picker to show bar name and neighborhood

---

### Story 4: Creating a Post (Draft)

> As a logged-in user, I can start a night out, add stops with drink counts, and manage my draft before publishing.

- **Task 4.1** — Implement `POST /api/posts` — create a draft post. Return 409 if the user already has an active draft
- **Task 4.2** — Implement `POST /api/posts/:id/stops` — add a stop (bar_id, drink_count, optional note). Auto-increment `stop_order`
- **Task 4.3** — Implement `PATCH /api/posts/:id/stops/:stopId` — update drink count or note on a stop
- **Task 4.4** — Implement `DELETE /api/posts/:id/stops/:stopId` — remove a stop from the draft
- **Task 4.5** — Implement `PATCH /api/posts/:id` — update the post caption
- **Task 4.6** — Implement `DELETE /api/posts/:id` — delete the entire draft (cascades to stops)
- **Task 4.7** — Build the `/new` page: form to select a bar, enter drink count, add a note, and submit a stop
- **Task 4.8** — Show the list of current stops on the `/new` page with edit/delete controls
- **Task 4.9** — Add a caption input field to the draft page
- **Task 4.10** — On app load, check for an existing draft (`GET /api/posts?status=draft&userId=me`) and show a "Resume Draft" banner on the home screen if one exists

---

### Story 5: Publishing a Post

> As a user, I can publish my draft to make it visible in the public feed.

- **Task 5.1** — Implement `POST /api/posts/:id/publish` — set status to `published`, compute `total_drinks` as the sum of all stop drink counts, set `published_at`
- **Task 5.2** — Add a "Publish" button to the draft page that calls the publish endpoint and redirects to the feed
- **Task 5.3** — Validate that a draft has at least one stop before allowing publish (backend + frontend)

---

### Story 6: The Feed

> As a user, I can see a reverse-chronological feed of published posts.

- **Task 6.1** — Implement `GET /api/feed?cursor=&limit=20` — return published posts with author info and bar names, paginated by `published_at` cursor
- **Task 6.2** — Build a `PostCard` component showing: username, total drinks, number of bars visited, caption, and relative timestamp
- **Task 6.3** — Build the `FeedPage` that fetches and renders a list of `PostCard` components
- **Task 6.4** — Add a "Load More" button for pagination (not infinite scroll)
- **Task 6.5** — Make the post card clickable, navigating to `/post/:id`

---

### Story 7: Post Detail View

> As a user, I can click a post to see the full timeline of stops.

- **Task 7.1** — Implement `GET /api/posts/:id` — return the post with all stops (including bar name) and author info
- **Task 7.2** — Build the `PostDetailPage` showing: user info header, caption, a timeline of stops (bar name, drink count, note), total drinks, and total bars
- **Task 7.3** — Make the username in the detail view clickable, linking to `/profile/:userId`

---

### Story 8: User Profiles

> As a user, I can view any user's profile with their stats and post history.

- **Task 8.1** — Implement `GET /api/users/:id` — return user info + computed stats (total drinks, unique bars visited, total nights out, most-visited bar)
- **Task 8.2** — Implement `GET /api/users/:id/posts?cursor=` — return the user's published posts, paginated
- **Task 8.3** — Build the `ProfilePage` showing: avatar, username, stats bar (total drinks, bars visited, nights out, most-visited bar)
- **Task 8.4** — Below the stats, render the user's posts using the same `PostCard` component from the feed
- **Task 8.5** — Make usernames throughout the app (feed cards, post detail) link to the profile page

---

## Out of Scope (v2)

- Photo uploads and lightbox
- Profile editing / settings screen
- Infinite scroll
- Reactions / likes
- Following / personal feed
- Leaderboards
- Bar detail pages
- Push notifications
- Social login (Google via Clerk)
- Admin bar management UI

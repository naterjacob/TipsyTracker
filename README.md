# TipsyTracker
CSC 307 TipsyTracker Project


Explanation of Security for TE#5
We decided to use Clerk for our security and authentication. Clerk is a free to use authentication platform that is amazing because it handles all our user information and includes a prebuilt login system, password hashing, email verification, and session management. In our project, Clerk manages the entire sign-up and sign-in process, including email verification and persistent login sessions. The frontend React application uses Clerk for singing in and signing up, and then we use hooks like useAuth() and useUser() which allows the app to determine whether a user is logged in and retrieve the current user’s session token for continuouos authentication.

In this project we have integrated Clerk into the frontend and backend. After a user signs up and verifies their email, the frontend obtains a Clerk session token and sends it to the Hono backend in the Authorization header. The backend then verifies the token using Clerk before allowing access to protected API routes. Once verified, the backend creates or updates the user’s record in the D1 database, where app-specific information such as usernames, display names, avatars, and bios are stored. This separation allows for an extra layer of security and keeps the process centeral to Clerk and then our application database stores the information needed for the project like profiles, posts, and other needed data.

Our Sequence Diagram:


<img width="596" height="723" alt="image" src="https://github.com/user-attachments/assets/8e0880df-c011-4e29-b017-24e02e52b341" />



## Deployment

TipsyTracker is a monorepo deployed to **Cloudflare** via **GitHub Actions**:

| Package | Stack | Cloudflare target | URL |
| --- | --- | --- | --- |
| `packages/backend` | Hono + Drizzle + D1 | Worker | `tipsytracker.org/api/*` |
| `packages/frontend` | React + Vite (SPA) | Worker (static assets) | `tipsytracker.org` |

### How it works

Two workflows in `.github/workflows/` deploy on push to `main`, each path-filtered
so a package only redeploys when its own files change. Both can also be triggered
manually from the GitHub **Actions** tab (`workflow_dispatch`).

- **Deploy Backend** — type-checks, applies pending D1 migrations against the
  production database (`wrangler d1 migrations apply --remote`), syncs the Clerk
  Worker secrets, then `wrangler deploy`.
- **Deploy Frontend** — builds the Vite bundle with the `VITE_*` values baked in,
  then `wrangler deploy`.

### Required GitHub configuration

Set these under **Settings → Secrets and variables → Actions**.

**Secrets** (encrypted):

| Name | Used by | Description |
| --- | --- | --- |
| `CLOUDFLARE_API_TOKEN` | both | Scoped Cloudflare API token (see below) |
| `CLOUDFLARE_ACCOUNT_ID` | both | Your Cloudflare account ID |
| `CLERK_SECRET_KEY` | backend | Clerk secret key (`sk_...`) — runtime Worker secret |
| `CLERK_PUBLISHABLE_KEY` | backend | Clerk publishable key (`pk_...`) — runtime Worker secret |
| `VITE_CLERK_PUBLISHABLE_KEY` | frontend | Clerk publishable key (`pk_...`) — compiled into the bundle at build time |

**Variables** (optional, non-secret):

| Name | Default | Description |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `/api` | API base the SPA calls. Default keeps it same-origin, no CORS. |

> The frontend Clerk key is a *publishable* key and is safe to expose in the
> browser bundle. The backend `CLERK_SECRET_KEY` is sensitive and is only ever
> set as a runtime Worker secret — never compiled into client code.

### Cloudflare API token permissions

Create a token at **Cloudflare Dashboard → My Profile → API Tokens → Create Token**
(use "Create Custom Token") with the minimum scopes:

- Account → **Workers Scripts** → Edit
- Account → **D1** → Edit
- Zone → **Workers Routes** → Edit (for the `tipsytracker.org` zone)

Your **Account ID** is shown in the Cloudflare dashboard sidebar / Workers overview.

### Local development

Copy the example env files and fill in real values (the real files are gitignored):

```bash
cp packages/backend/.dev.vars.example   packages/backend/.dev.vars
cp packages/frontend/.env.local.example packages/frontend/.env.local
```

Then run each package with `npm run dev` from its directory.

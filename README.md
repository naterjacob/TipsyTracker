# TipsyTracker

CSC 307 TipsyTracker Project

## Project Blurb

TipsyTracker is a web based app that is designed to allow users
to track their alcohol consumption on a night out in San Luis
Obispo. The app is targeted for legal age Cal Poly students to
use so they can manage their drinks on a Thursday or Saturday
night, compare evenings with friends, and track the potential
damage done to their bank accounts. The app includes continuous
authentication and allows users to create a profile similar to
Strava or Instagram and post their evenings to a feed of other
users in the area. Included features are a small ranking system
where users can see who drank the most on a given night and also
a large bank of potential hangover cures to help the user out
the morning after as they check their feed.

## UI Prototype

[Ui Prototype](https://www.figma.com/design/Q0w5X10xb35OUShHJdYbac/TipsyTracker?t=1JAV8qOZJRhz3Or1-1)
last updated: May 18, 2026

## Development Environment Set Up

**Prerequisites**

- Node.Js installed
  - Allows you to use `npm` to install dependencies
- Clerk Account
  - Need a Clerk project in order to get API keys for Clerk
- Git
  - For cloning the repository, pushing/pulling changes, and
    version control

**Set Up**  
Once you clone the repository do the following to develop on the
project locally

- Run the following from the root of the project

```bash
# root
npm install
```

- Create `packages/frontend/.env` that contains the following
  information
  - Use your own Clerk publishable key here.
    http://localhost:8787 is Wrangler's default local
    development port and ensures frontend API requests are sent
    to your local backend instance.

```bash
# packages/frontend/.env
VITE_CLERK_PUBLISHABLE_KEY=<clerk key>
VITE_API_BASE_URL=http://localhost:8787
```

- From `packages/backend` run the following command
  - This command will essentially build the database locally for
    you to test and develop on

```bash
# packages/backend
npx wrangler d1 migrations apply tipsytracker-db --local
```

- Create `packages/backend/.dev.vars` that has the following
  information
  - Once again use your own Clerk publishable key, along with
    your Clerk secret key

```bash
# packages/backend/.dev.vars
CLERK_PUBLISHABLE_KEY=<clerk key>
CLERK_SECRET_KEY=<clerk key>
```

**Running the Environment**  
To run the project locally, you’ll need two terminal windows:

1. Frontend (root)  
   Run the following command from the root of the project to
   start the local frontend server.

```bash
# root
npm start
```

2. Backend (packages/backend)  
   In a second terminal run the following command from
   `packages/backend` to start the local backend server.

```bash
# packages/backend
npm run dev
```

The reason for this is quite simple the two terminal windows
just allow you to see that both the frontend and backend are
running correctly.

**Rolldown Issue**  
If you seem to be having some trouble with the front end and
specifically rolldown an easy solution is just doing this
command `npm install rolldown` from the root, as it will just
install rolldown assuming it was not downloaded with the first
`npm install`.

**Resetting/Deleting Local Database**  
If for some reason you want to reset the local database just run
the following command while in `packages/backend`

```bash
# packages/backend
rm -rf .wrangler

```

You can then just rebuild the database once again.

## Pushing Changes

Create a feature branch for changes and commit your updates
there. Before pushing, squash your commits into a single clean
commit. Then push the branch to the remote repository and open a
pull request. The changes will then be reviewed before merging.
Branch naming should follow this convention `feat/<name>`. This
is a loose convention, as long as the branch name is descriptive
enough to indicate what it contains it should be fine. When
opening a pull request, be descriptive about the changes you
made.

## Explanation of Security for TE#5

We decided to use Clerk for our security and authentication.
Clerk is a free to use authentication platform that is amazing
because it handles all our user information and includes a
prebuilt login system, password hashing, email verification, and
session management. In our project, Clerk manages the entire
sign-up and sign-in process, including email verification and
persistent login sessions. The frontend React application uses
Clerk for singing in and signing up, and then we use hooks like
useAuth() and useUser() which allows the app to determine
whether a user is logged in and retrieve the current user’s
session token for continuous authentication.

In this project we have integrated Clerk into the frontend and
backend. After a user signs up and verifies their email, the
frontend obtains a Clerk session token and sends it to the Hono
backend in the Authorization header. The backend then verifies
the token using Clerk before allowing access to protected API
routes. Once verified, the backend creates or updates the user’s
record in the D1 database, where app-specific information such
as usernames, display names, avatars, and bios are stored. This
separation allows for an extra layer of security and keeps the
process central to Clerk and then our application database
stores the information needed for the project like profiles,
posts, and other needed data.

Our Sequence Diagram:

<img width="596" height="723" alt="image" src="https://github.com/user-attachments/assets/8e0880df-c011-4e29-b017-24e02e52b341" />

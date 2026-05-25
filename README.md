# TipsyTracker
CSC 307 TipsyTracker Project


Explanation of Security for TE#5
We decided to use Clerk for our security and authentication. Clerk is a free to use authentication platform that is amazing because it handles all our user information and includes a prebuilt login system, password hashing, email verification, and session management. In our project, Clerk manages the entire sign-up and sign-in process, including email verification and persistent login sessions. The frontend React application uses Clerk for singing in and signing up, and then we use hooks like useAuth() and useUser() which allows the app to determine whether a user is logged in and retrieve the current user’s session token for continuouos authentication.

In this project we have integrated Clerk into the frontend and backend. After a user signs up and verifies their email, the frontend obtains a Clerk session token and sends it to the Hono backend in the Authorization header. The backend then verifies the token using Clerk before allowing access to protected API routes. Once verified, the backend creates or updates the user’s record in the D1 database, where app-specific information such as usernames, display names, avatars, and bios are stored. This separation allows for an extra layer of security and keeps the process centeral to Clerk and then our application database stores the information needed for the project like profiles, posts, and other needed data.

Our Sequence Diagram:
<img width="596" height="723" alt="image" src="https://github.com/user-attachments/assets/8e0880df-c011-4e29-b017-24e02e52b341" />
Text Version:
sequenceDiagram
    actor User
    participant Frontend as React Frontend
    participant Clerk as Clerk Auth
    participant Backend as Hono Backend
    participant DB as D1 Database

    User->>Frontend: Opens /sign-up
    Frontend->>Clerk: Renders Clerk <SignUp />
    User->>Clerk: Enters email/password
    Clerk->>User: Sends verification code
    User->>Clerk: Submits verification code
    Clerk-->>Frontend: User authenticated + session created

    Frontend->>Frontend: AuthSync detects signed-in user
    Frontend->>Clerk: getToken()
    Clerk-->>Frontend: Clerk session token

    Frontend->>Backend: POST /api/auth/sync<br/>Authorization: Bearer token
    Backend->>Clerk: Verify token
    Clerk-->>Backend: Valid userId
    Backend->>DB: INSERT user row with Clerk ID<br/>username = NULL
    DB-->>Backend: User synced
    Backend-->>Frontend: 200 OK

    Frontend->>Frontend: Redirect to /onboarding
    User->>Frontend: Enters display name, handle, avatar, bio
    Frontend->>Clerk: getToken()
    Clerk-->>Frontend: Clerk session token

    Frontend->>Backend: PATCH /api/users/me/profile<br/>Authorization: Bearer token
    Backend->>Clerk: Verify token
    Clerk-->>Backend: Valid userId
    Backend->>DB: UPDATE users<br/>set username, display_name, avatar_url, bio
    DB-->>Backend: Profile saved
    Backend-->>Frontend: 200 OK

    Frontend->>Frontend: Redirect to /home

# TipsyTracker
CSC 307 TipsyTracker Project

Project blurb:
TipsyTracker is a web based app that is designed to allow users to track their alcohol consumption on a night out in San Luis Obispo. The app is targeted for legal age Cal Poly students to use so they can manage their drinks on a Thursday or Saturday night, compare evenings with friends, and track the potential damage done to their bank accounts. The app includes continuous authentication and allows users to create a profile similar to Strava or Instagram and post their evenings to a feed of other users in the area. Included features are a small ranking system where users can see who drank the most on a given night and also a large bank of potential hangover cures to help the user out the morning after as they check their feed.

UI Prototype
Add a link to your UI prototype on the project README on GitHub with the date you last updated it. There is no need to generate a new prototype. This is basically to document what you have produced in the beginning of the project.

Development environment set up
Add a section to your project README on GitHub, providing instructions on how to set up the development environment. Suppose that you need to onboard new developers and these instructions are all that a new developer will have to set up their workstation. Much of this may already be in place from the CI assignment, but review and update if necessary.


Explanation of Security for TE#5
We decided to use Clerk for our security and authentication. Clerk is a free to use authentication platform that is amazing because it handles all our user information and includes a prebuilt login system, password hashing, email verification, and session management. In our project, Clerk manages the entire sign-up and sign-in process, including email verification and persistent login sessions. The frontend React application uses Clerk for singing in and signing up, and then we use hooks like useAuth() and useUser() which allows the app to determine whether a user is logged in and retrieve the current user’s session token for continuouos authentication.

In this project we have integrated Clerk into the frontend and backend. After a user signs up and verifies their email, the frontend obtains a Clerk session token and sends it to the Hono backend in the Authorization header. The backend then verifies the token using Clerk before allowing access to protected API routes. Once verified, the backend creates or updates the user’s record in the D1 database, where app-specific information such as usernames, display names, avatars, and bios are stored. This separation allows for an extra layer of security and keeps the process centeral to Clerk and then our application database stores the information needed for the project like profiles, posts, and other needed data.

Our Sequence Diagram:


<img width="596" height="723" alt="image" src="https://github.com/user-attachments/assets/8e0880df-c011-4e29-b017-24e02e52b341" />



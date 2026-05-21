import { SignIn } from "@clerk/clerk-react";

function LogIn() {
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
      <section style={{ width: "100%", maxWidth: "420px" }}>
        <h1>Login</h1>
        <p>Track your bar crawl with friends.</p>

        <SignIn
          path="/"
          routing="path"
          signUpUrl="/sign-up"
          fallbackRedirectUrl="/home"
        />
      </section>
    </main>
  );
}

export default LogIn;
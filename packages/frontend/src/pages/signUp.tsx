import { SignUp } from "@clerk/clerk-react";

function SignUpPage() {
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
      <section style={{ width: "100%", maxWidth: "420px" }}>
        <h1>Create Account</h1>
        <p>Sign up, then complete your TipsyTracker profile.</p>

        <SignUp
          path="/sign-up"
          routing="path"
          signInUrl="/"
          fallbackRedirectUrl="/onboarding"
        />
      </section>
    </main>
  );
}

export default SignUpPage;
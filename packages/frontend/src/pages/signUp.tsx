import { SignUp } from "@clerk/clerk-react";
import "./auth.css";

function SignUpPage() {
  return (
    <main className="tt-auth-page">
      <section className="small-container tt-auth-shell">
        <header className="tt-auth-intro">
          <h1>TipsyTracker</h1>
          <p>Create your account, then finish your profile.</p>
        </header>
        <div className="tt-auth-card">
          <SignUp
            path="/sign-up"
            routing="path"
            signInUrl="/sign-in"
            fallbackRedirectUrl="/onboarding"
          />
        </div>
      </section>
    </main>
  );
}

export default SignUpPage;

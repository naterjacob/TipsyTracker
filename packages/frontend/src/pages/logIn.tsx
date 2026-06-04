import { SignIn } from "@clerk/clerk-react";
import "./auth.css";

function LogIn() {
  return (
    <main className="tt-auth-page">
      <section className="small-container tt-auth-shell">
        <header className="tt-auth-intro">
          <h1>TipsyTracker</h1>
          <p>Track your night, stop by stop.</p>
        </header>
        <div className="tt-auth-card">
          <SignIn
            path="/sign-in"
            routing="path"
            signUpUrl="/sign-up"
            fallbackRedirectUrl="/home"
          />
        </div>
      </section>
    </main>
  );
}

export default LogIn;

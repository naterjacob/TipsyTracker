import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthedFetch } from "../lib/api";
import "./auth.css";

function Onboarding() {
  const navigate = useNavigate();
  const authedFetch = useAuthedFetch();

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    setIsSaving(true);

    const response = await authedFetch("/api/users/me/profile", {
      method: "PATCH",
      body: JSON.stringify({
        username: username.trim().toLowerCase(),
        display_name: displayName.trim(),
        avatar_url: avatarUrl.trim(),
        bio: bio.trim(),
      }),
    });

    setIsSaving(false);

    if (!response.ok) {
      alert("Failed to save profile");
      return;
    }

    navigate("/home");
  }

  return (
    <main className="tt-auth-page">
      <section className="small-container tt-auth-shell">
        <header className="tt-auth-intro">
          <h1>Complete your profile</h1>
          <p>This helps your posts show up clearly in the feed.</p>
        </header>

        <form className="tt-auth-card tt-auth-form" onSubmit={handleSubmit}>
          <label>
            Display name
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              maxLength={40}
              required
            />
          </label>

          <label>
            Handle
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              maxLength={20}
              required
            />
          </label>

          <label>
            Profile picture URL
            <input
              value={avatarUrl}
              onChange={(event) => setAvatarUrl(event.target.value)}
            />
          </label>

          <label>
            Bio ({bio.length}/50)
            <textarea
              value={bio}
              onChange={(event) => setBio(event.target.value.slice(0, 50))}
              maxLength={50}
            />
          </label>

          <div className="tt-auth-row">
            <button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save profile"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

export default Onboarding;

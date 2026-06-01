import { useEffect, useState, type FormEvent } from "react";
import { useClerk, useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import Header from "../components/header";
import { useAuthedFetch } from "../lib/api";
import "./account.css";

type AccountProfile = {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  stats: {
    totalDrinks: number;
    uniqueBarsVisited: number;
    postsCount: number;
  };
};

type AccountApiResponse = {
  user: {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
    bio?: string | null;
  };
  stats: {
    totalDrinks: number;
    uniqueBarsVisited: number;
    totalNightsOut: number;
  };
};

type UserPost = {
  id: string;
  caption: string | null;
  totalDrinks: number;
  publishedAt: number | null;
};

function Account() {
  const authedFetch = useAuthedFetch();
  const navigate = useNavigate();
  const { signOut } = useClerk();
  const { user } = useUser();
  const userId = user?.id ?? null;
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [form, setForm] = useState({
    displayName: "",
    username: "",
    bio: ""
  });

  const applyProfile = (payload: AccountApiResponse) => {
    const nextProfile: AccountProfile = {
      id: payload.user.id,
      username: payload.user.username,
      displayName: payload.user.display_name,
      avatarUrl: payload.user.avatar_url,
      bio: payload.user.bio ?? null,
      stats: {
        totalDrinks: payload.stats.totalDrinks,
        uniqueBarsVisited: payload.stats.uniqueBarsVisited,
        postsCount: payload.stats.totalNightsOut
      }
    };

    setProfile(nextProfile);
    setForm({
      displayName: nextProfile.displayName ?? "",
      username: nextProfile.username ?? "",
      bio: nextProfile.bio ?? ""
    });
  };

  useEffect(() => {
    if (!userId) return;
    let isMounted = true;

    async function loadData() {
      setError(null);
      setIsLoading(true);
      const [profileResponse, postsResponse] = await Promise.all([
        authedFetch(`/api/users/${userId}`),
        authedFetch(`/api/users/${userId}/posts?limit=10`)
      ]);

      if (!profileResponse.ok) {
        if (isMounted) {
          setError("Could not load account details.");
          setIsLoading(false);
        }
        return;
      }

      const profileData = (await profileResponse.json()) as AccountApiResponse;
      const postData = postsResponse.ok
        ? ((await postsResponse.json()) as { posts?: UserPost[] })
        : { posts: [] };

      if (isMounted) {
        applyProfile(profileData);
        setPosts(postData.posts ?? []);
        setIsLoading(false);
      }
    }

    void loadData();
    return () => {
      isMounted = false;
    };
  }, [authedFetch, userId]);

  async function handleProfileSave(event: FormEvent) {
    event.preventDefault();

    setSaveMessage(null);
    setIsSavingProfile(true);
    const response = await authedFetch("/api/users/me/profile", {
      method: "PATCH",
      body: JSON.stringify({
        username: form.username.trim().toLowerCase(),
        display_name: form.displayName.trim(),
        avatar_url: profile?.avatarUrl ?? null,
        bio: form.bio.trim()
      })
    });
    setIsSavingProfile(false);

    if (!response.ok) {
      setSaveMessage("Could not save profile.");
      return;
    }

    if (userId) {
      const refreshed = await authedFetch(`/api/users/${userId}`);
      if (refreshed.ok) {
        const refreshedData =
          (await refreshed.json()) as AccountApiResponse;
        applyProfile(refreshedData);
      }
    }

    setSaveMessage("Profile updated.");
    setIsEditingProfile(false);
  }

  async function handleSignOut() {
    await signOut();
    navigate("/sign-in", { replace: true });
  }

  return (
    <div className="account-page">
      <Header />
      <main className="container account-content">
        {isLoading ? <p>Loading account...</p> : null}
        {error ? <p>{error}</p> : null}
        {profile ? (
          <div className="account-grid">
            <section className="account-card account-summary">
              <div className="account-summary-top">
                {profile.avatarUrl ? (
                  <img
                    className="account-avatar"
                    src={profile.avatarUrl}
                    alt=""
                  />
                ) : (
                  <div className="account-avatar account-avatar-fallback">
                    {(profile.displayName || profile.username || "U")
                      .slice(0, 1)
                      .toUpperCase()}
                  </div>
                )}
                <div>
                  <h1 className="account-title">
                    {profile.displayName || profile.username || "Your Account"}
                  </h1>
                  <p className="account-handle">
                    {profile.username
                      ? `@${profile.username}`
                      : "No username set"}
                  </p>
                </div>
              </div>

              <p className="account-bio">{profile.bio || "No bio set."}</p>

              <dl className="account-stats">
                <div>
                  <dt>Total Drinks</dt>
                  <dd>{profile.stats.totalDrinks}</dd>
                </div>
                <div>
                  <dt>Unique Bars</dt>
                  <dd>{profile.stats.uniqueBarsVisited}</dd>
                </div>
                <div>
                  <dt>Posts</dt>
                  <dd>{profile.stats.postsCount}</dd>
                </div>
              </dl>

              <div className="account-actions">
                <button
                  className="button muted-button"
                  type="button"
                  onClick={handleSignOut}
                >
                  Sign Out
                </button>
              </div>
            </section>

            <section className="account-card">
              <div className="account-edit-top">
                <h2 className="account-section-title">Profile</h2>
                <button
                  className="button muted-button"
                  type="button"
                  onClick={() =>
                    setIsEditingProfile((current) => !current)
                  }
                >
                  {isEditingProfile ? "Lock" : "Edit Profile"}
                </button>
              </div>
              <form className="account-form" onSubmit={handleProfileSave}>
                <label>
                  Display name
                  <input
                    value={form.displayName}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        displayName: event.target.value
                      }))
                    }
                    maxLength={40}
                    required
                    disabled={!isEditingProfile || isSavingProfile}
                  />
                </label>

                <label>
                  Username
                  <input
                    value={form.username}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        username: event.target.value
                      }))
                    }
                    maxLength={20}
                    required
                    disabled={!isEditingProfile || isSavingProfile}
                  />
                </label>

                <label>
                  Bio
                  <textarea
                    rows={3}
                    value={form.bio}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        bio: event.target.value.slice(0, 50)
                      }))
                    }
                    maxLength={50}
                    disabled={!isEditingProfile || isSavingProfile}
                  />
                </label>

                <div className="account-form-actions">
                  <button
                    type="submit"
                    disabled={!isEditingProfile || isSavingProfile}
                  >
                    {isSavingProfile ? "Saving..." : "Save changes"}
                  </button>
                </div>

                {saveMessage ? (
                  <p className="account-save-message">{saveMessage}</p>
                ) : null}
              </form>
            </section>

            <section className="account-card">
              <h2 className="account-section-title">Recent Posts</h2>
              {posts.length === 0 ? (
                <p className="account-empty">No posts yet.</p>
              ) : (
                <ul className="account-posts">
                  {posts.map((post) => (
                    <li key={post.id} className="account-post-item">
                      <p className="account-post-caption">
                        {post.caption || "No caption"}
                      </p>
                      <p className="account-post-meta">
                        {post.totalDrinks} drinks
                        {post.publishedAt
                          ? ` · ${new Date(
                              post.publishedAt * 1000
                            ).toLocaleDateString()}`
                          : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        ) : null}
      </main>
    </div>
  );
}

export default Account;

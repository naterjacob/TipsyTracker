import { useEffect, useState, type FormEvent } from "react";
import { useClerk, useUser } from "@clerk/clerk-react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  IconButton,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import { useAuthedFetch } from "../lib/api";
import PageShell from "../components/ui/PageShell";
import Loading from "../components/ui/Loading";
import ErrorState from "../components/ui/ErrorState";
import EmptyState from "../components/ui/EmptyState";

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
  const { username: routeUsername } = useParams();
  const userId = user?.id ?? null;

  // Own profile when on /account, or when the route username matches the
  // signed-in user's username. Otherwise this is a read-only view of someone else.
  const isOwnProfile =
    !routeUsername ||
    (!!user?.username &&
      routeUsername.toLowerCase() === user.username.toLowerCase());

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
    bio: "",
    avatarUrl: ""
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
      bio: nextProfile.bio ?? "",
      avatarUrl: nextProfile.avatarUrl ?? ""
    });
  };

  useEffect(() => {
    // For own profile we need the Clerk user id; for others we need a username.
    if (isOwnProfile && !userId) return;
    if (!isOwnProfile && !routeUsername) return;
    let isMounted = true;

    const profilePath = isOwnProfile
      ? `/api/users/${userId}`
      : `/api/users/by-username/${encodeURIComponent(routeUsername as string)}`;
    const postsPath = isOwnProfile
      ? `/api/users/${userId}/posts?limit=10`
      : `/api/users/by-username/${encodeURIComponent(
          routeUsername as string
        )}/posts?limit=10`;

    async function loadData() {
      setError(null);
      setIsLoading(true);
      const [profileResponse, postsResponse] = await Promise.all([
        authedFetch(profilePath),
        authedFetch(postsPath)
      ]);

      if (!profileResponse.ok) {
        if (isMounted) {
          setError(
            profileResponse.status === 404
              ? "That profile could not be found."
              : "Could not load account details."
          );
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
  }, [authedFetch, userId, routeUsername, isOwnProfile]);

  async function handleProfileSave(event: FormEvent) {
    event.preventDefault();

    setSaveMessage(null);
    setIsSavingProfile(true);
    const response = await authedFetch("/api/users/me/profile", {
      method: "PATCH",
      body: JSON.stringify({
        username: form.username.trim().toLowerCase(),
        display_name: form.displayName.trim(),
        avatar_url: form.avatarUrl.trim() || null,
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

  async function handleDeletePost(postId: string) {
    if (!window.confirm("Delete this post? This can't be undone.")) return;
    const res = await authedFetch(`/api/posts/${postId}`, { method: "DELETE" });
    if (!res.ok) {
      console.error("Failed to delete post", res.status);
      return;
    }
    setPosts((current) => current.filter((p) => p.id !== postId));
    setProfile((current) =>
      current
        ? {
            ...current,
            stats: {
              ...current.stats,
              postsCount: Math.max(0, current.stats.postsCount - 1)
            }
          }
        : current
    );
  }

  const initials = (profile?.displayName || profile?.username || "U")
    .slice(0, 1)
    .toUpperCase();

  return (
    <PageShell maxWidth="md">
      {isLoading ? <Loading label="Loading account…" /> : null}
      {error && !isLoading ? <ErrorState message={error} /> : null}
      {profile && !isLoading ? (
        <Stack spacing={3}>
          {/* Summary */}
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                <Avatar
                  src={profile.avatarUrl ?? undefined}
                  sx={{ width: 64, height: 64 }}
                >
                  {initials}
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="h1" sx={{ fontSize: "1.5rem" }} noWrap>
                    {profile.displayName || profile.username || "Account"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {profile.username ? `@${profile.username}` : "No username set"}
                  </Typography>
                </Box>
              </Stack>

              <Typography sx={{ mt: 2 }} color="text.secondary">
                {profile.bio || "No bio yet."}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Stack direction="row" spacing={4}>
                <Box>
                  <Typography variant="h2" sx={{ fontSize: "1.5rem" }}>
                    {profile.stats.totalDrinks}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Total drinks
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="h2" sx={{ fontSize: "1.5rem" }}>
                    {profile.stats.uniqueBarsVisited}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Unique bars
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="h2" sx={{ fontSize: "1.5rem" }}>
                    {profile.stats.postsCount}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Posts
                  </Typography>
                </Box>
              </Stack>

              {isOwnProfile ? (
                <Box sx={{ mt: 2 }}>
                  <Button variant="outlined" onClick={handleSignOut}>
                    Sign out
                  </Button>
                </Box>
              ) : null}
            </CardContent>
          </Card>

          {/* Edit form — own profile only */}
          {isOwnProfile ? (
            <Card>
              <CardContent>
                <Stack
                  direction="row"
                  sx={{
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2
                  }}
                >
                  <Typography variant="h2">Profile</Typography>
                  <Button
                    variant="text"
                    onClick={() => setIsEditingProfile((current) => !current)}
                  >
                    {isEditingProfile ? "Cancel" : "Edit profile"}
                  </Button>
                </Stack>

                <Box component="form" onSubmit={handleProfileSave}>
                  <Stack spacing={2}>
                    <TextField
                      label="Display name"
                      value={form.displayName}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          displayName: event.target.value
                        }))
                      }
                      slotProps={{ htmlInput: { maxLength: 40 } }}
                      required
                      disabled={!isEditingProfile || isSavingProfile}
                    />
                    <TextField
                      label="Username"
                      value={form.username}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          username: event.target.value
                        }))
                      }
                      slotProps={{ htmlInput: { maxLength: 20 } }}
                      required
                      disabled={!isEditingProfile || isSavingProfile}
                    />
                    <TextField
                      label="Profile picture URL"
                      placeholder="https://…"
                      value={form.avatarUrl}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          avatarUrl: event.target.value
                        }))
                      }
                      disabled={!isEditingProfile || isSavingProfile}
                    />
                    <TextField
                      label="Bio"
                      value={form.bio}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          bio: event.target.value.slice(0, 50)
                        }))
                      }
                      helperText={`${form.bio.length}/50`}
                      multiline
                      minRows={3}
                      slotProps={{ htmlInput: { maxLength: 50 } }}
                      disabled={!isEditingProfile || isSavingProfile}
                    />
                    <Box>
                      <Button
                        type="submit"
                        variant="contained"
                        disabled={!isEditingProfile || isSavingProfile}
                      >
                        {isSavingProfile ? "Saving…" : "Save changes"}
                      </Button>
                    </Box>
                    {saveMessage ? (
                      <Alert
                        severity={
                          saveMessage.includes("Could not") ? "error" : "success"
                        }
                      >
                        {saveMessage}
                      </Alert>
                    ) : null}
                  </Stack>
                </Box>
              </CardContent>
            </Card>
          ) : null}

          {/* Recent posts */}
          <Card>
            <CardContent>
              <Typography variant="h2" sx={{ mb: 2 }}>
                Recent posts
              </Typography>
              {posts.length === 0 ? (
                <EmptyState
                  title="No posts yet"
                  description={
                    isOwnProfile
                      ? "Your published nights out will show up here."
                      : "This user hasn't posted yet."
                  }
                />
              ) : (
                <Stack spacing={1.5}>
                  {posts.map((post) => (
                    <Box
                      key={post.id}
                      sx={{
                        p: 2,
                        border: 1,
                        borderColor: "divider",
                        borderRadius: 2,
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 1
                      }}
                    >
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography>{post.caption || "No caption"}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {post.totalDrinks} drinks
                          {post.publishedAt
                            ? ` · ${new Date(
                                post.publishedAt * 1000
                              ).toLocaleDateString()}`
                            : ""}
                        </Typography>
                      </Box>
                      {isOwnProfile ? (
                        <IconButton
                          aria-label="Delete post"
                          size="small"
                          onClick={() => handleDeletePost(post.id)}
                        >
                          <DeleteOutlinedIcon fontSize="small" />
                        </IconButton>
                      ) : null}
                    </Box>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Stack>
      ) : null}
    </PageShell>
  );
}

export default Account;

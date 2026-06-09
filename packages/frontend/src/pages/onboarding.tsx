import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { useAuthedFetch } from "../lib/api";
import { useProfile } from "../lib/useProfile";

function Onboarding() {
  const navigate = useNavigate();
  const authedFetch = useAuthedFetch();
  const { markProfileComplete } = useProfile();

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const usernamePattern = /^[a-z0-9_]+$/;
  const normalizedUsername = username.trim().toLowerCase();
  const usernameInvalid =
    normalizedUsername.length > 0 && !usernamePattern.test(normalizedUsername);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (usernameInvalid) {
      setError("Handle can only contain lowercase letters, numbers, and underscores.");
      return;
    }

    setIsSaving(true);

    const response = await authedFetch("/api/users/me/profile", {
      method: "PATCH",
      body: JSON.stringify({
        username: normalizedUsername,
        display_name: displayName.trim(),
        avatar_url: avatarUrl.trim(),
        bio: bio.trim()
      })
    });

    setIsSaving(false);

    if (!response.ok) {
      setError(
        response.status === 409
          ? "That handle is already taken. Try another."
          : "Could not save your profile. Please try again."
      );
      return;
    }

    markProfileComplete();
    navigate("/home");
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <Container maxWidth="sm" sx={{ py: { xs: 4, sm: 8 } }}>
        <Stack spacing={1} sx={{ mb: 3, textAlign: "center" }}>
          <Typography variant="h1">Complete your profile</Typography>
          <Typography color="text.secondary">
            This helps your posts show up clearly in the feed.
          </Typography>
        </Stack>

        <Card>
          <CardContent>
            <Box component="form" onSubmit={handleSubmit}>
              <Stack spacing={2.5}>
                {error ? <Alert severity="error">{error}</Alert> : null}

                <TextField
                  label="Display name"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  slotProps={{ htmlInput: { maxLength: 40 } }}
                  required
                  autoFocus
                />

                <TextField
                  label="Handle"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  slotProps={{ htmlInput: { maxLength: 20 } }}
                  required
                  error={usernameInvalid}
                  helperText={
                    usernameInvalid
                      ? "Lowercase letters, numbers, and underscores only."
                      : "This is your @handle."
                  }
                />

                <TextField
                  label="Profile picture URL"
                  value={avatarUrl}
                  onChange={(event) => setAvatarUrl(event.target.value)}
                  placeholder="https://…"
                />

                <TextField
                  label="Bio"
                  value={bio}
                  onChange={(event) => setBio(event.target.value.slice(0, 50))}
                  slotProps={{ htmlInput: { maxLength: 50 } }}
                  helperText={`${bio.length}/50`}
                  multiline
                  minRows={2}
                />

                <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                  <Button type="submit" variant="contained" disabled={isSaving}>
                    {isSaving ? "Saving…" : "Save profile"}
                  </Button>
                </Box>
              </Stack>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}

export default Onboarding;

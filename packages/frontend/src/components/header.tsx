import { useEffect, useState, type FormEvent } from "react";
import { useUser, UserButton } from "@clerk/clerk-react";
import { Link, useNavigate } from "react-router-dom";
import {
  AppBar,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Toolbar,
  Typography
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import { useAuthedFetch } from "../lib/api";
import "./header.css";

type HeaderProps = {
  onPostCreated?: () => void;
};

type Bar = {
  id: string;
  name: string;
  neighborhood: string | null;
};

type DraftStopInput = {
  barId: string;
  drinkCount: number;
  note: string;
};

export default function Header({ onPostCreated = () => {} }: HeaderProps) {
  const navigate = useNavigate();
  const authedFetch = useAuthedFetch();
  const { user } = useUser();
  const [showPost, setShowPost] = useState(false);
  const [bars, setBars] = useState<Bar[]>([]);
  const [caption, setCaption] = useState("");
  const [stops, setStops] = useState<DraftStopInput[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!showPost) return;
    let isMounted = true;

    async function loadBars() {
      const response = await authedFetch("/api/bars");
      if (!response.ok) {
        if (isMounted) setErrorMessage("Failed to load bars.");
        return;
      }

      const data = (await response.json()) as { bars?: Bar[] };
      if (!isMounted) return;
      const nextBars = data.bars ?? [];
      setBars(nextBars);
      setStops((current) =>
        current.length > 0
          ? current
          : [
              {
                barId: nextBars[0]?.id || "",
                drinkCount: 1,
                note: ""
              }
            ]
      );
    }

    void loadBars();
    return () => {
      isMounted = false;
    };
  }, [authedFetch, showPost]);

  const resetComposer = () => {
    setCaption("");
    setStops(
      bars[0]
        ? [
            {
              barId: bars[0].id,
              drinkCount: 1,
              note: ""
            }
          ]
        : []
    );
    setErrorMessage(null);
  };

  const closeComposer = () => {
    setShowPost(false);
    resetComposer();
  };

  const addStop = () => {
    setStops((current) => [
      ...current,
      {
        barId: bars[0]?.id || "",
        drinkCount: 1,
        note: ""
      }
    ]);
  };

  const updateStop = (
    index: number,
    key: keyof DraftStopInput,
    value: string | number
  ) => {
    setStops((current) =>
      current.map((stop, stopIndex) =>
        stopIndex === index ? { ...stop, [key]: value } : stop
      )
    );
  };

  const removeStop = (index: number) => {
    setStops((current) =>
      current.filter((_, stopIndex) => stopIndex !== index)
    );
  };

  async function handleCreatePost(event: FormEvent) {
    event.preventDefault();

    if (stops.length === 0) {
      setErrorMessage("Add at least one stop.");
      return;
    }

    if (stops.some((stop) => !stop.barId)) {
      setErrorMessage("Every stop needs a bar.");
      return;
    }

    if (stops.some((stop) => stop.drinkCount <= 0)) {
      setErrorMessage("Drinks must be at least 1 for every stop.");
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    const createResponse = await authedFetch("/api/posts", {
      method: "POST"
    });
    if (!createResponse.ok) {
      setIsSaving(false);
      setErrorMessage("Could not create draft post.");
      return;
    }

    const createData = (await createResponse.json()) as {
      post?: { id?: string };
    };
    const postId = createData.post?.id;
    if (!postId) {
      setIsSaving(false);
      setErrorMessage("Draft post response was invalid.");
      return;
    }

    const captionResponse = await authedFetch(`/api/posts/${postId}`, {
      method: "PATCH",
      body: JSON.stringify({ caption: caption.trim() || null })
    });
    if (!captionResponse.ok) {
      setIsSaving(false);
      setErrorMessage("Could not save caption.");
      return;
    }

    for (const stop of stops) {
      const stopResponse = await authedFetch(`/api/posts/${postId}/stops`, {
        method: "POST",
        body: JSON.stringify({
          barId: stop.barId,
          drinkCount: stop.drinkCount,
          note: stop.note.trim() || null
        })
      });
      if (!stopResponse.ok) {
        setIsSaving(false);
        setErrorMessage("Could not add one of the stops.");
        return;
      }
    }

    const publishResponse = await authedFetch(`/api/posts/${postId}/publish`, {
      method: "POST"
    });
    setIsSaving(false);

    if (!publishResponse.ok) {
      setErrorMessage("Could not publish post.");
      return;
    }

    closeComposer();
    onPostCreated();
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" sx={{ backgroundColor: "#ffffff" }}>
        <Toolbar>
          <Typography
            variant="h4"
            component={Link}
            to="/home"
            sx={{
              flexGrow: 1,
              color: "#034078",
              fontFamily: "sans-serif",
              fontStyle: "italic",
              textDecoration: "none"
            }}
          >
            TipsyTracker
          </Typography>

          <Stack spacing={2} direction="row" sx={{ alignItems: "center" }}>
            <Button
              variant="outlined"
              sx={{
                color: "#034078",
                borderColor: "#034078",
                fontWeight: 800,
                fontSize: 24
              }}
              onClick={() => setShowPost(true)}
              type="button"
            >
              +
            </Button>

            {user ? (
              <UserButton
                appearance={{
                  elements: {
                    userButtonAvatarBox: {
                      width: "48px",
                      height: "48px"
                    },
                    userButtonTrigger: {
                      width: "48px",
                      height: "48px"
                    }
                  }
                }}
              >
                <UserButton.MenuItems>
                  <UserButton.Action
                    label="Account"
                    labelIcon={<PersonIcon />}
                    onClick={() =>
                      navigate(`/users/${user.username ?? user.id}`)
                    }
                  />
                </UserButton.MenuItems>
              </UserButton>
            ) : null}
          </Stack>
        </Toolbar>
      </AppBar>

      <Dialog
        onClose={closeComposer}
        open={showPost}
        maxWidth="md"
        fullWidth
      >
        <Box component="form" onSubmit={handleCreatePost}>
          <DialogTitle>Make a post</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <TextField
                autoFocus
                multiline
                minRows={3}
                placeholder="Write a caption..."
                fullWidth
                variant="filled"
                value={caption}
                onChange={(event) => setCaption(event.target.value)}
                slotProps={{ htmlInput: { maxLength: 240 } }}
              />

              {stops.map((stop, index) => (
                <Stack
                  key={`stop-${index}`}
                  spacing={1.5}
                  sx={{
                    border: "1px solid #dbe4ea",
                    borderRadius: 1,
                    p: 2
                  }}
                >
                  <Typography variant="subtitle2">Stop {index + 1}</Typography>
                  <FormControl fullWidth>
                    <InputLabel>Bar</InputLabel>
                    <Select
                      value={stop.barId}
                      label="Bar"
                      onChange={(event) =>
                        updateStop(index, "barId", event.target.value)
                      }
                      required
                    >
                      {bars.map((bar) => (
                        <MenuItem key={bar.id} value={bar.id}>
                          {bar.neighborhood
                            ? `${bar.name} (${bar.neighborhood})`
                            : bar.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <TextField
                    label="Drinks at stop"
                    type="number"
                    slotProps={{ htmlInput: { min: 1 } }}
                    value={stop.drinkCount}
                    onChange={(event) =>
                      updateStop(
                        index,
                        "drinkCount",
                        Math.max(1, Number(event.target.value) || 1)
                      )
                    }
                  />

                  <TextField
                    label="Stop note (optional)"
                    value={stop.note}
                    onChange={(event) =>
                      updateStop(index, "note", event.target.value)
                    }
                    slotProps={{ htmlInput: { maxLength: 120 } }}
                  />

                  <Box>
                    <Button
                      type="button"
                      onClick={() => removeStop(index)}
                      disabled={stops.length <= 1}
                    >
                      Remove Stop
                    </Button>
                  </Box>
                </Stack>
              ))}

              <Box>
                <Button type="button" onClick={addStop}>
                  Add Stop
                </Button>
              </Box>

              <Typography variant="body2">
                Total drinks:{" "}
                {stops.reduce((sum, stop) => sum + stop.drinkCount, 0)}
              </Typography>

              {errorMessage ? (
                <Typography color="error" variant="body2">
                  {errorMessage}
                </Typography>
              ) : null}
            </Stack>
          </DialogContent>

          <DialogActions>
            <Button onClick={closeComposer} type="button">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isSaving || bars.length === 0}
            >
              {isSaving ? "Posting..." : "Post"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}

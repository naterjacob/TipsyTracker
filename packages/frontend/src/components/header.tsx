import { useEffect, useState, type FormEvent } from "react";
import { useUser, UserButton } from "@clerk/clerk-react";
import {  useNavigate } from "react-router-dom";
import {
  AppBar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  TextField,
  Toolbar,
  Typography,
  useMediaQuery
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import PersonIcon from "@mui/icons-material/Person";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import PlaceIcon from "@mui/icons-material/Place";
import Loading from "./ui/Loading";
import { useAuthedFetch } from "../lib/api";

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

export default function Header({ onPostCreated = () => { } }: HeaderProps) {
  const navigate = useNavigate();
  const authedFetch = useAuthedFetch();
  const { user } = useUser();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const [showPost, setShowPost] = useState(false);
  const [bars, setBars] = useState<Bar[]>([]);
  const [isLoadingBars, setIsLoadingBars] = useState(false);
  const [caption, setCaption] = useState("");
  const [stops, setStops] = useState<DraftStopInput[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (!showPost) return;
    let isMounted = true;

    async function loadBars() {
      setIsLoadingBars(true);
      const response = await authedFetch("/api/bars");
      if (!response.ok) {
        if (isMounted) {
          setErrorMessage("Failed to load bars.");
          setIsLoadingBars(false);
        }
        return;
      }

      const data = (await response.json()) as { bars?: Bar[] };
      if (!isMounted) return;
      const nextBars = data.bars ?? [];
      setBars(nextBars);
      setIsLoadingBars(false);
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

    // If any later step fails, delete the orphaned draft so it doesn't linger.
    const failWith = async (message: string) => {
      await authedFetch(`/api/posts/${postId}`, { method: "DELETE" }).catch(
        () => {}
      );
      setIsSaving(false);
      setErrorMessage(message);
    };

    const captionResponse = await authedFetch(`/api/posts/${postId}`, {
      method: "PATCH",
      body: JSON.stringify({ caption: caption.trim() || null })
    });
    if (!captionResponse.ok) {
      await failWith("Could not save caption.");
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
        await failWith("Could not add one of the stops.");
        return;
      }
    }

    const publishResponse = await authedFetch(`/api/posts/${postId}/publish`, {
      method: "POST"
    });

    if (!publishResponse.ok) {
      await failWith("Could not publish post.");
      return;
    }

    setIsSaving(false);
    closeComposer();
    setShowSuccess(true);
    onPostCreated();
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" sx={{ mb: 2 }}>
        <Toolbar>
          <Typography
            component="button"
            onClick={() => navigate(`/home`)}
            aria-label="TipsyTracker home"
            sx={{
              border: "none",
              background: "none",
              p: 0,
              cursor: "pointer",
              color: "primary.main",
              fontStyle: "italic",
              fontSize: "1.75rem",
              fontWeight: "bold",
              fontFamily: "inherit",
              "&:hover": { opacity: 0.85 },
            }}
          >
            TipsyTracker
          </Typography>

          <Box sx={{ flexGrow: 1 }} />

          <Stack spacing={2} direction="row" sx={{ alignItems: "center" }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => setShowPost(true)}
              type="button"
              aria-label="Create a new post"
              sx={{ display: { xs: "none", sm: "inline-flex" } }}
            >
              New post
            </Button>
            <IconButton
              color="primary"
              onClick={() => setShowPost(true)}
              aria-label="Create a new post"
              sx={{ display: { xs: "inline-flex", sm: "none" } }}
            >
              <AddIcon />
            </IconButton>

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
                    onClick={() => navigate(`/account`)}
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
        fullScreen={fullScreen}
      >
        <Box component="form" onSubmit={handleCreatePost}>
          <DialogTitle sx={{ pb: 0.5 }}>
            New post
            <Typography variant="body2" color="text.secondary">
              Log your night out, one stop at a time.
            </Typography>
          </DialogTitle>
          <DialogContent>
            {isLoadingBars ? (
              <Loading label="Loading bars…" />
            ) : (
              <Stack spacing={3} sx={{ pt: 2 }}>
                <TextField
                  autoFocus
                  multiline
                  minRows={2}
                  label="Caption"
                  placeholder="How was the night?"
                  fullWidth
                  value={caption}
                  onChange={(event) => setCaption(event.target.value)}
                  slotProps={{ htmlInput: { maxLength: 240 } }}
                  helperText={`${caption.length}/240`}
                />

                <Box>
                  <Stack
                    direction="row"
                    sx={{
                      alignItems: "center",
                      justifyContent: "space-between",
                      mb: 1
                    }}
                  >
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      Stops
                    </Typography>
                    <Chip
                      size="small"
                      label={`${stops.reduce(
                        (sum, stop) => sum + stop.drinkCount,
                        0
                      )} drinks total`}
                      color="primary"
                      variant="outlined"
                    />
                  </Stack>

                  <Stack spacing={2}>
                    {stops.map((stop, index) => (
                      <Box
                        key={`stop-${index}`}
                        sx={{
                          border: 1,
                          borderColor: "divider",
                          borderRadius: 2,
                          p: 2,
                          bgcolor: "background.default"
                        }}
                      >
                        <Stack
                          direction="row"
                          sx={{
                            alignItems: "center",
                            justifyContent: "space-between",
                            mb: 1.5
                          }}
                        >
                          <Stack
                            direction="row"
                            spacing={1}
                            sx={{ alignItems: "center" }}
                          >
                            <PlaceIcon fontSize="small" color="primary" />
                            <Typography
                              variant="subtitle2"
                              sx={{ fontWeight: 700 }}
                            >
                              Stop {index + 1}
                            </Typography>
                          </Stack>
                          <IconButton
                            aria-label={`Remove stop ${index + 1}`}
                            size="small"
                            onClick={() => removeStop(index)}
                            disabled={stops.length <= 1}
                          >
                            <DeleteOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Stack>

                        <Stack spacing={1.5}>
                          <FormControl fullWidth size="small">
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
                                    ? `${bar.name} · ${bar.neighborhood}`
                                    : bar.name}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>

                          <Stack
                            direction={{ xs: "column", sm: "row" }}
                            spacing={1.5}
                          >
                            <TextField
                              label="Drinks"
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
                              sx={{ width: { xs: "100%", sm: 120 } }}
                            />
                            <TextField
                              label="Note (optional)"
                              placeholder="What did you drink?"
                              value={stop.note}
                              onChange={(event) =>
                                updateStop(index, "note", event.target.value)
                              }
                              slotProps={{ htmlInput: { maxLength: 120 } }}
                              sx={{ flexGrow: 1 }}
                            />
                          </Stack>
                        </Stack>
                      </Box>
                    ))}
                  </Stack>

                  <Button
                    type="button"
                    onClick={addStop}
                    startIcon={<AddIcon />}
                    sx={{ mt: 2 }}
                  >
                    Add another stop
                  </Button>
                </Box>

                {errorMessage ? (
                  <Typography color="error" variant="body2">
                    {errorMessage}
                  </Typography>
                ) : null}
              </Stack>
            )}
          </DialogContent>

          <Divider />
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={closeComposer} type="button" color="inherit">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isSaving || isLoadingBars || bars.length === 0}
            >
              {isSaving ? "Posting…" : "Share post"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Snackbar
        open={showSuccess}
        autoHideDuration={3000}
        onClose={() => setShowSuccess(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        message="Post shared!"
      />
    </Box>
  );
}

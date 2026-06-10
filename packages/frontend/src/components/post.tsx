import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  IconButton,
  Link,
  Menu,
  MenuItem,
  Stack,
  Typography
} from "@mui/material";
import FavoriteIcon from "@mui/icons-material/Favorite";
import CommentIcon from "@mui/icons-material/Comment";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Comment from "./comment";
import { useAuthedFetch } from "../lib/api";

type PostProps = {
  id: string;
  displayName: string | null;
  username: string | null;
  avatarUrl: string | null;
  caption: string | null;
  imageUrl: string | null;
  barCount: number;
  totalDrinks: number;
  publishedAt: number;
  /** Show owner controls (delete) when true. */
  isOwn?: boolean;
  /** Called after this post is successfully deleted. */
  onDeleted?: (id: string) => void;
};

export default function Post({
  id,
  displayName,
  username,
  avatarUrl,
  caption,
  imageUrl,
  barCount,
  totalDrinks,
  publishedAt,
  isOwn = false,
  onDeleted
}: PostProps) {
  const initialsSource = displayName || username || "U";
  const initials = initialsSource.slice(0, 1).toUpperCase();
  const [showComments, setShowComments] = useState(false);
  const [menuAnchor, setMenuAnchor] =
    useState<null | HTMLElement>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();

  const authedFetch = useAuthedFetch();
  const [likeCount, setLikeCount] = useState(0);
  const [likedByMe, setLikedByMe] = useState(false);
  const [commentCount, setCommentCount] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function fetchLikes() {
      const res = await authedFetch(`/api/posts/${id}/likes`);

      if (!res.ok) {
        console.error("Failed to fetch likes", res.status);
        return;
      }

      const data = await res.json();
      if (!isMounted) return;
      setLikeCount(data.likeCount ?? 0);
      setLikedByMe(data.likedByMe ?? false);
    }

    async function fetchCommentCount() {
      const res = await authedFetch(
        `/api/posts/${id}/comments`
      );
      if (!res.ok) return;
      const data = (await res.json()) as {
        comments?: unknown[];
      };
      if (!isMounted) return;
      setCommentCount(data.comments?.length ?? 0);
    }

    void fetchLikes();
    void fetchCommentCount();

    return () => {
      isMounted = false;
    };
  }, [authedFetch, id]);

  async function handleLikeToggle() {
    const method = likedByMe ? "DELETE" : "POST";

    const res = await authedFetch(`/api/posts/${id}/likes`, {
      method
    });

    if (!res.ok) {
      console.error("Failed to toggle like");
      return;
    }

    if (likedByMe) {
      setLikedByMe(false);
      setLikeCount((count) => Math.max(0, count - 1));
    } else {
      setLikedByMe(true);
      setLikeCount((count) => count + 1);
    }
  }

  async function handleDelete() {
    setMenuAnchor(null);
    if (
      !window.confirm("Delete this post? This can't be undone.")
    )
      return;
    setIsDeleting(true);
    const res = await authedFetch(`/api/posts/${id}`, {
      method: "DELETE"
    });
    setIsDeleting(false);
    if (!res.ok) {
      console.error("Failed to delete post", res.status);
      return;
    }
    onDeleted?.(id);
  }

  return (
    <Card component="article">
      <CardContent>
        <Stack
          direction="row"
          spacing={1.5}
          sx={{ alignItems: "center", mb: 1.5 }}>
          <Avatar
            src={avatarUrl ?? undefined}
            sx={{
              cursor: username ? "pointer" : "default"
            }}
            onClick={() =>
              username && navigate(`/users/${username}`)
            }>
            {initials}
          </Avatar>
          <Box sx={{ minWidth: 0, flexGrow: 1 }}>
            {username ? (
              <Link
                component="button"
                type="button"
                underline="hover"
                color="text.primary"
                onClick={() => navigate(`/users/${username}`)}
                sx={{
                  fontWeight: 700,
                  display: "block",
                  textAlign: "left"
                }}>
                {displayName || username}
              </Link>
            ) : (
              <Typography sx={{ fontWeight: 700 }}>
                {displayName || "Unknown user"}
              </Typography>
            )}
            <Typography
              variant="caption"
              color="text.secondary">
              {username ? `@${username}` : "No username"} ·{" "}
              {new Date(
                publishedAt * 1000
              ).toLocaleDateString()}
            </Typography>
          </Box>

          {isOwn ? (
            <>
              <IconButton
                aria-label="Post options"
                onClick={(event) =>
                  setMenuAnchor(event.currentTarget)
                }
                disabled={isDeleting}>
                <MoreVertIcon />
              </IconButton>
              <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={() => setMenuAnchor(null)}>
                <MenuItem
                  onClick={handleDelete}
                  sx={{ color: "error.main" }}>
                  Delete post
                </MenuItem>
              </Menu>
            </>
          ) : null}
        </Stack>

        <Typography
          sx={{ mb: 2 }}
          color={caption ? "text.primary" : "text.secondary"}>
          {caption || "No caption"}
        </Typography>

        {imageUrl ? (
          <Box
            component="img"
            src={imageUrl}
            alt=""
            sx={{
              display: "block",
              width: "100%",
              aspectRatio: "16 / 10",
              objectFit: "cover",
              borderRadius: 1,
              mb: 2
            }}
          />
        ) : null}

        <Stack
          direction="row"
          sx={{
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 1
          }}>
          <Stack spacing={1} direction="row">
            <Button
              variant="outlined"
              color="primary"
              onClick={handleLikeToggle}
              aria-label={
                likedByMe ? "Unlike post" : "Like post"
              }
              aria-pressed={likedByMe}
              startIcon={
                <FavoriteIcon
                  color={likedByMe ? "error" : "inherit"}
                />
              }>
              {likeCount}
            </Button>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => setShowComments(true)}
              type="button"
              aria-label="View comments"
              startIcon={<CommentIcon />}>
              {commentCount}
            </Button>
          </Stack>

          <Stack direction="row" spacing={2}>
            <Box sx={{ textAlign: "center" }}>
              <Typography
                sx={{ fontWeight: 700, lineHeight: 1 }}>
                {barCount}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary">
                Stops
              </Typography>
            </Box>
            <Box sx={{ textAlign: "center" }}>
              <Typography
                sx={{ fontWeight: 700, lineHeight: 1 }}>
                {totalDrinks}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary">
                Drinks
              </Typography>
            </Box>
          </Stack>
        </Stack>

        {showComments && (
          <Comment
            postId={id}
            onClose={() => setShowComments(false)}
          />
        )}
      </CardContent>
    </Card>
  );
}

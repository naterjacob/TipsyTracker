import {
  Avatar,
  Button,
  Card,
  CardContent,
  CardHeader,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { useEffect, useState } from "react";
import { useAuthedFetch } from "../lib/api";

type CommentProps = {
  postId: string;
  onClose: () => void;
};

type Comment = {
  id: string;
  content: string;
  publishedAt: number;
  author: {
    id: string;
    username: string | null;
    displayName: string | null;
    avatarUrl: string | null;
  };
};

export default function Comment({ postId, onClose }: CommentProps) {
  const authedFetch = useAuthedFetch();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isPosting, setIsPosting] = useState(false);

  async function fetchComments() {
    const res = await authedFetch(`/api/posts/${postId}/comments`);
    if (!res.ok) {
      console.error("Failed to fetch comments", res.status);
      return;
    }

    const data = (await res.json()) as { comments: Comment[] };
    setComments(data.comments);
  }

  useEffect(() => {
    let isCurrent = true;

    void authedFetch(`/api/posts/${postId}/comments`).then(
      async (res) => {
        if (!res.ok) {
          console.error("Failed to fetch comments", res.status);
          return;
        }

        const data = (await res.json()) as { comments: Comment[] };
        if (isCurrent) {
          setComments(data.comments);
        }
      }
    );

    return () => {
      isCurrent = false;
    };
  }, [authedFetch, postId]);

  async function handlePostComment() {
    if (!newComment.trim()) return;

    setIsPosting(true);

    const res = await authedFetch(`/api/posts/${postId}/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        content: newComment
      })
    });

    setIsPosting(false);

    if (!res.ok) {
      console.error("Failed to post comment", res.status);
      return;
    }

    const data = (await res.json()) as { comment: Comment };

    setComments((prev) => [data.comment, ...prev]);
    setNewComment("");
    await fetchComments();
  }

  return (
    <Dialog
      open={true}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      scroll="paper"
    >
      <DialogTitle>Comments</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField
            autoFocus
            multiline
            minRows={3}
            placeholder="Write a comment..."
            fullWidth
            variant="filled"
            value={newComment}
            onChange={(event) => setNewComment(event.target.value)}
            slotProps={{ htmlInput: { maxLength: 240 } }}
          />
          {comments.map((comment) => (
            <Card key={comment.id} sx={{ mb: 2 }}>
              <CardHeader
                title={
                  comment.author?.displayName ||
                  comment.author?.username ||
                  "Unknown user"
                }
                subheader={`${
                  comment.author?.username
                    ? `@${comment.author.username}`
                    : "No username"
                } · ${new Date(
                  comment.publishedAt * 1000
                ).toLocaleDateString()}`}
                avatar={
                  <Avatar src={comment.author?.avatarUrl ?? undefined}>
                    {comment.author?.displayName?.[0]?.toUpperCase() ||
                      comment.author?.username?.[0]?.toUpperCase() ||
                      "U"}
                  </Avatar>
                }
                sx={{
                  borderBottom: 1,
                  borderBottomColor: "divider"
                }}
              />
              <CardContent>
                <Typography variant="body1">
                  {comment.content}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button
          variant="contained"
          onClick={handlePostComment}
          disabled={isPosting || !newComment.trim()}
        >
          {isPosting ? "Posting..." : "Post"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

import "./post.css";
import { Button, Stack } from "@mui/material";
import FavoriteIcon from "@mui/icons-material/Favorite";
import CommentIcon from "@mui/icons-material/Comment";
import { useEffect, useState } from "react";
import Comment from "./comment";
import { useAuthedFetch } from "../lib/api";

type PostProps = {
  id: string;
  displayName: string | null;
  username: string | null;
  avatarUrl: string | null;
  caption: string | null;
  barCount: number;
  totalDrinks: number;
  publishedAt: number;
};



export default function Post({
  id,
  displayName,
  username,
  avatarUrl,
  caption,
  barCount,
  totalDrinks,
  publishedAt
}: PostProps) {
  const initialsSource = displayName || username || "U";
  const initials = initialsSource.slice(0, 1).toUpperCase();
  const [showComments, setShowComments] = useState(false);

  const authedFetch = useAuthedFetch();
  const [likeCount, setLikeCount] = useState(0);
  const [likedByMe, setLikedByMe] = useState(false);

  useEffect(() => {
    async function fetchLikes() {
      const res = await authedFetch(`/api/posts/${id}/likes`);

      if (!res.ok) {
        console.error("Failed to fetch likes", res.status);
        return;
      }

      const data = await res.json();

      setLikeCount(data.likeCount ?? 0);
      setLikedByMe(data.likedByMe ?? false);
    }

    fetchLikes();
  }, [authedFetch, id]);

  async function handleLikeToggle() {
  const method = likedByMe ? "DELETE" : "POST";

  const res = await authedFetch(
    `/api/posts/${id}/likes`,
    {
      method,
    }
  );

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

  return (
    <article className="tt-post-card">
      <header className="tt-post-head">
        <div className="tt-post-user">
          {avatarUrl ? (
            <img className="tt-post-icon" src={avatarUrl} alt="" />
          ) : (
            <div className="tt-post-icon tt-post-icon-fallback">{initials}</div>
          )}
          <div>
            <h4 className="tt-post-name">{displayName || username || "Unknown user"}</h4>
            <p className="tt-post-meta">
              {username ? `@${username}` : "No username"} ·{" "}
              {new Date(publishedAt * 1000).toLocaleDateString()}
            </p>
          </div>
        </div>
      </header>

      <div className="tt-post-caption-section">
        <p className="tt-post-caption">{caption || "No caption"}</p>
      </div>

      <div className="tt-post-bottom">
        <Stack spacing={2} direction="row">
          <Button
            variant="outlined"
            onClick={handleLikeToggle}
            sx={{
              color: "#034078",
              borderColor: "#034078"
            }}
          >
            <FavoriteIcon color={likedByMe ? "error" : "inherit"}/>
            {likeCount}
          </Button>
          <div>
            <Button
              variant="outlined"
              sx={{
                color: "#034078",
                borderColor: "#034073"
              }}
              onClick={() => setShowComments(true)}
              type="button"
            >
              <CommentIcon></CommentIcon>
            </Button>
            {showComments && (
              <Comment postId={id} onClose={() => setShowComments(false)} />
            )}
          </div>
        </Stack>
        <dl className="tt-post-drinks">
          <div className="tt-drink">
            <dt>Stops</dt>
            <dd>{barCount}</dd>
          </div>
          <div className="tt-drink">
            <dt>Drinks</dt>
            <dd>{totalDrinks}</dd>
          </div>
        </dl>
      </div>
    </article>
  );
}

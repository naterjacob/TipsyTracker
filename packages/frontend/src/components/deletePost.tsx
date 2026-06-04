import { useState } from "react";
import { useAuthedFetch } from "../lib/api";
import "./deletePost.css";

type DeletePostProps = {
  postId: string;
  onDeleted?: () => void;
  className?: string;
};

export default function DeletePost({
  postId,
  onDeleted = () => {},
  className = ""
}: DeletePostProps) {
  const authedFetch = useAuthedFetch();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setError(null);
    setIsDeleting(true);

    const response = await authedFetch(`/api/posts/${postId}`, {
      method: "DELETE"
    });

    setIsDeleting(false);

    if (!response.ok) {
      setError("Could not delete post.");
      return;
    }

    setIsConfirming(false);
    onDeleted();
  }

  if (isConfirming) {
    return (
      <div
        className={`delete-post delete-post-confirm ${className}`.trim()}
        role="group"
        aria-label="Confirm delete post"
      >
        <p className="delete-post-prompt">Delete this post?</p>
        <div className="delete-post-actions">
          <button
            className="button muted-button"
            type="button"
            disabled={isDeleting}
            onClick={() => {
              setIsConfirming(false);
              setError(null);
            }}
          >
            Cancel
          </button>
          <button
            className="button delete-post-button"
            type="button"
            disabled={isDeleting}
            onClick={() => void handleDelete()}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
        {error ? <p className="delete-post-error">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className={`delete-post ${className}`.trim()}>
      <button
        className="button muted-button delete-post-trigger"
        type="button"
        aria-label="Delete post"
        onClick={() => setIsConfirming(true)}
      >
        Delete
      </button>
    </div>
  );
}

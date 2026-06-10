import { useCallback, useEffect, useState } from "react";
import { Stack } from "@mui/material";
import { useUser } from "@clerk/clerk-react";
import { useAuthedFetch } from "../lib/api";
import Post from "./post";
import Loading from "./ui/Loading";
import ErrorState from "./ui/ErrorState";
import EmptyState from "./ui/EmptyState";

type FeedPost = {
  id: string;
  caption: string | null;
  imageUrl: string | null;
  totalDrinks: number;
  barCount: number;
  publishedAt: number;
  author: {
    displayName: string | null;
    username: string | null;
    avatarUrl: string | null;
  };
};

type FeedProps = {
  refreshToken: number;
};

export default function Feed({ refreshToken }: FeedProps) {
  const authedFetch = useAuthedFetch();
  const { user } = useUser();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function loadFeed() {
      if (isMounted) {
        setIsLoading(true);
      }
      setError(null);
      const response = await authedFetch("/api/feed?limit=20");
      if (!response.ok) {
        if (isMounted) {
          setError("Could not load feed.");
          setIsLoading(false);
        }
        return;
      }

      const data = (await response.json()) as { posts?: FeedPost[] };
      if (isMounted) {
        setPosts(data.posts ?? []);
        setIsLoading(false);
      }
    }

    void loadFeed();
    return () => {
      isMounted = false;
    };
  }, [authedFetch, refreshToken, retryToken]);

  const retry = useCallback(() => setRetryToken((value) => value + 1), []);

  const handleDeleted = useCallback(
    (id: string) => setPosts((current) => current.filter((p) => p.id !== id)),
    []
  );

  const myUsername = user?.username?.toLowerCase() ?? null;

  if (isLoading) {
    return <Loading label="Loading feed..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={retry} />;
  }

  if (posts.length === 0) {
    return (
      <EmptyState
        title="No posts yet"
        description='Be the first to log a night out. Tap "New post" to get started.'
      />
    );
  }

  return (
    <Stack component="section" spacing={2} aria-label="Feed posts">
      {posts.map((post) => (
        <Post
          key={post.id}
          id={post.id}
          displayName={post.author.displayName}
          username={post.author.username}
          avatarUrl={post.author.avatarUrl}
          caption={post.caption}
          imageUrl={post.imageUrl}
          barCount={post.barCount}
          totalDrinks={post.totalDrinks}
          publishedAt={post.publishedAt}
          isOwn={
            !!myUsername &&
            post.author.username?.toLowerCase() === myUsername
          }
          onDeleted={handleDeleted}
        />
      ))}
    </Stack>
  );
}

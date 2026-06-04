import { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { useAuthedFetch } from "../lib/api";
import Post from "./post";

type FeedPost = {
  id: string;
  caption: string | null;
  totalDrinks: number;
  barCount: number;
  publishedAt: number;
  author: {
    id: string;
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
  const currentUserId = user?.id ?? null;
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
  }, [authedFetch, refreshToken]);

  if (isLoading) {
    return <p>Loading feed...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  if (posts.length === 0) {
    return <p>No posts yet.</p>;
  }

  return (
    <section className="home-feed" aria-label="Feed posts">
      {posts.map((post) => (
        <Post
          key={post.id}
          id={post.id}
          displayName={post.author.displayName}
          username={post.author.username}
          avatarUrl={post.author.avatarUrl}
          caption={post.caption}
          barCount={post.barCount}
          totalDrinks={post.totalDrinks}
          publishedAt={post.publishedAt}
          canDelete={currentUserId === post.author.id}
          onDeleted={() =>
            setPosts((current) => current.filter((item) => item.id !== post.id))
          }
        />
      ))}
    </section>
  );
}

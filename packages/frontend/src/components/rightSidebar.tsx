import { useEffect, useState } from "react";
import { useAuthedFetch } from "../lib/api";
import "./rightSidebar.css";

type FeedPost = {
  id: string;
  totalDrinks: number;
  publishedAt: number;
  author: {
    displayName: string | null;
    username: string | null;
    avatarUrl: string | null;
  };
};

type LeaderboardEntry = {
  name: string;
  username: string | null;
  avatarUrl: string | null;
  totalDrinks: number;
};

const hangoverCures = [
  {
    title: "Hydrate first",
    description:
      "Drink water or an electrolyte drink before coffee. Dehydration is usually the first thing to fix.",
  },
  {
    title: "Eat something simple",
    description:
      "Toast, eggs, bananas, soup, or oatmeal can help settle your stomach and bring your energy back. Carbs are your best friend.",
  },
  {
    title: "Get extra sleep",
    description:
      "The most reliable reset is rest. A short nap can do more than forcing yourself through the morning.",
  },
  {
    title: "Take it easy",
    description:
      "Skip intense workouts until you feel normal. A light walk is usually better than pushing hard.",
  },
  {
    title: "Avoid more alcohol",
    description:
      "The “hair of the dog” usually delays recovery. Give your body time to catch up.",
  },
  {
    title: "Hair of the dog",
    description:
      "Pending on your plans for day and productivity level if you still wake up feeling it sometimes another drink isn't the end of the world.",
  },{
    title: "Yak it all out",
    description:
      "If you feel nauseated still, sometimes the best way to get over it is to pull trig and get it all out of your system. Just make sure after you get it all out to have something to eat and drink and brush your teeth.",
  },
  {
    title: "Redbull no vodka",
    description:
      "Make sure to properly drink electrolytes, but caffeine can give that little extra boost needed to get you through the day or keep you going until the next nap. drinking an energy drink and taking a power nap right after is the key.",
  },
];

function getPriorNightRange() {
  const now = new Date();

  const start = new Date(now);
  start.setDate(now.getDate() - 1);
  start.setHours(18, 0, 0, 0);

  const end = new Date(now);
  end.setHours(6, 0, 0, 0);

  if (now.getHours() < 6) {
    start.setDate(start.getDate() - 1);
    end.setDate(end.getDate() - 1);
  }

  return { start: start.getTime(), end: end.getTime() };
}

function buildLeaderboard(posts: FeedPost[]) {
  const { start, end } = getPriorNightRange();
  const totalsByUser = new Map<string, LeaderboardEntry>();

  posts
    .filter((post) => post.publishedAt >= start && post.publishedAt <= end)
    .forEach((post) => {
      const username = post.author.username;
      const displayName = post.author.displayName ?? username ?? "Anonymous";
      const key = username ?? displayName;
      const existing = totalsByUser.get(key);

      if (existing) {
        existing.totalDrinks += post.totalDrinks;
      } else {
        totalsByUser.set(key, {
          name: displayName,
          username,
          avatarUrl: post.author.avatarUrl,
          totalDrinks: post.totalDrinks,
        });
      }
    });

  return [...totalsByUser.values()]
    .sort((first, second) => second.totalDrinks - first.totalDrinks)
    .slice(0, 3);
}

function initialsFor(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function RightSidebar() {
  const authedFetch = useAuthedFetch();
  const [currentCureIndex, setCurrentCureIndex] = useState(0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const currentCure = hangoverCures[currentCureIndex];

  useEffect(() => {
  const timer = window.setInterval(() => {
    setCurrentCureIndex((index) => (index + 1) % hangoverCures.length);
  }, 10000);

  return () => window.clearInterval(timer);
}, []);

  useEffect(() => {
    let isMounted = true;

    async function loadLeaderboard() {
      const response = await authedFetch("/api/feed?limit=100");

      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as { posts?: FeedPost[] };

      if (isMounted) {
        setLeaderboard(buildLeaderboard(data.posts ?? []));
      }
    }

    void loadLeaderboard();

    return () => {
      isMounted = false;
    };
  }, [authedFetch]);


  return (
    <aside className="right-sidebar" aria-label="Tips and leaderboard">
      <section className="sidebar-card cure-card" aria-label="Hangover cures">
    <p className="sidebar-eyebrow">Hangover cure</p>
    <h2>{currentCure.title}</h2>
    <p>{currentCure.description}</p>
    </section>

      <section
        className="sidebar-card leaderboard-card"
        aria-label="Prior night drink leaderboard"
      >
        <p className="sidebar-eyebrow">Last night</p>
        <h2>Top drinkers</h2>

        {leaderboard.length === 0 ? (
          <p className="empty-leaderboard">
            No drinks logged from last night yet.
          </p>
        ) : (
          <ol className="leaderboard-list">
            {leaderboard.map((entry, index) => (
              <li key={entry.username ?? entry.name} className="leaderboard-row">
                <span className="leaderboard-rank">#{index + 1}</span>

                {entry.avatarUrl ? (
                  <img
                    className="leaderboard-avatar"
                    src={entry.avatarUrl}
                    alt=""
                  />
                ) : (
                  <span className="leaderboard-avatar leaderboard-avatar-fallback">
                    {initialsFor(entry.name)}
                  </span>
                )}

                <span className="leaderboard-person">
                  <strong>{entry.name}</strong>
                  {entry.username ? <small>@{entry.username}</small> : null}
                </span>

                <strong className="leaderboard-drinks">
                  {entry.totalDrinks}
                </strong>
              </li>
            ))}
          </ol>
        )}
      </section>
    </aside>
  );
}
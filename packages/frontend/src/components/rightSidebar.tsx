import { useEffect, useState } from "react";
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Stack,
  Typography
} from "@mui/material";
import { useAuthedFetch } from "../lib/api";

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
      "Drink water or an electrolyte drink before coffee. Rehydrating is usually the first thing to fix.",
  },
  {
    title: "Eat something simple",
    description:
      "Toast, eggs, bananas, or oatmeal can settle your stomach and bring your energy back. Carbs are your friend.",
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
    title: "Go easy on more alcohol",
    description:
      "The “hair of the dog” usually just delays recovery. Give your body time to catch up.",
  },
  {
    title: "Caffeine in moderation",
    description:
      "A little caffeine can help you feel human again, but pair it with water so you don't get more dehydrated.",
  },
  {
    title: "Settle your stomach",
    description:
      "If you feel nauseated, ginger tea or an antacid can help. Once it passes, eat something light and brush your teeth.",
  },
  {
    title: "Plan ahead next time",
    description:
      "Alternating water between drinks and eating before you go out makes the next morning much easier.",
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


  const eyebrowSx = {
    color: "text.secondary",
    fontSize: "0.72rem",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    mb: 0.5
  };

  return (
    <Stack spacing={2} component="aside" aria-label="Tips and leaderboard">
      <Card aria-label="Hangover cures">
        <CardContent>
          <Typography sx={eyebrowSx}>Hangover cure</Typography>
          <Typography variant="h6" sx={{ mb: 1 }}>
            {currentCure.title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {currentCure.description}
          </Typography>
        </CardContent>
      </Card>

      <Card aria-label="Prior night drink leaderboard">
        <CardContent>
          <Typography sx={eyebrowSx}>Last night · 6pm–6am</Typography>
          <Typography variant="h6" sx={{ mb: 1.5 }}>
            Top drinkers
          </Typography>

          {leaderboard.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No drinks logged during last night's window (6pm–6am) yet.
            </Typography>
          ) : (
            <Stack spacing={1.5} component="ol" sx={{ m: 0, p: 0, listStyle: "none" }}>
              {leaderboard.map((entry, index) => (
                <Stack
                  key={entry.username ?? entry.name}
                  component="li"
                  direction="row"
                  spacing={1.25}
                  sx={{ alignItems: "center" }}
                >
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontWeight: 700, width: 24 }}
                  >
                    #{index + 1}
                  </Typography>
                  <Avatar
                    src={entry.avatarUrl ?? undefined}
                    sx={{ width: 34, height: 34, fontSize: "0.8rem" }}
                  >
                    {initialsFor(entry.name)}
                  </Avatar>
                  <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                    <Typography sx={{ fontWeight: 700 }} noWrap>
                      {entry.name}
                    </Typography>
                    {entry.username ? (
                      <Typography variant="caption" color="text.secondary" noWrap>
                        @{entry.username}
                      </Typography>
                    ) : null}
                  </Box>
                  <Typography sx={{ fontWeight: 700 }}>
                    {entry.totalDrinks}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>
    </Stack>
  );
}
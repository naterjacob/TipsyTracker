import { Hono, type Context } from "hono";
import type { MiddlewareHandler } from "hono";
import { createClerkClient } from "@clerk/backend";
import { cors } from "hono/cors";
import {
  getDatabase,
  type AppBindings,
  type AppVariables
} from "./db";
import {
  addDraftStop,
  createDraftPost,
  deleteOwnedPost,
  deleteDraftStop,
  getPostDetails,
  getUserProfile,
  listBars,
  listFeed,
  listUserPosts,
  publishDraftPost,
  syncUser,
  updateDraftCaption,
  updateDraftStop
} from "./dal";

type AppEnv = {
  Bindings: AppBindings;
  Variables: AppVariables;
};

const app = new Hono<AppEnv>();

app.use(
  "/api/*",
  cors({
    origin: "http://localhost:5173",
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"]
  })
);

const clampLimit = (
  rawLimit: string | undefined,
  defaultLimit = 20,
  maxLimit = 50
) => {
  const parsed = Number.parseInt(rawLimit ?? "", 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return defaultLimit;
  }

  return Math.min(parsed, maxLimit);
};

const parseCursor = (rawCursor: string | undefined) => {
  if (!rawCursor) return null;
  const parsed = Number.parseInt(rawCursor, 10);
  if (Number.isNaN(parsed)) return null;
  return parsed;
};

type ProfileBody = {
  username: string;
  display_name: string;
  avatar_url?: string;
  bio?: string;
};

const requireAuth: MiddlewareHandler<AppEnv> = async (
  c,
  next
) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const clerk = createClerkClient({
    secretKey: c.env.CLERK_SECRET_KEY,
    publishableKey: c.env.CLERK_PUBLISHABLE_KEY
  });

  const requestState = await clerk.authenticateRequest(
    c.req.raw
  );

  const auth = requestState.toAuth();

  if (!auth?.userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  c.set("userId", auth.userId);

  await next();
};

app.get("/api/health", (c) => c.json({ status: "ok" }));

app.get("/api/bars", async (c) => {
  const bars = await listBars(getDatabase(c));
  return c.json({ bars });
});

app.post("/api/auth/sync", async (c) => {
  const auth = await requireAuth(c, async () => {});
  if (auth) return auth;
  const userId = c.get("userId");
  await syncUser(getDatabase(c), {
    userId,
    username: null,
    displayName: null,
    avatarUrl: null,
    now: Math.floor(Date.now() / 1000)
  });

  return c.json({ ok: true, userId });
});

app.get("/api/feed", async (c) => {
  const auth = await requireAuth(c, async () => {});
  if (auth) return auth;

  const limit = clampLimit(c.req.query("limit"));
  const cursor = parseCursor(c.req.query("cursor"));

  const { posts, nextCursor } = await listFeed(getDatabase(c), {
    limit,
    cursor
  });
  return c.json({ posts, nextCursor });
});

app.get("/api/posts/:id", async (c) => {
  const auth = await requireAuth(c, async () => {});
  if (auth) return auth;
  const postId = c.req.param("id");
  const post = await getPostDetails(getDatabase(c), postId);
  if (!post) {
    return c.json({ error: "Not Found" }, 404);
  }
  return c.json({ post });
});

app.post("/api/posts", async (c) => {
  const auth = await requireAuth(c, async () => {});
  if (auth) return auth;
  const userId = c.get("userId");
  const post = await createDraftPost(getDatabase(c), {
    userId,
    now: Math.floor(Date.now() / 1000)
  });
  if (!post) {
    return c.json(
      {
        error: "Conflict",
        message: "User already has a draft post."
      },
      409
    );
  }
  return c.json({ post }, 201);
});

app.patch("/api/posts/:id", async (c) => {
  const auth = await requireAuth(c, async () => {});
  if (auth) return auth;
  const userId = c.get("userId");
  const postId = c.req.param("id");
  const payload = (await c.req.json().catch(() => null)) as {
    caption?: string;
  } | null;

  const post = await updateDraftCaption(getDatabase(c), {
    postId,
    userId,
    caption: payload?.caption ?? null
  });
  if (!post) return c.json({ error: "Not Found" }, 404);
  return c.json({ post });
});

app.post("/api/posts/:id/publish", async (c) => {
  const auth = await requireAuth(c, async () => {});
  if (auth) return auth;
  const userId = c.get("userId");
  const postId = c.req.param("id");

  const result = await publishDraftPost(getDatabase(c), {
    postId,
    userId,
    publishedAt: Math.floor(Date.now() / 1000)
  });
  if (result.kind === "not_found")
    return c.json({ error: "Not Found" }, 404);
  if (result.kind === "no_stops") {
    return c.json(
      {
        error: "Bad Request",
        message:
          "Draft must have at least one stop before publish."
      },
      400
    );
  }
  return c.json({ post: result.post });
});

app.delete("/api/posts/:id", async (c) => {
  const auth = await requireAuth(c, async () => {});
  if (auth) return auth;
  const userId = c.get("userId");
  const postId = c.req.param("id");
  const deleted = await deleteOwnedPost(getDatabase(c), {
    postId,
    userId
  });
  if (!deleted) {
    return c.json({ error: "Not Found" }, 404);
  }
  return c.body(null, 204);
});

app.post("/api/posts/:id/stops", async (c) => {
  const auth = await requireAuth(c, async () => {});
  if (auth) return auth;
  const userId = c.get("userId");
  const postId = c.req.param("id");
  const payload = (await c.req.json().catch(() => null)) as {
    barId?: string;
    drinkCount?: number;
    note?: string | null;
    arrivedAt?: number;
  } | null;

  if (!payload?.barId) {
    return c.json(
      { error: "Bad Request", message: "barId is required." },
      400
    );
  }
  const stop = await addDraftStop(getDatabase(c), {
    postId,
    userId,
    barId: payload.barId,
    drinkCount: payload.drinkCount ?? 0,
    note: payload.note ?? null,
    arrivedAt:
      payload.arrivedAt ?? Math.floor(Date.now() / 1000)
  });
  if (!stop) return c.json({ error: "Not Found" }, 404);

  return c.json({ stop }, 201);
});

app.patch("/api/posts/:id/stops/:stopId", async (c) => {
  const auth = await requireAuth(c, async () => {});
  if (auth) return auth;
  const userId = c.get("userId");
  const postId = c.req.param("id");
  const stopId = c.req.param("stopId");
  const payload = (await c.req.json().catch(() => null)) as {
    drinkCount?: number;
    note?: string | null;
  } | null;

  const stop = await updateDraftStop(getDatabase(c), {
    postId,
    stopId,
    userId,
    drinkCount: payload?.drinkCount,
    note: payload?.note
  });
  if (!stop) return c.json({ error: "Not Found" }, 404);
  return c.json({ stop });
});

app.delete("/api/posts/:id/stops/:stopId", async (c) => {
  const auth = await requireAuth(c, async () => {});
  if (auth) return auth;
  const userId = c.get("userId");
  const postId = c.req.param("id");
  const stopId = c.req.param("stopId");

  const deleted = await deleteDraftStop(getDatabase(c), {
    postId,
    stopId,
    userId
  });
  if (!deleted) {
    return c.json({ error: "Not Found" }, 404);
  }
  return c.body(null, 204);
});

app.get("/api/users/:id", async (c) => {
  const auth = await requireAuth(c, async () => {});
  if (auth) return auth;
  const userId = c.req.param("id");
  const profile = await getUserProfile(getDatabase(c), userId);
  if (!profile) return c.json({ error: "Not Found" }, 404);
  return c.json(profile);
});

app.get("/api/users/:id/posts", async (c) => {
  const auth = await requireAuth(c, async () => {});
  if (auth) return auth;
  const userId = c.req.param("id");
  const limit = clampLimit(c.req.query("limit"));
  const cursor = parseCursor(c.req.query("cursor"));
  const { posts, nextCursor } = await listUserPosts(
    getDatabase(c),
    { userId, limit, cursor }
  );
  return c.json({ posts, nextCursor });
});

app.patch("/api/users/me/profile", requireAuth, async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json<ProfileBody>();

  const username = body.username.trim().toLowerCase();
  const displayName = body.display_name.trim();
  const avatarUrl = body.avatar_url?.trim() || null;
  const bio = body.bio?.trim().slice(0, 50) || null;

  if (!username || !displayName) {
    return c.json(
      { error: "Username and display name are required" },
      400
    );
  }

  try {
    const result = await getDatabase(c)
      .prepare(
        `
        UPDATE users
        SET username = ?, display_name = ?, avatar_url = ?, bio = ?
        WHERE id = ?
        `
      )
      .bind(username, displayName, avatarUrl, bio, userId)
      .run();

    if ((result.meta.changes ?? 0) === 0) {
      return c.json(
        { error: "User not found. Run auth sync first." },
        404
      );
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error);
    if (
      message.includes(
        "UNIQUE constraint failed: users.username"
      )
    ) {
      return c.json(
        { error: "Username is already taken" },
        409
      );
    }
    throw error;
  }

  return c.json({ ok: true });
});

export default app;

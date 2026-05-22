import { Hono } from "hono";
import type { MiddlewareHandler } from "hono";
import { createClerkClient } from "@clerk/backend";
import {
  getDatabase,
  type AppBindings,
  type AppVariables
} from "./db";
import { cors } from "hono/cors";

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

type BarRow = {
  id: string;
  name: string;
  neighborhood: string | null;
  created_at: number;
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
  const result = await getDatabase(c)
    .prepare(
      "SELECT id, name, neighborhood, created_at FROM bars ORDER BY name ASC"
    )
    .all<BarRow>();

  return c.json({
    bars: result.results
  });
});

app.post("/api/auth/sync", requireAuth, async (c) => {
  const userId = c.get("userId");

  await getDatabase(c)
    .prepare(
      `
      INSERT INTO users (id, username, display_name, avatar_url, created_at)
      VALUES (?, NULL, NULL, NULL, unixepoch())
      ON CONFLICT(id) DO NOTHING
      `
    )
    .bind(userId)
    .run();

  return c.json({ ok: true, userId });
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

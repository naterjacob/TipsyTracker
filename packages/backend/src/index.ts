import { Hono } from "hono";
import { getDatabase, type AppBindings } from "./db";

const app = new Hono<{ Bindings: AppBindings }>();

app.get("/health", async (c) => {
  const result = await getDatabase(c).prepare("SELECT 1 AS ok").first<{ ok: number }>();

  return c.json({
    status: "ok",
    database: result?.ok === 1 ? "ok" : "unknown",
  });
});

export default app;

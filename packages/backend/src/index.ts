import { Hono } from "hono";
import { getDatabase, type AppBindings } from "./db";

const app = new Hono<{ Bindings: AppBindings }>();

type BarRow = {
  id: string;
  name: string;
  neighborhood: string | null;
  created_at: number;
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

export default app;

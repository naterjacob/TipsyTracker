import type { Context } from "hono";

export type AppBindings = {
  DB: D1Database;
};

export const getDatabase = (c: Context<{ Bindings: AppBindings }>) => c.env.DB;

import type { Context } from "hono";

export type AppBindings = {
  DB: D1Database;
  CLERK_SECRET_KEY: string;
  CLERK_PUBLISHABLE_KEY: string;
};

export type AppVariables = {
  userId: string;
};

export const getDatabase = (
  c: Context<{ Bindings: AppBindings; Variables: AppVariables }>
) => c.env.DB;

import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  createdAt: integer("created_at").notNull()
});

export const bars = sqliteTable("bars", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  neighborhood: text("neighborhood"),
  createdAt: integer("created_at").notNull()
});

export const posts = sqliteTable("posts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  caption: text("caption"),
  status: text("status", { enum: ["draft", "published"] }).notNull().default("draft"),
  totalDrinks: integer("total_drinks").notNull().default(0),
  createdAt: integer("created_at").notNull(),
  publishedAt: integer("published_at")
});

export const stops = sqliteTable("stops", {
  id: text("id").primaryKey(),
  postId: text("post_id")
    .notNull()
    .references(() => posts.id, { onDelete: "cascade" }),
  barId: text("bar_id")
    .notNull()
    .references(() => bars.id),
  drinkCount: integer("drink_count").notNull().default(0),
  note: text("note"),
  stopOrder: integer("stop_order").notNull(),
  arrivedAt: integer("arrived_at").notNull()
});

export type UserRow = typeof users.$inferSelect;
export type BarRow = typeof bars.$inferSelect;
export type PostRow = typeof posts.$inferSelect;
export type StopRow = typeof stops.$inferSelect;

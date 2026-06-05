import {
  index,
  integer,
  uniqueIndex,
  sqliteTable,
  text
} from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  username: text("username").unique(),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  createdAt: integer("created_at").notNull()
});

export const bars = sqliteTable("bars", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  neighborhood: text("neighborhood"),
  createdAt: integer("created_at").notNull()
});

export const posts = sqliteTable(
  "posts",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    caption: text("caption"),
    status: text("status", { enum: ["draft", "published"] })
      .notNull()
      .default("draft"),
    totalDrinks: integer("total_drinks").notNull().default(0),
    createdAt: integer("created_at").notNull(),
    publishedAt: integer("published_at")
  },
  (table) => ({
    postsUserIdx: index("idx_posts_user").on(table.userId),
    postsStatusIdx: index("idx_posts_status").on(
      table.status,
      table.publishedAt
    )
  })
);

export const stops = sqliteTable(
  "stops",
  {
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
  },
  (table) => ({
    stopsPostIdx: index("idx_stops_post").on(
      table.postId,
      table.stopOrder
    )
  })
);

export const comments = sqliteTable(
  "comments",
  {
    id: text("id").primaryKey(),
    postId: text("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    publishedAt: integer("published_at").notNull()
  },
  (table) => ({
    commentsPostPublishedIdx: index(
      "idx_comments_post_published"
    ).on(table.postId, table.publishedAt),
    commentsUserIdx: index("idx_comments_user").on(
      table.userId
    )
  })
);

export const likes = sqliteTable(
  "likes",
  {
    postId: text("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: integer("created_at").notNull()
  },
  (table) => ({
    likesPostUserIdx: uniqueIndex("idx_likes_post_user").on(
      table.postId,
      table.userId
    ),
    likesPostIdx: index("idx_likes_post").on(table.postId),
    likesUserIdx: index("idx_likes_user").on(table.userId)
  })
);

export type UserRow = typeof users.$inferSelect;
export type BarRow = typeof bars.$inferSelect;
export type PostRow = typeof posts.$inferSelect;
export type StopRow = typeof stops.$inferSelect;

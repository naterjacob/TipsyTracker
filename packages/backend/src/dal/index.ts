import type {
  BarRow,
  PostRow,
  StopRow,
  UserRow
} from "../db/schema";

export const listBars = async (db: D1Database) => {
  const result = await db
    .prepare(
      "SELECT id, name, neighborhood, created_at FROM bars ORDER BY name ASC"
    )
    .all<BarRow>();
  return result.results;
};

export const syncUser = async (
  db: D1Database,
  input: {
    userId: string;
    username: string | null;
    displayName: string | null;
    avatarUrl: string | null;
    now: number;
  }
) => {
  await db
    .prepare(
      `INSERT INTO users (id, username, display_name, avatar_url, created_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         username = COALESCE(excluded.username, users.username),
         display_name = COALESCE(excluded.display_name, users.display_name),
         avatar_url = COALESCE(excluded.avatar_url, users.avatar_url)`
    )
    .bind(
      input.userId,
      input.username,
      input.displayName,
      input.avatarUrl,
      input.now
    )
    .run();

  const row = await db
    .prepare("SELECT username FROM users WHERE id = ?")
    .bind(input.userId)
    .first<{ username: string | null }>();

  return { hasProfile: Boolean(row?.username) };
};

export const listFeed = async (
  db: D1Database,
  input: { limit: number; cursor: number | null }
) => {
  const query = input.cursor
    ? `SELECT p.id, p.user_id, p.caption, p.status, p.total_drinks, p.created_at, p.published_at,
              u.username, u.display_name, u.avatar_url, COUNT(s.id) AS bar_count
       FROM posts p
       JOIN users u ON u.id = p.user_id
       LEFT JOIN stops s ON s.post_id = p.id
       WHERE p.status = 'published' AND p.published_at < ?
       GROUP BY p.id
       ORDER BY p.published_at DESC
       LIMIT ?`
    : `SELECT p.id, p.user_id, p.caption, p.status, p.total_drinks, p.created_at, p.published_at,
              u.username, u.display_name, u.avatar_url, COUNT(s.id) AS bar_count
       FROM posts p
       JOIN users u ON u.id = p.user_id
       LEFT JOIN stops s ON s.post_id = p.id
       WHERE p.status = 'published'
       GROUP BY p.id
       ORDER BY p.published_at DESC
       LIMIT ?`;

  const statement = db.prepare(query);
  const result = input.cursor
    ? await statement
        .bind(input.cursor, input.limit)
        .all<Record<string, unknown>>()
    : await statement
        .bind(input.limit)
        .all<Record<string, unknown>>();
  const posts = result.results.map((row) => ({
    id: row.id,
    userId: row.user_id,
    caption: row.caption,
    totalDrinks: row.total_drinks,
    createdAt: row.created_at,
    publishedAt: row.published_at,
    barCount: row.bar_count,
    author: {
      id: row.user_id,
      username: row.username,
      displayName: row.display_name,
      avatarUrl: row.avatar_url
    }
  }));
  const last = posts.at(-1);
  const nextCursor =
    posts.length === input.limit &&
    typeof last?.publishedAt === "number"
      ? last.publishedAt
      : null;
  return { posts, nextCursor };
};

export const getPostDetails = async (
  db: D1Database,
  postId: string
) => {
  const post = await db
    .prepare(
      `SELECT p.id, p.user_id, p.caption, p.status, p.total_drinks, p.created_at, p.published_at,
              u.username, u.display_name, u.avatar_url
       FROM posts p
       JOIN users u ON u.id = p.user_id
       WHERE p.id = ?`
    )
    .bind(postId)
    .first<Record<string, unknown>>();
  if (!post) return null;

  const stops = await db
    .prepare(
      `SELECT s.id, s.post_id, s.bar_id, s.drink_count, s.note, s.stop_order, s.arrived_at,
              b.name AS bar_name, b.neighborhood AS bar_neighborhood
       FROM stops s
       JOIN bars b ON b.id = s.bar_id
       WHERE s.post_id = ?
       ORDER BY s.stop_order ASC`
    )
    .bind(postId)
    .all<Record<string, unknown>>();

  return {
    id: post.id,
    userId: post.user_id,
    caption: post.caption,
    status: post.status,
    totalDrinks: post.total_drinks,
    createdAt: post.created_at,
    publishedAt: post.published_at,
    author: {
      id: post.user_id,
      username: post.username,
      displayName: post.display_name,
      avatarUrl: post.avatar_url
    },
    stops: stops.results.map((stop) => ({
      id: stop.id,
      postId: stop.post_id,
      barId: stop.bar_id,
      barName: stop.bar_name,
      barNeighborhood: stop.bar_neighborhood,
      drinkCount: stop.drink_count,
      note: stop.note,
      stopOrder: stop.stop_order,
      arrivedAt: stop.arrived_at
    }))
  };
};

export const createDraftPost = async (
  db: D1Database,
  input: { userId: string; now: number }
) => {
  const existingDraft = await db
    .prepare(
      "SELECT id FROM posts WHERE user_id = ? AND status = 'draft' LIMIT 1"
    )
    .bind(input.userId)
    .first<{ id: string }>();
  if (existingDraft) return null;

  const postId = crypto.randomUUID();
  await db
    .prepare(
      "INSERT INTO posts (id, user_id, caption, status, total_drinks, created_at, published_at) VALUES (?, ?, NULL, 'draft', 0, ?, NULL)"
    )
    .bind(postId, input.userId, input.now)
    .run();
  return {
    id: postId,
    userId: input.userId,
    status: "draft" as const,
    createdAt: input.now
  };
};

export const updateDraftCaption = async (
  db: D1Database,
  input: {
    postId: string;
    userId: string;
    caption: string | null;
  }
) => {
  const ownerPost = await db
    .prepare(
      "SELECT id FROM posts WHERE id = ? AND user_id = ? AND status = 'draft' LIMIT 1"
    )
    .bind(input.postId, input.userId)
    .first<{ id: string }>();
  if (!ownerPost) return null;

  await db
    .prepare("UPDATE posts SET caption = ? WHERE id = ?")
    .bind(input.caption, input.postId)
    .run();
  return db
    .prepare(
      "SELECT id, user_id, caption, status, total_drinks, created_at, published_at FROM posts WHERE id = ?"
    )
    .bind(input.postId)
    .first<PostRow>();
};

export const publishDraftPost = async (
  db: D1Database,
  input: { postId: string; userId: string; publishedAt: number }
) => {
  const ownerPost = await db
    .prepare(
      "SELECT id FROM posts WHERE id = ? AND user_id = ? AND status = 'draft' LIMIT 1"
    )
    .bind(input.postId, input.userId)
    .first<{ id: string }>();
  if (!ownerPost) return { kind: "not_found" as const };

  const totalRow = await db
    .prepare(
      "SELECT COALESCE(SUM(drink_count), 0) AS total_drinks, COUNT(*) AS stop_count FROM stops WHERE post_id = ?"
    )
    .bind(input.postId)
    .first<{ total_drinks: number; stop_count: number }>();
  if (!totalRow || totalRow.stop_count < 1)
    return { kind: "no_stops" as const };

  await db
    .prepare(
      "UPDATE posts SET status = 'published', total_drinks = ?, published_at = ? WHERE id = ?"
    )
    .bind(
      totalRow.total_drinks,
      input.publishedAt,
      input.postId
    )
    .run();
  const post = await db
    .prepare(
      "SELECT id, user_id, caption, status, total_drinks, created_at, published_at FROM posts WHERE id = ?"
    )
    .bind(input.postId)
    .first<PostRow>();
  return { kind: "ok" as const, post };
};

export const deleteDraftPost = async (
  db: D1Database,
  input: { postId: string; userId: string }
) => {
  const result = await db
    .prepare(
      "DELETE FROM posts WHERE id = ? AND user_id = ? AND status = 'draft'"
    )
    .bind(input.postId, input.userId)
    .run();
  return result.success && (result.meta.changes ?? 0) > 0;
};

/** Delete a post owned by the user (any status), cleaning up child rows. */
export const deletePost = async (
  db: D1Database,
  input: { postId: string; userId: string }
) => {
  // Verify ownership first so we don't delete children of someone else's post.
  const owner = await db
    .prepare("SELECT id FROM posts WHERE id = ? AND user_id = ? LIMIT 1")
    .bind(input.postId, input.userId)
    .first<{ id: string }>();
  if (!owner) return false;

  // Explicit child cleanup (D1 does not guarantee FK cascade enforcement).
  await db.prepare("DELETE FROM likes WHERE post_id = ?").bind(input.postId).run();
  await db
    .prepare("DELETE FROM comments WHERE post_id = ?")
    .bind(input.postId)
    .run();
  await db.prepare("DELETE FROM stops WHERE post_id = ?").bind(input.postId).run();
  const result = await db
    .prepare("DELETE FROM posts WHERE id = ? AND user_id = ?")
    .bind(input.postId, input.userId)
    .run();
  return result.success && (result.meta.changes ?? 0) > 0;
};

export const addDraftStop = async (
  db: D1Database,
  input: {
    postId: string;
    userId: string;
    barId: string;
    drinkCount: number;
    note: string | null;
    arrivedAt: number;
  }
) => {
  const ownerPost = await db
    .prepare(
      "SELECT id FROM posts WHERE id = ? AND user_id = ? AND status = 'draft' LIMIT 1"
    )
    .bind(input.postId, input.userId)
    .first<{ id: string }>();
  if (!ownerPost) return null;

  const orderRow = await db
    .prepare(
      "SELECT COALESCE(MAX(stop_order), 0) AS max_order FROM stops WHERE post_id = ?"
    )
    .bind(input.postId)
    .first<{ max_order: number }>();
  const stopId = crypto.randomUUID();
  const stopOrder = (orderRow?.max_order ?? 0) + 1;

  await db
    .prepare(
      "INSERT INTO stops (id, post_id, bar_id, drink_count, note, stop_order, arrived_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(
      stopId,
      input.postId,
      input.barId,
      Math.max(0, input.drinkCount),
      input.note,
      stopOrder,
      input.arrivedAt
    )
    .run();

  return db
    .prepare(
      "SELECT id, post_id, bar_id, drink_count, note, stop_order, arrived_at FROM stops WHERE id = ?"
    )
    .bind(stopId)
    .first<StopRow>();
};

export const updateDraftStop = async (
  db: D1Database,
  input: {
    postId: string;
    stopId: string;
    userId: string;
    drinkCount?: number;
    note?: string | null;
  }
) => {
  const ownerPost = await db
    .prepare(
      "SELECT id FROM posts WHERE id = ? AND user_id = ? AND status = 'draft' LIMIT 1"
    )
    .bind(input.postId, input.userId)
    .first<{ id: string }>();
  if (!ownerPost) return null;

  const existing = await db
    .prepare(
      "SELECT id, drink_count, note FROM stops WHERE id = ? AND post_id = ? LIMIT 1"
    )
    .bind(input.stopId, input.postId)
    .first<{
      id: string;
      drink_count: number;
      note: string | null;
    }>();
  if (!existing) return null;

  const drinkCount = input.drinkCount ?? existing.drink_count;
  const note =
    input.note === undefined ? existing.note : input.note;

  await db
    .prepare(
      "UPDATE stops SET drink_count = ?, note = ? WHERE id = ?"
    )
    .bind(Math.max(0, drinkCount), note ?? null, input.stopId)
    .run();

  return db
    .prepare(
      "SELECT id, post_id, bar_id, drink_count, note, stop_order, arrived_at FROM stops WHERE id = ?"
    )
    .bind(input.stopId)
    .first<StopRow>();
};

export const deleteDraftStop = async (
  db: D1Database,
  input: { postId: string; stopId: string; userId: string }
) => {
  const ownerPost = await db
    .prepare(
      "SELECT id FROM posts WHERE id = ? AND user_id = ? AND status = 'draft' LIMIT 1"
    )
    .bind(input.postId, input.userId)
    .first<{ id: string }>();
  if (!ownerPost) return false;

  const result = await db
    .prepare("DELETE FROM stops WHERE id = ? AND post_id = ?")
    .bind(input.stopId, input.postId)
    .run();
  return result.success && (result.meta.changes ?? 0) > 0;
};

/** Resolve a username (case-insensitive) to the internal user id. */
export const getUserIdByUsername = async (
  db: D1Database,
  username: string
) => {
  const row = await db
    .prepare("SELECT id FROM users WHERE username = ? COLLATE NOCASE")
    .bind(username.trim().toLowerCase())
    .first<{ id: string }>();
  return row?.id ?? null;
};

export const getUserProfile = async (
  db: D1Database,
  userId: string
) => {
  const user = await db
    .prepare(
      "SELECT id, username, display_name, avatar_url, bio, created_at FROM users WHERE id = ?"
    )
    .bind(userId)
    .first<UserRow>();
  if (!user) return null;

  const stats = await db
    .prepare(
      `SELECT
         COALESCE(SUM(p.total_drinks), 0) AS total_drinks,
         COUNT(DISTINCT s.bar_id) AS unique_bars_visited,
         COUNT(DISTINCT p.id) AS total_nights_out
       FROM posts p
       LEFT JOIN stops s ON s.post_id = p.id
       WHERE p.user_id = ? AND p.status = 'published'`
    )
    .bind(userId)
    .first<{
      total_drinks: number;
      unique_bars_visited: number;
      total_nights_out: number;
    }>();

  const mostVisited = await db
    .prepare(
      `SELECT b.id, b.name, COUNT(*) AS visits
       FROM stops s
       JOIN posts p ON p.id = s.post_id
       JOIN bars b ON b.id = s.bar_id
       WHERE p.user_id = ? AND p.status = 'published'
       GROUP BY b.id
       ORDER BY visits DESC, b.name ASC
       LIMIT 1`
    )
    .bind(userId)
    .first<{ id: string; name: string; visits: number }>();

  return {
    user,
    stats: {
      totalDrinks: stats?.total_drinks ?? 0,
      uniqueBarsVisited: stats?.unique_bars_visited ?? 0,
      totalNightsOut: stats?.total_nights_out ?? 0,
      mostVisitedBar: mostVisited
        ? {
            id: mostVisited.id,
            name: mostVisited.name,
            visits: mostVisited.visits
          }
        : null
    }
  };
};

export const listUserPosts = async (
  db: D1Database,
  input: {
    userId: string;
    limit: number;
    cursor: number | null;
  }
) => {
  const query = input.cursor
    ? `SELECT id, user_id, caption, status, total_drinks, created_at, published_at
       FROM posts
       WHERE user_id = ? AND status = 'published' AND published_at < ?
       ORDER BY published_at DESC
       LIMIT ?`
    : `SELECT id, user_id, caption, status, total_drinks, created_at, published_at
       FROM posts
       WHERE user_id = ? AND status = 'published'
       ORDER BY published_at DESC
       LIMIT ?`;

  const statement = db.prepare(query);
  const result = input.cursor
    ? await statement
        .bind(input.userId, input.cursor, input.limit)
        .all<PostRow>()
    : await statement
        .bind(input.userId, input.limit)
        .all<PostRow>();
  const posts = result.results;
  const last = posts.at(-1);
  const nextCursor =
    posts.length === input.limit &&
    typeof last?.publishedAt === "number"
      ? last.publishedAt
      : null;
  return { posts, nextCursor };
};

export const listComments = async (
  db: D1Database,
  postId: string
) => {
  const result = await db
    .prepare(
      `SELECT
         c.id,
         c.post_id,
         c.user_id,
         c.content,
         c.published_at,
         u.username,
         u.display_name,
         u.avatar_url
       FROM comments c
       JOIN users u ON u.id = c.user_id
       JOIN posts p ON p.id = c.post_id
       WHERE c.post_id = ?
         AND p.status = 'published'
       ORDER BY c.published_at ASC`
    )
    .bind(postId)
    .all<Record<string, unknown>>();

  return result.results.map((row) => ({
    id: row.id,
    postId: row.post_id,
    userId: row.user_id,
    content: row.content,
    publishedAt: row.published_at,
    author: {
      id: row.user_id,
      username: row.username,
      displayName: row.display_name,
      avatarUrl: row.avatar_url
    }
  }));
};

export const createComment = async (
  db: D1Database,
  input: {
    postId: string;
    userId: string;
    content: string;
    publishedAt: number;
  }
) => {
  const post = await db
    .prepare(
      "SELECT id FROM posts WHERE id = ? AND status = 'published' LIMIT 1"
    )
    .bind(input.postId)
    .first<{ id: string }>();

  if (!post) return null;

  const commentId = crypto.randomUUID();

  await db
    .prepare(
      `INSERT INTO comments
       (id, post_id, user_id, content, published_at)
       VALUES (?, ?, ?, ?, ?)`
    )
    .bind(
      commentId,
      input.postId,
      input.userId,
      input.content.trim(),
      input.publishedAt
    )
    .run();

  const row = await db
    .prepare(
      `SELECT
         c.id,
         c.post_id,
         c.user_id,
         c.content,
         c.published_at,
         u.username,
         u.display_name,
         u.avatar_url
       FROM comments c
       JOIN users u ON u.id = c.user_id
       WHERE c.id = ?`
    )
    .bind(commentId)
    .first<Record<string, unknown>>();

  if (!row) return null;

  return {
    id: row.id,
    postId: row.post_id,
    userId: row.user_id,
    content: row.content,
    publishedAt: row.published_at,
    author: {
      id: row.user_id,
      username: row.username,
      displayName: row.display_name,
      avatarUrl: row.avatar_url
    }
  };
};

export const deleteComment = async (
  db: D1Database,
  input: {
    commentId: string;
    userId: string;
  }
) => {
  const result = await db
    .prepare(
      "DELETE FROM comments WHERE id = ? AND user_id = ?"
    )
    .bind(input.commentId, input.userId)
    .run();

  return result.success && (result.meta.changes ?? 0) > 0;
};

export const likePost = async (
  db: D1Database,
  input: {
    postId: string;
    userId: string;
    createdAt: number;
  }
) => {
  const post = await db
    .prepare(
      "SELECT id FROM posts WHERE id = ? AND status = 'published' LIMIT 1"
    )
    .bind(input.postId)
    .first<{ id: string }>();

  if (!post) return false;

  await db
    .prepare(
      `INSERT OR IGNORE INTO likes
       (post_id, user_id, created_at)
       VALUES (?, ?, ?)`
    )
    .bind(input.postId, input.userId, input.createdAt)
    .run();

  return true;
};

export const unlikePost = async (
  db: D1Database,
  input: {
    postId: string;
    userId: string;
  }
) => {
  const result = await db
    .prepare(
      `DELETE FROM likes
       WHERE post_id = ? AND user_id = ?`
    )
    .bind(input.postId, input.userId)
    .run();

  return result.success && (result.meta.changes ?? 0) > 0;
};

export const getPostLikeStatus = async (
  db: D1Database,
  input: {
    postId: string;
    userId: string;
  }
) => {
  const row = await db
    .prepare(
      `SELECT
         COUNT(*) AS like_count,
         EXISTS(
           SELECT 1
           FROM likes
           WHERE post_id = ? AND user_id = ?
         ) AS liked_by_me
       FROM likes
       WHERE post_id = ?`
    )
    .bind(input.postId, input.userId, input.postId)
    .first<{
      like_count: number;
      liked_by_me: number;
    }>();

  return {
    likeCount: row?.like_count ?? 0,
    likedByMe: Boolean(row?.liked_by_me),
  };
};

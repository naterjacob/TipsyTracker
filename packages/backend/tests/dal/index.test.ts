import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  addDraftStop,
  createComment,
  createDraftPost,
  deleteComment,
  deleteDraftPost,
  deleteDraftStop,
  deletePost,
  getPostDetails,
  getPostLikeStatus,
  getUserIdByUsername,
  getUserProfile,
  likePost,
  listBars,
  listComments,
  listFeed,
  listUserPosts,
  publishDraftPost,
  syncUser,
  unlikePost,
  updateDraftCaption,
  updateDraftStop
} from "../../src/dal";

/**
 * A query-routing D1 mock. Provide handlers keyed by a substring of the SQL;
 * the first matching handler supplies the prepared-statement result. This lets
 * each test declare exactly what each query in a DAL function should return.
 */
type StmtResult = {
  first?: unknown;
  all?: unknown[];
  run?: { success?: boolean; changes?: number; omitChanges?: boolean };
};
type Handler = string;

function makeDb(routes: Array<[Handler, StmtResult]>) {
  const calls: { query: string; args: unknown[] }[] = [];

  const db = {
    prepare: vi.fn((query: string) => {
      const route = routes.find(([needle]) => query.includes(needle));
      const result: StmtResult = route ? route[1] : {};
      let boundArgs: unknown[] = [];
      const stmt = {
        bind: vi.fn((...args: unknown[]) => {
          boundArgs = args;
          calls.push({ query, args });
          return stmt;
        }),
        first: vi.fn(async () => result.first ?? null),
        all: vi.fn(async () => ({ results: result.all ?? [] })),
        run: vi.fn(async () => ({
          success: result.run?.success ?? true,
          meta: result.run?.omitChanges
            ? {}
            : { changes: result.run?.changes ?? 1 }
        }))
      };
      // listBars/listFeed call .all() directly off prepare() without bind in
      // some paths? They always bind, but guard anyway:
      void boundArgs;
      return stmt;
    })
  } as unknown as D1Database;

  return { db, calls };
}

// Deterministic UUIDs for insert paths.
beforeEach(() => {
  vi.spyOn(crypto, "randomUUID").mockReturnValue(
    "00000000-0000-0000-0000-000000000000"
  );
});

describe("dal", () => {
  it("listBars returns rows ordered by name", async () => {
    const { db } = makeDb([
      ["FROM bars", { all: [{ id: "b1", name: "Anchor" }] }]
    ]);
    const bars = await listBars(db);
    expect(bars).toEqual([{ id: "b1", name: "Anchor" }]);
  });

  describe("syncUser", () => {
    it("upserts and reports hasProfile true when username set", async () => {
      const { db, calls } = makeDb([
        ["ON CONFLICT(id) DO UPDATE", { run: {} }],
        ["SELECT username FROM users", { first: { username: "tester" } }]
      ]);
      const result = await syncUser(db, {
        userId: "u1",
        username: "tester",
        displayName: "Test",
        avatarUrl: null,
        now: 100
      });
      expect(result).toEqual({ hasProfile: true });
      expect(calls[0].args).toEqual(["u1", "tester", "Test", null, 100]);
    });

    it("reports hasProfile false when username null", async () => {
      const { db } = makeDb([
        ["ON CONFLICT(id) DO UPDATE", { run: {} }],
        ["SELECT username FROM users", { first: { username: null } }]
      ]);
      expect(await syncUser(db, {
        userId: "u1",
        username: null,
        displayName: null,
        avatarUrl: null,
        now: 1
      })).toEqual({ hasProfile: false });
    });
  });

  describe("listFeed", () => {
    const row = {
      id: "p1",
      user_id: "u1",
      caption: "hi",
      total_drinks: 3,
      created_at: 10,
      published_at: 50,
      bar_count: 2,
      username: "t",
      display_name: "T",
      avatar_url: null
    };

    it("maps rows and returns nextCursor when page is full (no cursor)", async () => {
      const { db, calls } = makeDb([["FROM posts p", { all: [row] }]]);
      const out = await listFeed(db, { limit: 1, cursor: null });
      expect(out.posts[0]).toMatchObject({
        id: "p1",
        barCount: 2,
        author: { username: "t", displayName: "T" }
      });
      expect(out.nextCursor).toBe(50);
      expect(calls[0].args).toEqual([1]);
    });

    it("uses cursor branch and returns null cursor when page not full", async () => {
      const { db, calls } = makeDb([["published_at < ?", { all: [row] }]]);
      const out = await listFeed(db, { limit: 5, cursor: 99 });
      expect(out.nextCursor).toBeNull();
      expect(calls[0].args).toEqual([99, 5]);
    });

    it("returns null cursor when last published_at is not numeric", async () => {
      const { db } = makeDb([
        ["FROM posts p", { all: [{ ...row, published_at: null }] }]
      ]);
      const out = await listFeed(db, { limit: 1, cursor: null });
      expect(out.nextCursor).toBeNull();
    });
  });

  describe("getPostDetails", () => {
    it("returns null when post missing", async () => {
      const { db } = makeDb([["FROM posts p", { first: null }]]);
      expect(await getPostDetails(db, "p1")).toBeNull();
    });

    it("returns post with mapped stops", async () => {
      const { db } = makeDb([
        [
          "FROM posts p",
          {
            first: {
              id: "p1",
              user_id: "u1",
              caption: "c",
              status: "published",
              total_drinks: 2,
              created_at: 1,
              published_at: 2,
              username: "t",
              display_name: "T",
              avatar_url: null
            }
          }
        ],
        [
          "FROM stops s",
          {
            all: [
              {
                id: "s1",
                post_id: "p1",
                bar_id: "b1",
                drink_count: 2,
                note: "n",
                stop_order: 1,
                arrived_at: 5,
                bar_name: "Anchor",
                bar_neighborhood: "Downtown"
              }
            ]
          }
        ]
      ]);
      const out = await getPostDetails(db, "p1");
      expect(out?.id).toBe("p1");
      expect(out?.stops[0]).toMatchObject({ barName: "Anchor", drinkCount: 2 });
    });
  });

  describe("createDraftPost", () => {
    it("returns null when an existing draft exists", async () => {
      const { db } = makeDb([
        ["status = 'draft' LIMIT 1", { first: { id: "existing" } }]
      ]);
      expect(await createDraftPost(db, { userId: "u1", now: 1 })).toBeNull();
    });

    it("creates and returns a new draft", async () => {
      const { db } = makeDb([
        ["status = 'draft' LIMIT 1", { first: null }],
        ["INSERT INTO posts", { run: {} }]
      ]);
      const out = await createDraftPost(db, { userId: "u1", now: 7 });
      expect(out).toMatchObject({ userId: "u1", status: "draft", createdAt: 7 });
    });
  });

  describe("updateDraftCaption", () => {
    it("returns null when not an owned draft", async () => {
      const { db } = makeDb([["AND status = 'draft' LIMIT 1", { first: null }]]);
      expect(
        await updateDraftCaption(db, { postId: "p1", userId: "u1", caption: "x" })
      ).toBeNull();
    });

    it("updates and returns the post", async () => {
      const { db } = makeDb([
        ["AND status = 'draft' LIMIT 1", { first: { id: "p1" } }],
        ["UPDATE posts SET caption", { run: {} }],
        ["SELECT id, user_id, caption", { first: { id: "p1", caption: "x" } }]
      ]);
      const out = await updateDraftCaption(db, {
        postId: "p1",
        userId: "u1",
        caption: "x"
      });
      expect(out).toMatchObject({ id: "p1", caption: "x" });
    });
  });

  describe("publishDraftPost", () => {
    it("returns not_found when not an owned draft", async () => {
      const { db } = makeDb([["AND status = 'draft' LIMIT 1", { first: null }]]);
      expect(
        (await publishDraftPost(db, { postId: "p1", userId: "u1", publishedAt: 1 }))
          .kind
      ).toBe("not_found");
    });

    it("returns no_stops when there are no stops", async () => {
      const { db } = makeDb([
        ["AND status = 'draft' LIMIT 1", { first: { id: "p1" } }],
        ["AS total_drinks", { first: { total_drinks: 0, stop_count: 0 } }]
      ]);
      expect(
        (await publishDraftPost(db, { postId: "p1", userId: "u1", publishedAt: 1 }))
          .kind
      ).toBe("no_stops");
    });

    it("returns no_stops when totalRow is missing", async () => {
      const { db } = makeDb([
        ["AND status = 'draft' LIMIT 1", { first: { id: "p1" } }],
        ["AS total_drinks", { first: null }]
      ]);
      expect(
        (await publishDraftPost(db, { postId: "p1", userId: "u1", publishedAt: 1 }))
          .kind
      ).toBe("no_stops");
    });

    it("publishes and returns ok", async () => {
      const { db } = makeDb([
        ["AND status = 'draft' LIMIT 1", { first: { id: "p1" } }],
        ["AS total_drinks", { first: { total_drinks: 4, stop_count: 2 } }],
        ["UPDATE posts SET status", { run: {} }],
        ["SELECT id, user_id, caption", { first: { id: "p1", status: "published" } }]
      ]);
      const out = await publishDraftPost(db, {
        postId: "p1",
        userId: "u1",
        publishedAt: 9
      });
      expect(out.kind).toBe("ok");
    });
  });

  describe("deleteDraftPost", () => {
    it("returns true when a draft row is deleted", async () => {
      const { db } = makeDb([["DELETE FROM posts", { run: { changes: 1 } }]]);
      expect(
        await deleteDraftPost(db, { postId: "p1", userId: "u1" })
      ).toBe(true);
    });
    it("returns false when nothing deleted", async () => {
      const { db } = makeDb([["DELETE FROM posts", { run: { changes: 0 } }]]);
      expect(
        await deleteDraftPost(db, { postId: "p1", userId: "u1" })
      ).toBe(false);
    });
  });

  describe("deletePost", () => {
    it("returns false when not owner", async () => {
      const { db } = makeDb([["SELECT id FROM posts", { first: null }]]);
      expect(await deletePost(db, { postId: "p1", userId: "x" })).toBe(false);
    });

    it("deletes children then post and returns true", async () => {
      const { db, calls } = makeDb([
        ["SELECT id FROM posts", { first: { id: "p1" } }],
        ["DELETE FROM likes", { run: { changes: 1 } }],
        ["DELETE FROM comments", { run: { changes: 1 } }],
        ["DELETE FROM stops", { run: { changes: 1 } }],
        ["DELETE FROM posts", { run: { changes: 1 } }]
      ]);
      expect(await deletePost(db, { postId: "p1", userId: "u1" })).toBe(true);
      const deletes = calls
        .map((c) => c.query.match(/DELETE FROM (\w+)/)?.[1])
        .filter(Boolean);
      expect(deletes).toEqual(["likes", "comments", "stops", "posts"]);
    });

    it("returns false when final post delete affects no rows", async () => {
      const { db } = makeDb([
        ["SELECT id FROM posts", { first: { id: "p1" } }],
        ["DELETE FROM likes", { run: { changes: 0 } }],
        ["DELETE FROM comments", { run: { changes: 0 } }],
        ["DELETE FROM stops", { run: { changes: 0 } }],
        ["DELETE FROM posts", { run: { changes: 0 } }]
      ]);
      expect(await deletePost(db, { postId: "p1", userId: "u1" })).toBe(false);
    });
  });

  describe("addDraftStop", () => {
    it("returns null when not an owned draft", async () => {
      const { db } = makeDb([["AND status = 'draft' LIMIT 1", { first: null }]]);
      expect(
        await addDraftStop(db, {
          postId: "p1",
          userId: "u1",
          barId: "b1",
          drinkCount: 1,
          note: null,
          arrivedAt: 1
        })
      ).toBeNull();
    });

    it("inserts a stop with incremented order", async () => {
      const { db, calls } = makeDb([
        ["AND status = 'draft' LIMIT 1", { first: { id: "p1" } }],
        ["MAX(stop_order)", { first: { max_order: 2 } }],
        ["INSERT INTO stops", { run: {} }],
        ["SELECT id, post_id, bar_id", { first: { id: "s1", stop_order: 3 } }]
      ]);
      const out = await addDraftStop(db, {
        postId: "p1",
        userId: "u1",
        barId: "b1",
        drinkCount: -5,
        note: "n",
        arrivedAt: 1
      });
      expect(out).toMatchObject({ id: "s1" });
      const insert = calls.find((c) => c.query.includes("INSERT INTO stops"));
      // stop_order = max(2)+1 = 3, drinkCount clamped to 0.
      expect(insert?.args).toContain(3);
      expect(insert?.args).toContain(0);
    });

    it("defaults order to 1 when no prior stops", async () => {
      const { db, calls } = makeDb([
        ["AND status = 'draft' LIMIT 1", { first: { id: "p1" } }],
        ["MAX(stop_order)", { first: null }],
        ["INSERT INTO stops", { run: {} }],
        ["SELECT id, post_id, bar_id", { first: { id: "s1" } }]
      ]);
      await addDraftStop(db, {
        postId: "p1",
        userId: "u1",
        barId: "b1",
        drinkCount: 2,
        note: null,
        arrivedAt: 1
      });
      const insert = calls.find((c) => c.query.includes("INSERT INTO stops"));
      expect(insert?.args).toContain(1);
    });
  });

  describe("updateDraftStop", () => {
    it("returns null when not an owned draft", async () => {
      const { db } = makeDb([["AND status = 'draft' LIMIT 1", { first: null }]]);
      expect(
        await updateDraftStop(db, { postId: "p1", stopId: "s1", userId: "u1" })
      ).toBeNull();
    });

    it("returns null when stop missing", async () => {
      const { db } = makeDb([
        ["AND status = 'draft' LIMIT 1", { first: { id: "p1" } }],
        ["FROM stops WHERE id = ? AND post_id", { first: null }]
      ]);
      expect(
        await updateDraftStop(db, { postId: "p1", stopId: "s1", userId: "u1" })
      ).toBeNull();
    });

    it("updates using provided values", async () => {
      const { db, calls } = makeDb([
        ["AND status = 'draft' LIMIT 1", { first: { id: "p1" } }],
        [
          "FROM stops WHERE id = ? AND post_id",
          { first: { id: "s1", drink_count: 1, note: "old" } }
        ],
        ["UPDATE stops SET drink_count", { run: {} }],
        ["SELECT id, post_id, bar_id", { first: { id: "s1" } }]
      ]);
      await updateDraftStop(db, {
        postId: "p1",
        stopId: "s1",
        userId: "u1",
        drinkCount: 9,
        note: "new"
      });
      const upd = calls.find((c) => c.query.includes("UPDATE stops"));
      expect(upd?.args).toEqual([9, "new", "s1"]);
    });

    it("falls back to existing values when fields omitted", async () => {
      const { db, calls } = makeDb([
        ["AND status = 'draft' LIMIT 1", { first: { id: "p1" } }],
        [
          "FROM stops WHERE id = ? AND post_id",
          { first: { id: "s1", drink_count: 4, note: "keep" } }
        ],
        ["UPDATE stops SET drink_count", { run: {} }],
        ["SELECT id, post_id, bar_id", { first: { id: "s1" } }]
      ]);
      await updateDraftStop(db, { postId: "p1", stopId: "s1", userId: "u1" });
      const upd = calls.find((c) => c.query.includes("UPDATE stops"));
      expect(upd?.args).toEqual([4, "keep", "s1"]);
    });
  });

  describe("deleteDraftStop", () => {
    it("returns false when not an owned draft", async () => {
      const { db } = makeDb([["AND status = 'draft' LIMIT 1", { first: null }]]);
      expect(
        await deleteDraftStop(db, { postId: "p1", stopId: "s1", userId: "u1" })
      ).toBe(false);
    });
    it("returns true when a stop is deleted", async () => {
      const { db } = makeDb([
        ["AND status = 'draft' LIMIT 1", { first: { id: "p1" } }],
        ["DELETE FROM stops", { run: { changes: 1 } }]
      ]);
      expect(
        await deleteDraftStop(db, { postId: "p1", stopId: "s1", userId: "u1" })
      ).toBe(true);
    });
  });

  describe("getUserIdByUsername", () => {
    it("returns id (normalized, case-insensitive)", async () => {
      const { db, calls } = makeDb([
        ["COLLATE NOCASE", { first: { id: "u1" } }]
      ]);
      expect(await getUserIdByUsername(db, "  Tester ")).toBe("u1");
      expect(calls[0].args).toEqual(["tester"]);
    });
    it("returns null when not found", async () => {
      const { db } = makeDb([["COLLATE NOCASE", { first: null }]]);
      expect(await getUserIdByUsername(db, "ghost")).toBeNull();
    });
  });

  describe("getUserProfile", () => {
    it("returns null when user missing", async () => {
      const { db } = makeDb([["FROM users WHERE id = ?", { first: null }]]);
      expect(await getUserProfile(db, "u1")).toBeNull();
    });

    it("returns profile with stats and most-visited bar", async () => {
      const { db } = makeDb([
        ["FROM users WHERE id = ?", { first: { id: "u1", username: "t" } }],
        [
          "AS total_drinks",
          { first: { total_drinks: 5, unique_bars_visited: 2, total_nights_out: 3 } }
        ],
        ["AS visits", { first: { id: "b1", name: "Anchor", visits: 4 } }]
      ]);
      const out = await getUserProfile(db, "u1");
      expect(out?.stats.totalDrinks).toBe(5);
      expect(out?.stats.mostVisitedBar).toMatchObject({ name: "Anchor" });
    });

    it("handles missing stats and no most-visited bar", async () => {
      const { db } = makeDb([
        ["FROM users WHERE id = ?", { first: { id: "u1", username: "t" } }],
        ["AS total_drinks", { first: null }],
        ["AS visits", { first: null }]
      ]);
      const out = await getUserProfile(db, "u1");
      expect(out?.stats.totalDrinks).toBe(0);
      expect(out?.stats.mostVisitedBar).toBeNull();
    });
  });

  describe("listUserPosts", () => {
    it("no cursor: returns posts and nextCursor when full", async () => {
      const { db, calls } = makeDb([
        ["WHERE user_id = ? AND status = 'published'", {
          all: [{ id: "p1", publishedAt: 50 }]
        }]
      ]);
      const out = await listUserPosts(db, { userId: "u1", limit: 1, cursor: null });
      expect(out.nextCursor).toBe(50);
      expect(calls[0].args).toEqual(["u1", 1]);
    });

    it("cursor branch: returns null nextCursor when not full", async () => {
      const { db, calls } = makeDb([
        ["published_at < ?", { all: [{ id: "p1", publishedAt: 50 }] }]
      ]);
      const out = await listUserPosts(db, { userId: "u1", limit: 5, cursor: 99 });
      expect(out.nextCursor).toBeNull();
      expect(calls[0].args).toEqual(["u1", 99, 5]);
    });
  });

  describe("listComments", () => {
    it("maps comment rows with author", async () => {
      const { db } = makeDb([
        [
          "FROM comments c",
          {
            all: [
              {
                id: "c1",
                post_id: "p1",
                user_id: "u1",
                content: "hi",
                published_at: 1,
                username: "t",
                display_name: "T",
                avatar_url: null
              }
            ]
          }
        ]
      ]);
      const out = await listComments(db, "p1");
      expect(out[0]).toMatchObject({ id: "c1", author: { username: "t" } });
    });
  });

  describe("createComment", () => {
    it("returns null when post not published", async () => {
      const { db } = makeDb([["FROM posts WHERE id = ?", { first: null }]]);
      expect(
        await createComment(db, {
          postId: "p1",
          userId: "u1",
          content: "x",
          publishedAt: 1
        })
      ).toBeNull();
    });

    it("returns null when re-read fails", async () => {
      const { db } = makeDb([
        ["FROM posts WHERE id = ?", { first: { id: "p1" } }],
        ["INSERT INTO comments", { run: {} }],
        ["FROM comments c", { first: null }]
      ]);
      expect(
        await createComment(db, {
          postId: "p1",
          userId: "u1",
          content: "  x  ",
          publishedAt: 1
        })
      ).toBeNull();
    });

    it("creates and returns the comment", async () => {
      const { db, calls } = makeDb([
        ["FROM posts WHERE id = ?", { first: { id: "p1" } }],
        ["INSERT INTO comments", { run: {} }],
        [
          "FROM comments c",
          {
            first: {
              id: "c1",
              post_id: "p1",
              user_id: "u1",
              content: "x",
              published_at: 1,
              username: "t",
              display_name: "T",
              avatar_url: null
            }
          }
        ]
      ]);
      const out = await createComment(db, {
        postId: "p1",
        userId: "u1",
        content: "  x  ",
        publishedAt: 1
      });
      expect(out).toMatchObject({ id: "c1", author: { username: "t" } });
      // content is trimmed before insert.
      const insert = calls.find((c) => c.query.includes("INSERT INTO comments"));
      expect(insert?.args).toContain("x");
    });
  });

  describe("deleteComment", () => {
    it("returns true when deleted", async () => {
      const { db } = makeDb([["DELETE FROM comments", { run: { changes: 1 } }]]);
      expect(
        await deleteComment(db, { commentId: "c1", userId: "u1" })
      ).toBe(true);
    });
    it("returns false when nothing deleted", async () => {
      const { db } = makeDb([["DELETE FROM comments", { run: { changes: 0 } }]]);
      expect(
        await deleteComment(db, { commentId: "c1", userId: "u1" })
      ).toBe(false);
    });
  });

  describe("likePost", () => {
    it("returns false when post not published", async () => {
      const { db } = makeDb([["FROM posts WHERE id = ?", { first: null }]]);
      expect(
        await likePost(db, { postId: "p1", userId: "u1", createdAt: 1 })
      ).toBe(false);
    });
    it("inserts and returns true", async () => {
      const { db } = makeDb([
        ["FROM posts WHERE id = ?", { first: { id: "p1" } }],
        ["INSERT OR IGNORE INTO likes", { run: {} }]
      ]);
      expect(
        await likePost(db, { postId: "p1", userId: "u1", createdAt: 1 })
      ).toBe(true);
    });
  });

  describe("unlikePost", () => {
    it("returns true when a like is removed", async () => {
      const { db } = makeDb([["DELETE FROM likes", { run: { changes: 1 } }]]);
      expect(await unlikePost(db, { postId: "p1", userId: "u1" })).toBe(true);
    });
    it("returns false when nothing removed", async () => {
      const { db } = makeDb([["DELETE FROM likes", { run: { changes: 0 } }]]);
      expect(await unlikePost(db, { postId: "p1", userId: "u1" })).toBe(false);
    });
  });

  describe("getPostLikeStatus", () => {
    it("returns count and likedByMe true", async () => {
      const { db } = makeDb([
        ["AS like_count", { first: { like_count: 3, liked_by_me: 1 } }]
      ]);
      expect(
        await getPostLikeStatus(db, { postId: "p1", userId: "u1" })
      ).toEqual({ likeCount: 3, likedByMe: true });
    });
    it("defaults to zero when no row", async () => {
      const { db } = makeDb([["AS like_count", { first: null }]]);
      expect(
        await getPostLikeStatus(db, { postId: "p1", userId: "u1" })
      ).toEqual({ likeCount: 0, likedByMe: false });
    });
  });

  // Branch coverage: the `result.success && (changes ?? 0) > 0` returns when
  // the write reports success: false.
  describe("write-failure branches", () => {
    it("deleteDraftPost returns false when success is false", async () => {
      const { db } = makeDb([
        ["DELETE FROM posts", { run: { success: false, changes: 1 } }]
      ]);
      expect(await deleteDraftPost(db, { postId: "p1", userId: "u1" })).toBe(
        false
      );
    });

    it("deleteDraftStop returns false when success is false", async () => {
      const { db } = makeDb([
        ["AND status = 'draft' LIMIT 1", { first: { id: "p1" } }],
        ["DELETE FROM stops", { run: { success: false, changes: 1 } }]
      ]);
      expect(
        await deleteDraftStop(db, { postId: "p1", stopId: "s1", userId: "u1" })
      ).toBe(false);
    });

    it("deleteComment returns false when success is false", async () => {
      const { db } = makeDb([
        ["DELETE FROM comments", { run: { success: false, changes: 1 } }]
      ]);
      expect(
        await deleteComment(db, { commentId: "c1", userId: "u1" })
      ).toBe(false);
    });

    it("unlikePost returns false when success is false", async () => {
      const { db } = makeDb([
        ["DELETE FROM likes", { run: { success: false, changes: 1 } }]
      ]);
      expect(await unlikePost(db, { postId: "p1", userId: "u1" })).toBe(false);
    });

    it("deletePost returns false when final delete success is false", async () => {
      const { db } = makeDb([
        ["SELECT id FROM posts", { first: { id: "p1" } }],
        ["DELETE FROM likes", { run: {} }],
        ["DELETE FROM comments", { run: {} }],
        ["DELETE FROM stops", { run: {} }],
        ["DELETE FROM posts", { run: { success: false, changes: 1 } }]
      ]);
      expect(await deletePost(db, { postId: "p1", userId: "u1" })).toBe(false);
    });

    it("deleteDraftPost returns false when meta.changes is absent (?? 0)", async () => {
      const { db } = makeDb([
        ["DELETE FROM posts", { run: { omitChanges: true } }]
      ]);
      expect(await deleteDraftPost(db, { postId: "p1", userId: "u1" })).toBe(
        false
      );
    });

    it("deletePost returns false when final delete changes absent (?? 0)", async () => {
      const { db } = makeDb([
        ["SELECT id FROM posts", { first: { id: "p1" } }],
        ["DELETE FROM likes", { run: {} }],
        ["DELETE FROM comments", { run: {} }],
        ["DELETE FROM stops", { run: {} }],
        ["DELETE FROM posts", { run: { omitChanges: true } }]
      ]);
      expect(await deletePost(db, { postId: "p1", userId: "u1" })).toBe(false);
    });

    it("deleteDraftStop returns false when changes absent (?? 0)", async () => {
      const { db } = makeDb([
        ["AND status = 'draft' LIMIT 1", { first: { id: "p1" } }],
        ["DELETE FROM stops", { run: { omitChanges: true } }]
      ]);
      expect(
        await deleteDraftStop(db, { postId: "p1", stopId: "s1", userId: "u1" })
      ).toBe(false);
    });

    it("deleteComment returns false when changes absent (?? 0)", async () => {
      const { db } = makeDb([
        ["DELETE FROM comments", { run: { omitChanges: true } }]
      ]);
      expect(
        await deleteComment(db, { commentId: "c1", userId: "u1" })
      ).toBe(false);
    });

    it("unlikePost returns false when changes absent (?? 0)", async () => {
      const { db } = makeDb([
        ["DELETE FROM likes", { run: { omitChanges: true } }]
      ]);
      expect(await unlikePost(db, { postId: "p1", userId: "u1" })).toBe(false);
    });

    it("updateDraftStop coerces a null note via `?? null`", async () => {
      const { db, calls } = makeDb([
        ["AND status = 'draft' LIMIT 1", { first: { id: "p1" } }],
        [
          "FROM stops WHERE id = ? AND post_id",
          { first: { id: "s1", drink_count: 2, note: null } }
        ],
        ["UPDATE stops SET drink_count", { run: {} }],
        ["SELECT id, post_id, bar_id", { first: { id: "s1" } }]
      ]);
      // Pass note: null explicitly so `note` is null going into the bind.
      await updateDraftStop(db, {
        postId: "p1",
        stopId: "s1",
        userId: "u1",
        note: null
      });
      const upd = calls.find((c) => c.query.includes("UPDATE stops"));
      expect(upd?.args).toEqual([2, null, "s1"]);
    });
  });
});

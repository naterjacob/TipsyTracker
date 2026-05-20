import { describe, expect, it, vi } from "vitest";
import { createDraftPost, publishDraftPost, syncUser, updateDraftCaption } from "../../src/dal";

type MockPrepared = {
  bind: (...args: unknown[]) => MockPrepared;
  first: <T>() => Promise<T | null>;
  all: <T>() => Promise<{ results: T[] }>;
  run: () => Promise<{ success: boolean; meta: { changes?: number } }>;
};

const createMockPrepared = (overrides: Partial<MockPrepared> = {}): MockPrepared => ({
  bind: vi.fn(() => prepared),
  first: vi.fn(async () => null),
  all: vi.fn(async () => ({ results: [] })),
  run: vi.fn(async () => ({ success: true, meta: { changes: 1 } })),
  ...overrides
});

let prepared = createMockPrepared();

const createMockDb = (prepareImpl: (query: string) => MockPrepared): D1Database =>
  ({
    prepare: vi.fn(prepareImpl)
  }) as unknown as D1Database;

describe("DAL", () => {
  it("syncUser upserts by id", async () => {
    const run = vi.fn(async () => ({ success: true, meta: {} }));
    const bind = vi.fn(() => ({ run }));
    const prepare = vi.fn(() => ({ bind }));
    const db = { prepare } as unknown as D1Database;

    await syncUser(db, {
      userId: "user_1",
      username: "tester",
      displayName: "Test User",
      avatarUrl: null,
      now: 100
    });

    expect(prepare).toHaveBeenCalledWith(expect.stringContaining("ON CONFLICT(id) DO UPDATE"));
    expect(bind).toHaveBeenCalledWith("user_1", "tester", "Test User", null, 100);
    expect(run).toHaveBeenCalled();
  });

  it("createDraftPost returns null when draft exists", async () => {
    const first = vi.fn(async () => ({ id: "draft_1" }));
    const bind = vi.fn(() => ({ first }));
    const prepare = vi.fn(() => ({ bind }));
    const db = { prepare } as unknown as D1Database;

    const result = await createDraftPost(db, { userId: "user_1", now: 100 });

    expect(result).toBeNull();
  });

  it("updateDraftCaption returns updated post when owned draft exists", async () => {
    let selectCount = 0;
    const db = createMockDb((query) => {
      if (query.includes("SELECT id FROM posts WHERE id = ? AND user_id = ? AND status = 'draft'")) {
        const ownerCheck = createMockPrepared({
          bind: vi.fn(() => ({
            first: vi.fn(async () => ({ id: "post_1" }))
          })) as unknown as MockPrepared["bind"]
        });
        return ownerCheck;
      }
      if (query.includes("UPDATE posts SET caption = ? WHERE id = ?")) {
        return createMockPrepared({
          bind: vi.fn(() => ({
            run: vi.fn(async () => ({ success: true, meta: { changes: 1 } }))
          })) as unknown as MockPrepared["bind"]
        });
      }

      selectCount += 1;
      return createMockPrepared({
        bind: vi.fn(() => ({
          first: vi.fn(async () => ({
            id: "post_1",
            userId: "user_1",
            caption: "updated",
            status: "draft",
            totalDrinks: 0,
            createdAt: 100,
            publishedAt: null
          }))
        })) as unknown as MockPrepared["bind"]
      });
    });

    const updated = await updateDraftCaption(db, {
      postId: "post_1",
      userId: "user_1",
      caption: "updated"
    });

    expect(updated?.caption).toBe("updated");
    expect(selectCount).toBe(1);
  });

  it("publishDraftPost returns no_stops for empty drafts", async () => {
    const db = createMockDb((query) => {
      if (query.includes("SELECT id FROM posts WHERE id = ? AND user_id = ? AND status = 'draft'")) {
        return createMockPrepared({
          bind: vi.fn(() => ({
            first: vi.fn(async () => ({ id: "post_1" }))
          })) as unknown as MockPrepared["bind"]
        });
      }
      if (query.includes("SELECT COALESCE(SUM(drink_count), 0) AS total_drinks, COUNT(*) AS stop_count")) {
        return createMockPrepared({
          bind: vi.fn(() => ({
            first: vi.fn(async () => ({ total_drinks: 0, stop_count: 0 }))
          })) as unknown as MockPrepared["bind"]
        });
      }
      return prepared;
    });

    const result = await publishDraftPost(db, {
      postId: "post_1",
      userId: "user_1",
      publishedAt: 200
    });

    expect(result.kind).toBe("no_stops");
  });
});

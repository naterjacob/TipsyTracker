-- Forward migration for existing databases:
-- 1) add users.bio
-- 2) relax users.username from NOT NULL to nullable

PRAGMA foreign_keys=OFF;

CREATE TABLE users_new (
  id           TEXT PRIMARY KEY,
  username     TEXT UNIQUE,
  display_name TEXT,
  avatar_url   TEXT,
  bio          TEXT,
  created_at   INTEGER NOT NULL
);

INSERT INTO users_new (id, username, display_name, avatar_url, bio, created_at)
SELECT id, username, display_name, avatar_url, NULL, created_at
FROM users;

DROP TABLE users;
ALTER TABLE users_new RENAME TO users;

PRAGMA foreign_keys=ON;

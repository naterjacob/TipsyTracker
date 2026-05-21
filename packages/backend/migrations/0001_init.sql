-- Initial schema. This file is the source of truth for the DB structure.

CREATE TABLE users (
  id           TEXT PRIMARY KEY,
  username     TEXT UNIQUE,
  display_name TEXT,
  avatar_url   TEXT,
  bio          TEXT,
  created_at   INTEGER NOT NULL
);

CREATE TABLE bars (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  neighborhood TEXT,
  created_at   INTEGER NOT NULL
);

CREATE TABLE posts (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users(id),
  caption      TEXT,
  status       TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  total_drinks INTEGER NOT NULL DEFAULT 0,
  created_at   INTEGER NOT NULL,
  published_at INTEGER
);
CREATE INDEX idx_posts_user   ON posts(user_id);
CREATE INDEX idx_posts_status ON posts(status, published_at DESC);

CREATE TABLE stops (
  id          TEXT PRIMARY KEY,
  post_id     TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  bar_id      TEXT NOT NULL REFERENCES bars(id),
  drink_count INTEGER NOT NULL DEFAULT 0,
  note        TEXT,
  stop_order  INTEGER NOT NULL,
  arrived_at  INTEGER NOT NULL
);
CREATE INDEX idx_stops_post ON stops(post_id, stop_order);

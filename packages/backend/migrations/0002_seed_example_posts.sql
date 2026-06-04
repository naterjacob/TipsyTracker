-- Demo users (Clerk IDs are synthetic for local seed data only)
INSERT OR IGNORE INTO users (id, username, display_name, avatar_url, bio, created_at) VALUES
  ('user_demo_alex', 'alex_crawls', 'Alex Rivera', NULL, 'Thursday night regular on Higuera.', unixepoch() - 86400 * 30),
  ('user_demo_jordan', 'jordan_hops', 'Jordan Lee', NULL, 'Brewery mile enthusiast.', unixepoch() - 86400 * 25),
  ('user_demo_sam', 'sam_nights', 'Sam Ortiz', NULL, 'Logs every stop, every time.', unixepoch() - 86400 * 20);

-- Published posts (visible on /api/feed)
INSERT OR IGNORE INTO posts (id, user_id, caption, status, total_drinks, created_at, published_at) VALUES
  (
    'post_demo_01',
    'user_demo_alex',
    'Downtown crawl: started slow, ended with karaoke energy.',
    'published',
    5,
    unixepoch() - 86400 * 3 - 14400,
    unixepoch() - 86400 * 3
  ),
  (
    'post_demo_02',
    'user_demo_jordan',
    'Broad Street brewery loop — flight boards were undefeated.',
    'published',
    4,
    unixepoch() - 86400 * 2 - 10800,
    unixepoch() - 86400 * 2
  ),
  (
    'post_demo_03',
    'user_demo_sam',
    'Graduation week throwback route. Still holds up.',
    'published',
    6,
    unixepoch() - 86400 * 1 - 18000,
    unixepoch() - 86400 * 1
  ),
  (
    'post_demo_04',
    'user_demo_alex',
    'Quick two-stop reset before midterms.',
    'published',
    2,
    unixepoch() - 7200,
    unixepoch() - 3600
  );

-- Stops for post_demo_01 (5 drinks, 3 bars)
INSERT OR IGNORE INTO stops (id, post_id, bar_id, drink_count, note, stop_order, arrived_at) VALUES
  ('stop_demo_01_1', 'post_demo_01', 'bar_02', 2, 'Happy hour IPA', 1, unixepoch() - 86400 * 3 - 14400),
  ('stop_demo_01_2', 'post_demo_01', 'bar_06', 2, 'Pool table crew', 2, unixepoch() - 86400 * 3 - 10800),
  ('stop_demo_01_3', 'post_demo_01', 'bar_08', 1, 'Last call cider', 3, unixepoch() - 86400 * 3 - 7200);

-- Stops for post_demo_02 (4 drinks, 2 bars)
INSERT OR IGNORE INTO stops (id, post_id, bar_id, drink_count, note, stop_order, arrived_at) VALUES
  ('stop_demo_02_1', 'post_demo_02', 'bar_13', 2, 'West Coast pilsner', 1, unixepoch() - 86400 * 2 - 10800),
  ('stop_demo_02_2', 'post_demo_02', 'bar_14', 2, 'Seasonal lager flight', 2, unixepoch() - 86400 * 2 - 5400);

-- Stops for post_demo_03 (6 drinks, 4 bars)
INSERT OR IGNORE INTO stops (id, post_id, bar_id, drink_count, note, stop_order, arrived_at) VALUES
  ('stop_demo_03_1', 'post_demo_03', 'bar_03', 1, 'Patio meetup', 1, unixepoch() - 86400 * 1 - 18000),
  ('stop_demo_03_2', 'post_demo_03', 'bar_07', 2, 'Shared pitcher', 2, unixepoch() - 86400 * 1 - 14400),
  ('stop_demo_03_3', 'post_demo_03', 'bar_11', 2, 'Darts tournament', 3, unixepoch() - 86400 * 1 - 10800),
  ('stop_demo_03_4', 'post_demo_03', 'bar_01', 1, 'Nightcap stout', 4, unixepoch() - 86400 * 1 - 7200);

-- Stops for post_demo_04 (2 drinks, 2 bars)
INSERT OR IGNORE INTO stops (id, post_id, bar_id, drink_count, note, stop_order, arrived_at) VALUES
  ('stop_demo_04_1', 'post_demo_04', 'bar_05', 1, 'Study break espresso stout', 1, unixepoch() - 7200),
  ('stop_demo_04_2', 'post_demo_04', 'bar_04', 1, 'One-and-done sour', 2, unixepoch() - 5400);

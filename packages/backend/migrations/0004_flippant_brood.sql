PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_users` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text,
	`display_name` text,
	`avatar_url` text,
	`bio` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_users`("id", "username", "display_name", "avatar_url", "bio", "created_at") SELECT "id", "username", "display_name", "avatar_url", "bio", "created_at" FROM `users`;--> statement-breakpoint
DROP TABLE `users`;--> statement-breakpoint
ALTER TABLE `__new_users` RENAME TO `users`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `users_username_unique` ON `users` (`username`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_posts_user` ON `posts` (`user_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_posts_status` ON `posts` (`status`,`published_at`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_stops_post` ON `stops` (`post_id`,`stop_order`);

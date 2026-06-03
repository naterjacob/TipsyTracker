--> statement-breakpoint
CREATE TABLE IF NOT EXISTS`comments` (
	`id` text PRIMARY KEY NOT NULL,
	`post_id` text NOT NULL,
	`user_id` text NOT NULL,
	`content` text NOT NULL,
	`published_at` integer NOT NULL,
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `likes` (
	`post_id` text NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_comments_post_published` ON `comments` (`post_id`,`published_at`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_comments_user` ON `comments` (`user_id`);
--> statement-breakpoint
CREATE INDEX `idx_likes_post` ON `likes` (`post_id`);
--> statement-breakpoint
CREATE INDEX `idx_likes_user` ON `likes` (`user_id`);
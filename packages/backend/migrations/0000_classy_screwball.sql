CREATE TABLE IF NOT EXISTS `bars` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`neighborhood` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `posts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`caption` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`total_drinks` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`published_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `stops` (
	`id` text PRIMARY KEY NOT NULL,
	`post_id` text NOT NULL,
	`bar_id` text NOT NULL,
	`drink_count` integer DEFAULT 0 NOT NULL,
	`note` text,
	`stop_order` integer NOT NULL,
	`arrived_at` integer NOT NULL,
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`bar_id`) REFERENCES `bars`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `users` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`display_name` text,
	`avatar_url` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `users_username_unique` ON `users` (`username`);

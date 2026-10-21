-- Credit card details (Turkish cards): the limit, statement and due days, the minimum payment
-- rate and the monthly interest rate of a credit card or line of credit, plus installment
-- purchases (taksitli alışveriş). All additive: accounts without details work as before.
CREATE TABLE `account_details` (
	`account_id` text PRIMARY KEY NOT NULL,
	`credit_limit` integer,
	`statement_day` integer,
	`due_day` integer,
	`min_payment_rate` integer,
	`interest_rate` integer,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `installment_plans` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`transaction_id` text,
	`description` text NOT NULL,
	`total_amount` integer NOT NULL,
	`installment_count` integer NOT NULL,
	`first_month` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `installment_plans_account_idx` ON `installment_plans` (`account_id`);

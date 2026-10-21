-- Asset details (gold, foreign currency, funds, shares, crypto): how much the account holds
-- (`asset_quantity`, a decimal string with at most 8 decimals, e.g. "12.5"), in what unit
-- (`asset_unit`, free text: "gram altın", "adet", "lot"…), the last price of one unit in the
-- account's minor units and that price's day. All nullable and additive: accounts without them
-- work as before.
ALTER TABLE `account_details` ADD `asset_quantity` text;
--> statement-breakpoint
ALTER TABLE `account_details` ADD `asset_unit` text;
--> statement-breakpoint
ALTER TABLE `account_details` ADD `asset_unit_price` integer;
--> statement-breakpoint
ALTER TABLE `account_details` ADD `asset_price_date` text;

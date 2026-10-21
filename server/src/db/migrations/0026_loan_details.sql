-- Loan details (Turkish loans: ihtiyaç, konut, taşıt, eğitim kredisi): the principal drawn, the
-- monthly contract rate, the term, the first installment's day and the BSMV/KKDF tax rates, for
-- an equal-installment payment plan. All nullable and additive: accounts without them work as
-- before. Rates in basis points (349 = %3,49).
ALTER TABLE `account_details` ADD `loan_principal` integer;
--> statement-breakpoint
ALTER TABLE `account_details` ADD `loan_rate` integer;
--> statement-breakpoint
ALTER TABLE `account_details` ADD `loan_term` integer;
--> statement-breakpoint
ALTER TABLE `account_details` ADD `loan_first_payment` text;
--> statement-breakpoint
ALTER TABLE `account_details` ADD `loan_bsmv_rate` integer;
--> statement-breakpoint
ALTER TABLE `account_details` ADD `loan_kkdf_rate` integer;

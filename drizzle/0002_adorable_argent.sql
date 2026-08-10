CREATE TABLE `supplier_profiles` (
	`userId` int NOT NULL,
	`companyName` varchar(255),
	`cnpj` varchar(18),
	`contactPhone` varchar(32),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `supplier_profiles_userId` PRIMARY KEY(`userId`)
);
--> statement-breakpoint
CREATE TABLE `supplier_quotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`equipmentId` int NOT NULL,
	`supplierUserId` int NOT NULL,
	`unitValueCents` int NOT NULL,
	`offeredBrand` varchar(255),
	`offeredModel` text,
	`leadTimeDays` int,
	`notes` text,
	`status` enum('draft','submitted') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `supplier_quotes_id` PRIMARY KEY(`id`),
	CONSTRAINT `supplier_equipment_quote_unique` UNIQUE(`supplierUserId`,`equipmentId`)
);
--> statement-breakpoint
CREATE TABLE `user_permissions` (
	`userId` int NOT NULL,
	`canViewDashboard` boolean NOT NULL DEFAULT true,
	`canViewItems` boolean NOT NULL DEFAULT true,
	`canEditItems` boolean NOT NULL DEFAULT false,
	`canViewStages` boolean NOT NULL DEFAULT true,
	`canEditStages` boolean NOT NULL DEFAULT false,
	`canViewInvoices` boolean NOT NULL DEFAULT true,
	`canManageInvoices` boolean NOT NULL DEFAULT false,
	`canViewBudgetValues` boolean NOT NULL DEFAULT false,
	`canViewSupplierQuotes` boolean NOT NULL DEFAULT false,
	`canSubmitQuotes` boolean NOT NULL DEFAULT false,
	`updatedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_permissions_userId` PRIMARY KEY(`userId`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','supplier') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` ADD `isActive` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `supplier_profiles` ADD CONSTRAINT `supplier_profiles_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `supplier_quotes` ADD CONSTRAINT `supplier_quotes_equipmentId_equipment_items_id_fk` FOREIGN KEY (`equipmentId`) REFERENCES `equipment_items`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `supplier_quotes` ADD CONSTRAINT `supplier_quotes_supplierUserId_users_id_fk` FOREIGN KEY (`supplierUserId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_permissions` ADD CONSTRAINT `user_permissions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_permissions` ADD CONSTRAINT `user_permissions_updatedBy_users_id_fk` FOREIGN KEY (`updatedBy`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `quote_equipment_idx` ON `supplier_quotes` (`equipmentId`);--> statement-breakpoint
CREATE INDEX `quote_status_idx` ON `supplier_quotes` (`status`);
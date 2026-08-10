CREATE TABLE `equipment_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`itemNumber` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`brand` varchar(255),
	`model` text,
	`quantity` int NOT NULL DEFAULT 1,
	`unitValueCents` int NOT NULL DEFAULT 0,
	`totalValueCents` int NOT NULL DEFAULT 0,
	`invoiceUrl` text,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `equipment_items_id` PRIMARY KEY(`id`),
	CONSTRAINT `equipment_item_number_unique` UNIQUE(`itemNumber`)
);
--> statement-breakpoint
CREATE TABLE `procurement_stages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`equipmentId` int NOT NULL,
	`stageKey` enum('acquisition','invoice_link','shipping','expected_delivery','delivery','installation') NOT NULL,
	`status` enum('pending','in_progress','completed','blocked') NOT NULL DEFAULT 'pending',
	`stageDate` bigint,
	`notes` text,
	`updatedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `procurement_stages_id` PRIMARY KEY(`id`),
	CONSTRAINT `equipment_stage_unique` UNIQUE(`equipmentId`,`stageKey`)
);
--> statement-breakpoint
ALTER TABLE `equipment_items` ADD CONSTRAINT `equipment_items_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `procurement_stages` ADD CONSTRAINT `procurement_stages_equipmentId_equipment_items_id_fk` FOREIGN KEY (`equipmentId`) REFERENCES `equipment_items`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `procurement_stages` ADD CONSTRAINT `procurement_stages_updatedBy_users_id_fk` FOREIGN KEY (`updatedBy`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `equipment_name_idx` ON `equipment_items` (`name`);--> statement-breakpoint
CREATE INDEX `stage_status_idx` ON `procurement_stages` (`status`);
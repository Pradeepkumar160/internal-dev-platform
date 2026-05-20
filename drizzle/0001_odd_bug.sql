CREATE TABLE `deploymentLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`deploymentId` int NOT NULL,
	`message` text NOT NULL,
	`level` enum('debug','info','warn','error') DEFAULT 'info',
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `deploymentLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `deployments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`serviceId` int NOT NULL,
	`status` enum('pending','in_progress','success','failed','rolled_back') NOT NULL DEFAULT 'pending',
	`version` varchar(255) NOT NULL,
	`triggeredBy` int,
	`githubWorkflowId` varchar(255),
	`commitSha` varchar(255),
	`branch` varchar(255) DEFAULT 'main',
	`duration` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `deployments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `environmentVariables` (
	`id` int AUTO_INCREMENT NOT NULL,
	`serviceId` int NOT NULL,
	`key` varchar(255) NOT NULL,
	`value` text NOT NULL,
	`isSecret` boolean DEFAULT false,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `environmentVariables_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `services` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`status` enum('healthy','degraded','down') NOT NULL DEFAULT 'healthy',
	`uptime` decimal(5,2) DEFAULT '100.00',
	`lastHealthCheck` timestamp DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `services_id` PRIMARY KEY(`id`),
	CONSTRAINT `services_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('viewer','developer','admin') NOT NULL DEFAULT 'viewer';
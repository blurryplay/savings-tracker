-- CreateTable
CREATE TABLE `savings_plans` (
    `id` VARCHAR(191) NOT NULL,
    `goalName` VARCHAR(191) NOT NULL,
    `targetAmount` DOUBLE NOT NULL,
    `currentBalance` DOUBLE NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `contributions` (
    `id` VARCHAR(191) NOT NULL,
    `amount` DOUBLE NOT NULL,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `planId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `contributions` ADD CONSTRAINT `contributions_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `savings_plans`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

/*
  Warnings:

  - Added the required column `file` to the `Post` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Post` ADD COLUMN `file` VARCHAR(191) NOT NULL;

/*
  Warnings:

  - A unique constraint covering the columns `[verification_token]` on the table `admins` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[reset_token]` on the table `admins` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "admins" ADD COLUMN     "email_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reset_token" TEXT,
ADD COLUMN     "verification_token" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "admins_verification_token_key" ON "admins"("verification_token");

-- CreateIndex
CREATE UNIQUE INDEX "admins_reset_token_key" ON "admins"("reset_token");

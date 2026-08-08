-- Add missing admin profile fields required by the current Prisma schema
ALTER TABLE "admins"
ADD COLUMN IF NOT EXISTS "instagram_url" TEXT,
ADD COLUMN IF NOT EXISTS "show_instagram" BOOLEAN NOT NULL DEFAULT true;
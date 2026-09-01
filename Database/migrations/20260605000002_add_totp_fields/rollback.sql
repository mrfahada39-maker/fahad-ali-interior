-- Rollback: Remove TOTP 2FA fields from User table

ALTER TABLE "User" DROP COLUMN IF EXISTS "totpSecret";
ALTER TABLE "User" DROP COLUMN IF EXISTS "totpEnabled";

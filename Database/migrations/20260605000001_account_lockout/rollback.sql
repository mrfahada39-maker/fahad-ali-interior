-- Rollback: Remove account lockout fields from User table
-- Run this BEFORE rolling back the migration if needed

ALTER TABLE "User" DROP COLUMN IF EXISTS "loginAttempts";
ALTER TABLE "User" DROP COLUMN IF EXISTS "lockedUntil";
DROP INDEX IF EXISTS "User_lockedUntil_idx";

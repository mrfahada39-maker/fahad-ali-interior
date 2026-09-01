-- Migration: Add account lockout fields to User table
-- loginAttempts: counts consecutive failed login attempts
-- lockedUntil: timestamp until which account is locked (NULL = not locked)

ALTER TABLE "User" ADD COLUMN "loginAttempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "lockedUntil" TIMESTAMP(3);

-- Index for efficient lockout queries
CREATE INDEX "User_lockedUntil_idx" ON "User"("lockedUntil");

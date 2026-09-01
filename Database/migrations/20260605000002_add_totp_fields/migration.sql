-- Migration: Add TOTP 2FA fields to User table
-- totpSecret: AES-encrypted TOTP secret key (NULL = 2FA not set up)
-- totpEnabled: whether 2FA is actively required on login

ALTER TABLE "User" ADD COLUMN "totpSecret"  TEXT    DEFAULT NULL;
ALTER TABLE "User" ADD COLUMN "totpEnabled" BOOLEAN NOT NULL DEFAULT false;

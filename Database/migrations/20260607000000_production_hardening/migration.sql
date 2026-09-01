-- 1. Composite Index on Order (userId, createdAt) for efficient dashboard/history lookups
CREATE INDEX IF NOT EXISTS "Order_userId_createdAt_idx" ON "Order"("userId", "createdAt");

-- 2. CHECK Constraint on Review rating (1-5)
ALTER TABLE "Review" DROP CONSTRAINT IF EXISTS "Review_rating_check";
ALTER TABLE "Review" ADD CONSTRAINT "Review_rating_check" CHECK (rating >= 1 AND rating <= 5);

-- 3. Optimization Index on RefreshToken (userId, revokedAt) for token validation
CREATE INDEX IF NOT EXISTS "RefreshToken_userId_revokedAt_idx" ON "RefreshToken"("userId", "revokedAt");

-- 4. Optimization Index on AuditLog (entityId) for specific entity history
CREATE INDEX IF NOT EXISTS "AuditLog_entityId_idx" ON "AuditLog"("entityId");

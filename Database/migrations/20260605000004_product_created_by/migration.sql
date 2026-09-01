-- Migration: Add createdBy field to Product (vendor ownership tracking)
ALTER TABLE "Product" ADD COLUMN "createdBy" TEXT DEFAULT NULL;
CREATE INDEX "Product_createdBy_idx" ON "Product"("createdBy");

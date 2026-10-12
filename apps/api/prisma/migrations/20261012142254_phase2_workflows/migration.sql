-- AlterTable
ALTER TABLE "inquiries" ADD COLUMN     "acceptedAt" TIMESTAMP(3),
ADD COLUMN     "closedAt" TIMESTAMP(3),
ADD COLUMN     "closedReason" TEXT,
ADD COLUMN     "offerExpiresAt" TIMESTAMP(3),
ADD COLUMN     "offerMadeAt" TIMESTAMP(3),
ADD COLUMN     "offerNote" TEXT,
ADD COLUMN     "paymentDueAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "inspection_bookings" ADD COLUMN     "proposedById" TEXT;

-- AlterTable
ALTER TABLE "landlord_profiles" ADD COLUMN     "bankAccountVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "bankName" TEXT;

-- AlterTable
ALTER TABLE "payment_disputes" ADD COLUMN     "outcome" TEXT;

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "inquiryId" TEXT,
ADD COLUMN     "legalFee" DECIMAL(14,2) NOT NULL DEFAULT 0,
ADD COLUMN     "refundAmount" DECIMAL(14,2),
ADD COLUMN     "releaseAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "releaseError" TEXT,
ADD COLUMN     "serviceCharge" DECIMAL(14,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "tenancy_agreements" ADD COLUMN     "autoReleaseAt" TIMESTAMP(3),
ADD COLUMN     "cancellationReason" TEXT,
ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "handoverMarkedAt" TIMESTAMP(3),
ADD COLUMN     "moveInConfirmedAt" TIMESTAMP(3),
ADD COLUMN     "releaseMethod" TEXT;

-- CreateTable
CREATE TABLE "admin_actions" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "reason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_actions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "admin_actions_adminId_idx" ON "admin_actions"("adminId");

-- CreateIndex
CREATE INDEX "admin_actions_targetType_targetId_idx" ON "admin_actions"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "admin_actions_createdAt_idx" ON "admin_actions"("createdAt");

-- CreateIndex
CREATE INDEX "payments_inquiryId_idx" ON "payments"("inquiryId");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "fk_payment_inquiry" FOREIGN KEY ("inquiryId") REFERENCES "inquiries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_actions" ADD CONSTRAINT "fk_admin_action_admin" FOREIGN KEY ("adminId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Sequential, gap-tolerant receipt numbers (LTR-<year>-000001)
CREATE SEQUENCE IF NOT EXISTS "receipt_number_seq" START 1;

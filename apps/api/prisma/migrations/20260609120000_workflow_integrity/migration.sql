-- Money is stored as exact decimal values while the API continues to serialize numbers.
ALTER TABLE "tenant_profiles" ALTER COLUMN "monthlyIncome" TYPE DECIMAL(14,2);
ALTER TABLE "listings" ALTER COLUMN "annualRent" TYPE DECIMAL(14,2);
ALTER TABLE "listings" ALTER COLUMN "cautionFee" TYPE DECIMAL(14,2);
ALTER TABLE "listings" ALTER COLUMN "agencyFee" TYPE DECIMAL(14,2);
ALTER TABLE "listings" ALTER COLUMN "serviceCharge" TYPE DECIMAL(14,2);
ALTER TABLE "listings" ALTER COLUMN "legalFee" TYPE DECIMAL(14,2);
ALTER TABLE "payments" ALTER COLUMN "annualRent" TYPE DECIMAL(14,2);
ALTER TABLE "payments" ALTER COLUMN "cautionFee" TYPE DECIMAL(14,2);
ALTER TABLE "payments" ALTER COLUMN "platformFee" TYPE DECIMAL(14,2);
ALTER TABLE "payments" ALTER COLUMN "agentFeeSaved" TYPE DECIMAL(14,2);
ALTER TABLE "payments" ALTER COLUMN "totalAmount" TYPE DECIMAL(14,2);

CREATE TYPE "DisputeStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED');

CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "inquiryId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

INSERT INTO "messages" ("id", "inquiryId", "senderId", "body", "readAt", "createdAt", "updatedAt")
SELECT
    concat('migrated-', i."id"),
    i."id",
    i."tenantId",
    i."initialMessage",
    NULL,
    i."createdAt",
    i."createdAt"
FROM "inquiries" i;

ALTER TABLE "inquiries" DROP COLUMN "messages";

ALTER TABLE "payments" ADD COLUMN "paystackTransferCode" TEXT;
ALTER TABLE "payments" ADD COLUMN "transferReference" TEXT;

CREATE TABLE "payment_disputes" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "openedById" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "DisputeStatus" NOT NULL DEFAULT 'OPEN',
    "resolution" TEXT,
    "resolvedById" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "payment_disputes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "uq_tenancy_listing_tenant" ON "tenancy_agreements"("listingId", "tenantId");
CREATE UNIQUE INDEX "uq_review_parties_listing" ON "reviews"("reviewerId", "revieweeId", "listingId");
CREATE UNIQUE INDEX "payments_paystackTransferCode_key" ON "payments"("paystackTransferCode");
CREATE UNIQUE INDEX "payments_transferReference_key" ON "payments"("transferReference");
CREATE INDEX "messages_inquiryId_createdAt_idx" ON "messages"("inquiryId", "createdAt");
CREATE INDEX "messages_senderId_idx" ON "messages"("senderId");
CREATE INDEX "payment_disputes_paymentId_idx" ON "payment_disputes"("paymentId");
CREATE INDEX "payment_disputes_status_idx" ON "payment_disputes"("status");

ALTER TABLE "messages" ADD CONSTRAINT "fk_message_inquiry" FOREIGN KEY ("inquiryId") REFERENCES "inquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "messages" ADD CONSTRAINT "fk_message_sender" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payment_disputes" ADD CONSTRAINT "fk_dispute_payment" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payment_disputes" ADD CONSTRAINT "payment_disputes_openedById_fkey" FOREIGN KEY ("openedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payment_disputes" ADD CONSTRAINT "payment_disputes_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "verification_documents" ADD CONSTRAINT "verification_documents_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

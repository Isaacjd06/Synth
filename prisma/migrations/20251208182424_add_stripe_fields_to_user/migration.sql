-- AlterTable
ALTER TABLE "User" ADD COLUMN "stripe_customer_id" TEXT,
ADD COLUMN "stripe_subscription_id" TEXT,
ADD COLUMN "subscription_ends_at" TIMESTAMP(3),
ADD COLUMN "subscription_plan" TEXT,
ADD COLUMN "subscription_started_at" TIMESTAMP(3),
ADD COLUMN "subscription_status" TEXT DEFAULT 'inactive',
ADD COLUMN "trial_ends_at" TIMESTAMP(3),
ADD COLUMN "stripe_payment_method_id" TEXT,
ADD COLUMN "subscription_renewal_at" TIMESTAMP(3),
ADD COLUMN "subscription_add_ons" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateIndex
CREATE UNIQUE INDEX "User_stripe_customer_id_key" ON "User"("stripe_customer_id") WHERE "stripe_customer_id" IS NOT NULL;

-- AlterTable
-- Add unique constraint to Execution.pipedream_execution_id
CREATE UNIQUE INDEX "Execution_pipedream_execution_id_key" ON "Execution"("pipedream_execution_id") WHERE "pipedream_execution_id" IS NOT NULL;


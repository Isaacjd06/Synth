-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('free', 'starter', 'pro', 'agency');

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "subscription_plan" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "subscription_plan" TYPE "SubscriptionPlan" USING (
  CASE 
    WHEN "subscription_plan" IS NULL THEN 'free'::"SubscriptionPlan"
    WHEN LOWER("subscription_plan") LIKE '%starter%' THEN 'starter'::"SubscriptionPlan"
    WHEN LOWER("subscription_plan") LIKE '%pro%' OR LOWER("subscription_plan") LIKE '%growth%' THEN 'pro'::"SubscriptionPlan"
    WHEN LOWER("subscription_plan") LIKE '%agency%' OR LOWER("subscription_plan") LIKE '%scale%' OR LOWER("subscription_plan") LIKE '%enterprise%' THEN 'agency'::"SubscriptionPlan"
    ELSE 'free'::"SubscriptionPlan"
  END
);
ALTER TABLE "User" ALTER COLUMN "subscription_plan" SET DEFAULT 'free';


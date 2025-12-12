-- CreateEnum (only if it doesn't exist)
DO $$ BEGIN
  CREATE TYPE "SubscriptionPlan" AS ENUM ('free', 'starter', 'pro', 'agency');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AlterTable (only if column is not already the enum type)
DO $$ 
BEGIN
  -- Check if column is already using the enum type
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'User' 
    AND column_name = 'subscription_plan' 
    AND udt_name = 'SubscriptionPlan'
  ) THEN
    -- Column is already the enum type, just ensure default is set
    ALTER TABLE "User" ALTER COLUMN "subscription_plan" SET DEFAULT 'free';
  ELSE
    -- Column needs to be converted to enum type
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
  END IF;
END $$;


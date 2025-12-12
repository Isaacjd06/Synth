-- Manual Subscription Update Script for Testing
-- This script helps you manually update subscription for test users
-- 
-- IMPORTANT: Only use this for test users (stripe_subscription_id IS NULL)
-- Real customers must be managed through Stripe webhooks

-- ============================================
-- STEP 1: Find your user ID
-- ============================================
-- Replace 'your-email@example.com' with your actual email
SELECT id, email, subscription_plan, "subscriptionStatus", stripe_subscription_id
FROM "User"
WHERE email = 'your-email@example.com';

-- ============================================
-- STEP 2: Ensure user is a test user
-- ============================================
-- Set stripe_subscription_id to NULL if it exists (ONLY for test accounts!)
-- Replace 'your-user-id-here' with the ID from Step 1
UPDATE "User"
SET stripe_subscription_id = NULL
WHERE id = 'your-user-id-here'
  AND stripe_subscription_id IS NOT NULL;

-- ============================================
-- STEP 3: Update subscription
-- ============================================
-- Replace 'your-user-id-here' with your actual user ID
-- Choose ONE of the following options:

-- OPTION A: Starter Plan, SUBSCRIBED
UPDATE "User"
SET 
  subscription_plan = 'starter'::"SubscriptionPlan",
  "subscriptionStatus" = 'SUBSCRIBED'::"SubscriptionStatus",
  subscription_status = 'active',
  last_plan_change_at = NOW()
WHERE id = 'your-user-id-here';

-- OPTION B: Pro Plan, SUBSCRIBED
UPDATE "User"
SET 
  subscription_plan = 'pro'::"SubscriptionPlan",
  "subscriptionStatus" = 'SUBSCRIBED'::"SubscriptionStatus",
  subscription_status = 'active',
  last_plan_change_at = NOW()
WHERE id = 'your-user-id-here';

-- OPTION C: Agency Plan, SUBSCRIBED
UPDATE "User"
SET 
  subscription_plan = 'agency'::"SubscriptionPlan",
  "subscriptionStatus" = 'SUBSCRIBED'::"SubscriptionStatus",
  subscription_status = 'active',
  last_plan_change_at = NOW()
WHERE id = 'your-user-id-here';

-- OPTION D: Free Plan, UNSUBSCRIBED
UPDATE "User"
SET 
  subscription_plan = 'free'::"SubscriptionPlan",
  "subscriptionStatus" = 'UNSUBSCRIBED'::"SubscriptionStatus",
  subscription_status = 'inactive',
  last_plan_change_at = NOW()
WHERE id = 'your-user-id-here';

-- ============================================
-- STEP 4: Verify the update
-- ============================================
SELECT 
  id,
  email,
  subscription_plan,
  "subscriptionStatus",
  subscription_status,
  stripe_subscription_id,
  last_plan_change_at
FROM "User"
WHERE id = 'your-user-id-here';

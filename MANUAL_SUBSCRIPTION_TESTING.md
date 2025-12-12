# Manual Subscription Testing Guide

This guide explains how to manually change subscription plans and statuses for **testing purposes only** by editing the database directly.

## ⚠️ Important Rules

1. **Test Users Only**: Manual changes ONLY work for users who do NOT have a `stripe_subscription_id` in the database.
2. **Real Customers Protected**: Users with `stripe_subscription_id` are real paying customers and MUST be managed through Stripe webhooks and checkout flows.
3. **Paying Customers**: Real customers can still upgrade/downgrade through Stripe checkout - this is not affected.

## How to Edit Subscription in Database

### Step 1: Ensure User is a Test User

**IMPORTANT**: Only edit users where `stripe_subscription_id` is NULL. Real customers are protected.

```sql
-- Check if user has Stripe subscription
SELECT id, email, stripe_subscription_id, subscription_plan, "subscriptionStatus"
FROM "User"
WHERE id = 'your-user-id';

-- If stripe_subscription_id is NOT NULL, set it to NULL (TEST USERS ONLY!)
UPDATE "User"
SET stripe_subscription_id = NULL
WHERE id = 'your-user-id';
```

**⚠️ WARNING**: Only do this for test accounts! Never for real paying customers.

### Step 2: Update Subscription

Use these SQL templates. **IMPORTANT**: Always update BOTH `subscription_plan` AND `subscriptionStatus` together.

**Starter Plan:**
```sql
UPDATE "User"
SET 
  subscription_plan = 'starter'::"SubscriptionPlan",
  "subscriptionStatus" = 'SUBSCRIBED'::"SubscriptionStatus",
  subscription_status = 'active',
  last_plan_change_at = NOW()
WHERE id = 'your-user-id';
```

**Pro Plan:**
```sql
UPDATE "User"
SET 
  subscription_plan = 'pro'::"SubscriptionPlan",
  "subscriptionStatus" = 'SUBSCRIBED'::"SubscriptionStatus",
  subscription_status = 'active',
  last_plan_change_at = NOW()
WHERE id = 'your-user-id';
```

**Agency Plan:**
```sql
UPDATE "User"
SET 
  subscription_plan = 'agency'::"SubscriptionPlan",
  "subscriptionStatus" = 'SUBSCRIBED'::"SubscriptionStatus",
  subscription_status = 'active',
  last_plan_change_at = NOW()
WHERE id = 'your-user-id';
```

**Free Plan:**
```sql
UPDATE "User"
SET 
  subscription_plan = 'free'::"SubscriptionPlan",
  "subscriptionStatus" = 'UNSUBSCRIBED'::"SubscriptionStatus",
  subscription_status = 'inactive',
  last_plan_change_at = NOW()
WHERE id = 'your-user-id';
```

### Step 3: Verify Changes

```sql
SELECT 
  id,
  email,
  subscription_plan,
  "subscriptionStatus",
  subscription_status,
  stripe_subscription_id
FROM "User"
WHERE id = 'your-user-id';
```

### Step 4: Refresh UI

After updating the database:
1. **Refresh the Connections page** (`/connections`) to see the changes
2. The UI will automatically reflect the new subscription plan

## Important SQL Notes

1. **Enum Casting Required**: PostgreSQL requires explicit casting for enum types:
   - `'starter'::"SubscriptionPlan"`
   - `'SUBSCRIBED'::"SubscriptionStatus"`

2. **Case Sensitivity**: `subscriptionStatus` requires double quotes: `"subscriptionStatus"`

3. **Update All Fields**: Always update:
   - `subscription_plan` (enum)
   - `subscriptionStatus` (enum) 
   - `subscription_status` (string, legacy field)

## What Each Plan Unlocks

- **Starter**: Integrations 1-15 unlocked
- **Pro**: Integrations 1-30 unlocked
- **Agency**: All 40 integrations unlocked
- **Free**: View-only (all integrations locked)

## How It Works

### Protection Mechanism

1. **Webhook Handler** (`/api/webhooks/stripe/route.ts`):
   - Checks if `user.stripe_subscription_id` exists before updating
   - Only updates users with Stripe subscriptions
   - Skips manual changes for test users (where `stripe_subscription_id` is NULL)

2. **Sync Route** (`/api/stripe/sync/route.ts`):
   - Checks if `user.stripe_customer_id` and `user.stripe_subscription_id` exist
   - Returns early if missing (preserves manual changes)

### Flow Diagram

```
User in Database
├── Has stripe_subscription_id?
│   ├── YES → Real Customer
│   │   ├── Managed by Stripe webhooks ✅
│   │   ├── Can upgrade via Stripe checkout ✅
│   │   └── Manual changes BLOCKED ❌
│   │
│   └── NO → Test User
│       ├── Can be changed manually ✅
│       └── Stripe webhooks skip updates ✅
```

## Troubleshooting

### Changes keep reverting

**Cause**: User has `stripe_subscription_id` set, so Stripe webhooks are overwriting changes.

**Solution**: 
1. Set `stripe_subscription_id` to NULL for testing
2. Or use a test user account that never had a Stripe subscription

### Subscription status not updating in UI

**Check**:
1. Both `subscriptionStatus` (enum) and `subscription_status` (string) should be updated
2. Refresh the Connections page (`/connections`)
3. Check browser console for errors

### SQL Update Failing

**Common Issues:**
1. **Enum casting**: Must use `::"SubscriptionPlan"` and `::"SubscriptionStatus"`
2. **Case sensitivity**: `subscriptionStatus` requires double quotes: `"subscriptionStatus"`
3. **Both fields**: Always update `subscription_plan` AND `subscriptionStatus` together

**Correct SQL:**
```sql
UPDATE "User"
SET 
  subscription_plan = 'starter'::"SubscriptionPlan",
  "subscriptionStatus" = 'SUBSCRIBED'::"SubscriptionStatus",
  subscription_status = 'active'
WHERE id = 'your-user-id';
```

**Wrong SQL (will fail):**
```sql
-- Missing enum cast
UPDATE "User" SET subscription_plan = 'starter' WHERE id = 'your-user-id';

-- Wrong case
UPDATE "User" SET subscriptionStatus = 'SUBSCRIBED' WHERE id = 'your-user-id';

-- Missing quotes
UPDATE "User" SET subscriptionStatus = 'SUBSCRIBED' WHERE id = 'your-user-id';
```

## Real Customer Upgrades

Real customers (with `stripe_subscription_id`) can still upgrade/downgrade through:
1. Stripe Checkout (normal flow)
2. Stripe Customer Portal
3. Stripe webhooks will automatically sync the changes

Manual changes are blocked for real customers to ensure data integrity.

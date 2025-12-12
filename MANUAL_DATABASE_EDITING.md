# Manual Database Editing Guide

## Simple Approach: Edit Database Directly

You can manually change `subscription_plan` and `subscriptionStatus` directly in the database for testing.

### Prerequisites

**IMPORTANT**: Only edit users where `stripe_subscription_id` is NULL (test users). Real customers with Stripe subscriptions are protected.

### Step 1: Clear Stripe Subscription ID (Test Users Only)

```sql
UPDATE "User"
SET stripe_subscription_id = NULL
WHERE id = 'your-user-id';
```

**⚠️ WARNING**: Only do this for test accounts! Never for real paying customers.

### Step 2: Update Subscription

Use this SQL template (replace values as needed):

```sql
UPDATE "User"
SET 
  subscription_plan = 'starter'::"SubscriptionPlan",
  "subscriptionStatus" = 'SUBSCRIBED'::"SubscriptionStatus",
  subscription_status = 'active',
  last_plan_change_at = NOW()
WHERE id = 'your-user-id';
```

### Quick SQL Templates

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

### Important Notes

1. **Enum Casting Required**: PostgreSQL requires explicit casting for enum types:
   - `'starter'::"SubscriptionPlan"`
   - `'SUBSCRIBED'::"SubscriptionStatus"`

2. **Case Sensitivity**: `subscriptionStatus` requires double quotes: `"subscriptionStatus"`

3. **Update All Fields**: Always update:
   - `subscription_plan` (enum)
   - `subscriptionStatus` (enum)
   - `subscription_status` (string, legacy field)

4. **Refresh UI**: After updating, refresh the Connections page (`/connections`) to see changes

### Protection Mechanism

- **Test Users** (`stripe_subscription_id` IS NULL): Can be manually edited
- **Real Customers** (`stripe_subscription_id` IS NOT NULL): Protected - Stripe webhooks manage these

The webhook handlers check for `stripe_subscription_id` before updating, so manual changes to test users are preserved.

### Verify Changes

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

### What Each Plan Unlocks

- **Starter**: Integrations 1-15
- **Pro**: Integrations 1-30  
- **Agency**: All 40 integrations
- **Free**: View-only (all locked)

After updating, refresh `/connections` to see the changes.

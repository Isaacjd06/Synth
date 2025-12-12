# Manual Subscription Override for Testing

## Problem
When manually changing `subscription_plan` or `subscription_status` in the database for testing, the changes were being automatically reverted by Stripe webhook handlers and sync routes.

## Solution
The system now checks if a user has a `stripe_subscription_id` before syncing subscription data from Stripe. If a user doesn't have a Stripe subscription ID, all Stripe syncing is skipped, allowing manual database changes to persist.

## How to Use Manual Overrides

### For Testing Without Stripe:
1. **Set `stripe_subscription_id` to NULL** in the database for the user you want to test with
2. **Manually set** `subscription_plan` and `subscription_status` / `subscriptionStatus` in the database
3. Changes will now persist - no Stripe webhooks or syncs will overwrite them

### Example SQL:
```sql
-- Disable Stripe syncing for a test user
UPDATE "User" 
SET stripe_subscription_id = NULL 
WHERE email = 'test@example.com';

-- Then manually set subscription
UPDATE "User" 
SET 
  subscription_plan = 'pro',
  subscription_status = 'active',
  subscriptionStatus = 'SUBSCRIBED'
WHERE email = 'test@example.com';
```

## What Changed

### 1. Stripe Webhook Handler (`app/api/webhooks/stripe/route.ts`)
- Now checks if user has `stripe_subscription_id` before updating subscription data
- If no Stripe subscription ID exists, webhook events are ignored for that user
- This prevents webhooks from overwriting manual changes

### 2. Stripe Sync Route (`app/api/stripe/sync/route.ts`)
- Now returns early if user doesn't have `stripe_subscription_id` or `stripe_customer_id`
- Returns a message indicating the user is manually managed
- Prevents manual sync calls from overwriting manual changes

## Important Notes

- **Production users with real Stripe subscriptions**: Will continue to sync normally from Stripe
- **Test users without Stripe subscriptions**: Can be manually managed via database changes
- **To re-enable Stripe syncing**: Set the `stripe_subscription_id` back to the actual Stripe subscription ID

## Files Modified
- `app/api/webhooks/stripe/route.ts` - Added checks to skip syncing if no Stripe subscription ID
- `app/api/stripe/sync/route.ts` - Added check to skip syncing if no Stripe subscription ID

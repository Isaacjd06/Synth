# Cursor Agent: Complete Billing System Integration & Testing

## Context
A full billing system with Stripe Payment Element has been implemented in this Next.js app (Synth). Your task is to perform a comprehensive review, ensure proper integration, fix any issues, and verify the entire flow works end-to-end.

## What Was Built

### 1. Database Schema (Prisma)
- **File**: `prisma/schema.prisma`
- **Changes**: Added `subscription_add_ons` (Json) and `stripe_payment_method_id` fields to User model
- **Status**: Schema pushed to Neon database

### 2. Backend Infrastructure
- **File**: `lib/billing.ts` - Core billing utilities (10+ functions)
- **Files**: 7 API routes in `app/api/billing/*/route.ts`:
  - `create-setup-intent` - Creates SetupIntent for Payment Element
  - `create-subscription` - Creates subscription with plan + add-ons
  - `switch-plan` - Switches between plans
  - `manage-addons` - Manages add-ons
  - `info` - Fetches billing information
  - `update-payment-method` - Updates payment method
  - `cancel` - Cancels subscription
- **File**: `app/api/stripe/webhook/route.ts` - Enhanced with payment_method and invoice event handlers

### 3. Frontend Components
- **Path**: `components/billing/`
  - `PaymentElementForm.tsx` - Stripe Payment Element wrapper
  - `PlanSelector.tsx` - Plan selection UI
  - `AddonSelector.tsx` - Add-on selection UI
  - `SubscriptionSummary.tsx` - Price summary component
- **Hook**: `lib/hooks/useBilling.ts` - Client-side billing hook

### 4. Pages
- **File**: `app/(dashboard)/checkout/page.tsx` - NEW checkout page with 3-step flow
- **File**: `app/(dashboard)/billing/page.tsx` - Billing management page
- **File**: `app/upgrade/page.tsx` - EXISTING upgrade page (uses old Stripe Checkout)

## Your Tasks

### Phase 1: Code Review & Integration Check

1. **Verify Environment Variables**
   - Check if `.env` has all required Stripe variables
   - Ensure `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is set correctly
   - Verify plan and add-on price IDs exist in `.env`
   - Compare against `.env.example` to ensure nothing is missing

2. **Check Package Dependencies**
   - Verify `@stripe/stripe-js` and `@stripe/react-stripe-js` are installed
   - If missing, install them: `npm install @stripe/stripe-js @stripe/react-stripe-js`
   - Check `package.json` for any Stripe-related version conflicts

3. **Review Import Paths**
   - Ensure all imports in billing components use correct paths
   - Check for any missing imports (lucide-react icons, ui components, etc.)
   - Verify `@/` alias works correctly across all files

4. **Type Safety Check**
   - Run `npx tsc --noEmit` to check for TypeScript errors
   - Fix any type errors in billing-related files
   - Ensure `types/next-auth.d.ts` is properly extended

5. **Session Integration**
   - Verify `lib/auth.ts` populates new fields in session callback
   - Check that `subscription_add_ons` and `stripe_payment_method_id` are included
   - Test that session data is available on client-side pages

### Phase 2: Component Integration

1. **Checkout Page Flow**
   - Review `app/(dashboard)/checkout/page.tsx`
   - Test 3-step flow: Plan Selection → Payment → Success
   - Verify URL parameter support (e.g., `/checkout?plan=pro`)
   - Ensure redirect to billing page if user already has subscription
   - Check that success state redirects to dashboard after 3 seconds

2. **Billing Page Flow**
   - Review `app/(dashboard)/billing/page.tsx`
   - Verify it shows current subscription status correctly
   - Test plan switching functionality
   - Test add-on management
   - Test payment method update flow
   - Test subscription cancellation

3. **Payment Element Integration**
   - Verify `PaymentElementForm.tsx` correctly uses Stripe hooks
   - Check that SetupIntent client_secret is passed correctly
   - Ensure payment success callback triggers subscription creation
   - Test error handling in payment form

4. **UI Component Integration**
   - Check `PlanSelector` displays plans correctly
   - Verify `AddonSelector` shows/hides based on available add-ons
   - Test `SubscriptionSummary` calculates totals correctly
   - Ensure all components use consistent styling with existing UI

### Phase 3: API Route Testing

1. **Test Each API Route Independently**
   - `/api/billing/create-setup-intent` - Returns client_secret
   - `/api/billing/create-subscription` - Creates subscription successfully
   - `/api/billing/info` - Returns correct billing information
   - `/api/billing/switch-plan` - Switches plan correctly
   - `/api/billing/manage-addons` - Updates add-ons correctly
   - `/api/billing/update-payment-method` - Updates payment method
   - `/api/billing/cancel` - Cancels subscription

2. **Test Error Handling**
   - Test each route with missing authentication
   - Test with invalid plan/add-on IDs
   - Test with missing required parameters
   - Verify error messages are user-friendly

3. **Webhook Testing**
   - Use Stripe CLI to test webhooks locally: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
   - Trigger test events: `stripe trigger payment_intent.succeeded`
   - Verify webhook handler processes events correctly
   - Check that database updates occur after webhook events

### Phase 4: Database Integration

1. **Verify Prisma Schema**
   - Run `npx prisma generate` to regenerate Prisma client
   - Check that new fields are available in Prisma types
   - Test database queries with new fields

2. **Test Database Updates**
   - Create test subscription and verify database record
   - Update subscription and verify changes persist
   - Cancel subscription and verify status update
   - Check that `subscription_add_ons` JSON field stores data correctly

### Phase 5: Navigation & User Flow

1. **Update Navigation Links**
   - Add link to `/checkout` in main navigation (if needed)
   - Add link to `/billing` in main navigation
   - Ensure proper redirects based on subscription status
   - Check that authenticated users can access billing pages

2. **Test Complete User Journeys**

   **Journey 1: New User Subscribing**
   - User visits `/checkout` → Selects plan → Enters payment → Success → Dashboard

   **Journey 2: Existing Subscriber Upgrading**
   - User visits `/billing` → Switches to higher plan → Confirms → Updated

   **Journey 3: Managing Add-ons**
   - User visits `/billing` → Selects/deselects add-ons → Saves → Updated

   **Journey 4: Canceling Subscription**
   - User visits `/billing` → Cancels → Confirms → Scheduled for cancellation

3. **Edge Cases to Test**
   - User with expired trial
   - User with past_due subscription
   - User trying to checkout with existing subscription (should redirect)
   - User trying to switch to same plan (should show message)

### Phase 6: Security & Performance

1. **Security Checks**
   - Verify all API routes require authentication
   - Check that Stripe webhooks verify signatures
   - Ensure sensitive data (payment methods) never exposed to client
   - Verify rate limiting is applied to billing routes (if implemented)

2. **Performance Optimization**
   - Check for unnecessary re-renders in billing components
   - Verify API routes use database indexes efficiently
   - Ensure webhook processing is fast (< 5 seconds)
   - Check for any N+1 query problems

3. **Error Logging**
   - Verify errors are logged with `logError()` from `lib/error-logger.ts`
   - Check audit logs are created for billing events
   - Ensure event emission works for subscription changes

### Phase 7: Deprecate Old Code

1. **Review Existing Upgrade Page**
   - File: `app/upgrade/page.tsx`
   - This uses old Stripe Checkout (redirects away from site)
   - Decision needed: Keep both or replace with new checkout?
   - If keeping both, ensure links point to correct page

2. **Update Existing Components**
   - Check `components/subscription/SubscribeButton.tsx` (if exists)
   - Update to use new checkout page instead of old Stripe Checkout
   - Search codebase for any links to `/api/stripe/create-checkout-session`
   - Replace with links to new `/checkout` page

### Phase 8: Documentation & Final Checks

1. **Create User-Facing Documentation**
   - Document how to navigate to checkout
   - Document how to manage subscription in billing page
   - Add FAQ section for common billing questions

2. **Create Developer Documentation**
   - Document environment variables needed
   - Document how to test billing locally
   - Document webhook setup instructions
   - Document how to add new plans/add-ons

3. **Final Testing Checklist**
   - [ ] All TypeScript errors resolved
   - [ ] All API routes return correct status codes
   - [ ] Webhooks process events correctly
   - [ ] Database updates persist correctly
   - [ ] Payment Element loads without errors
   - [ ] Checkout flow completes successfully
   - [ ] Billing page shows correct subscription status
   - [ ] Plan switching works correctly
   - [ ] Add-on management works correctly
   - [ ] Subscription cancellation works correctly
   - [ ] Navigation links are correct
   - [ ] Error messages are user-friendly
   - [ ] Loading states are implemented
   - [ ] Success messages are shown
   - [ ] Audit logs are created
   - [ ] Event emission works

## Specific Issues to Look For

1. **Common Import Issues**
   - Missing `"use client"` directives in client components
   - Incorrect import paths for billing utilities
   - Missing Stripe package imports

2. **Environment Variable Issues**
   - `NEXT_PUBLIC_*` variables not available on client
   - Missing price IDs causing validation errors
   - Webhook secret not configured

3. **Type Issues**
   - Session type not including new fields
   - Prisma types not regenerated after schema change
   - Missing type definitions for Stripe objects

4. **Runtime Issues**
   - Payment Element not loading (check browser console)
   - API routes returning 500 errors (check server logs)
   - Webhook signature verification failing

## Expected Output from Cursor Agent

Please provide:

1. **Summary Report**
   - List of files reviewed
   - Issues found and fixed
   - Tests performed and results
   - Any remaining concerns or recommendations

2. **Integration Checklist**
   - Mark each task above as ✅ Complete or ❌ Needs Work
   - For any ❌ items, explain what's needed

3. **Code Changes**
   - List of files modified
   - Brief explanation of each change
   - Any new files created

4. **Testing Results**
   - Screenshot or description of successful checkout flow
   - Confirmation that webhooks are processing
   - Confirmation that database is updating correctly

5. **Next Steps for Developer**
   - List of environment variables to add
   - Stripe configuration steps (if any)
   - Any manual testing needed

## Additional Context

- **Domain**: mysynth.app
- **Framework**: Next.js 14+ with App Router
- **Database**: Neon (PostgreSQL) via Prisma
- **Auth**: NextAuth.js with Google OAuth
- **Payment**: Stripe with Payment Element (not Checkout)
- **Styling**: Tailwind CSS with custom dark theme

## Important Notes

- Do NOT modify the core billing logic in `lib/billing.ts` unless there's a clear bug
- Do NOT change the Prisma schema without explicit permission
- Do NOT expose any Stripe secret keys on the client side
- Do NOT skip webhook signature verification
- Do NOT remove existing audit logging or event emission

## Success Criteria

The billing system is considered fully integrated when:
1. A user can complete checkout flow without errors
2. Subscription is created in both Stripe and database
3. Webhooks process events and update database
4. User can manage subscription from billing page
5. All TypeScript errors are resolved
6. All tests in checklist pass

---

**Start by running these commands to check the current state:**
```bash
npm install @stripe/stripe-js @stripe/react-stripe-js
npx prisma generate
npx tsc --noEmit
npm run build
```

Then proceed with the review phases above. Good luck! 🚀

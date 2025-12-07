# Google OAuth Login - Complete Backend Implementation

This document describes the complete backend implementation for Google OAuth login in Synth.

## Overview

Synth uses **NextAuth.js v5** with **Google OAuth** as the primary authentication method. Users can sign in with their Google accounts to access the platform.

## Components

### 1. Authentication Configuration (`lib/auth.ts`)

- **Provider**: Google OAuth via NextAuth
- **Adapter**: PrismaAdapter (automatically creates User, Account, Session records)
- **Session Strategy**: Database (sessions stored in PostgreSQL)

**Key Features:**
- Environment variable validation on startup
- Google OAuth provider configuration
- User profile data enhancement
- Automatic Stripe customer creation
- 3-day trial setup for new users

### 2. User Setup Utilities (`lib/auth-user-setup.ts`)

Handles post-login user initialization:

- **`setupUserAfterLogin()`**: Stores Google profile data (google_id, avatar_url, email_verified, provider), sets up 3-day trial for new users, updates last_login_at
- **`ensureStripeCustomer()`**: Creates Stripe customer if one doesn't exist
- **`isNewUser()`**: Detects if user is new (created recently or has no trial/subscription)

### 3. Authentication Flow

1. **User clicks "Sign in with Google"**
   - Redirects to Google OAuth consent screen
   - User grants permissions

2. **Google redirects back to `/api/auth/callback/google`**
   - NextAuth handles the callback
   - PrismaAdapter creates User and Account records if new user

3. **SignIn Callback**
   - Always allows sign-in
   - Returns `true` to proceed

4. **Session Callback** (runs after user creation)
   - Populates session with user data
   - **Asynchronously runs user setup:**
     - Fetches Google account info from Account table
     - Stores Google profile data (google_id, avatar_url, email_verified)
     - Sets up 3-day trial for new users
     - Creates Stripe customer if missing
   - Updates `last_login_at` timestamp
   - Logs audit event

5. **User is redirected to dashboard**

## User Profile Data Stored

When a user logs in with Google, the following data is stored:

- **google_id**: Google account ID (from providerAccountId)
- **avatar_url**: Profile picture URL from Google
- **email_verified**: Automatically set to `true` (Google emails are verified)
- **provider**: Set to `"google"`
- **last_login_at**: Updated on every login

## 3-Day Trial Setup

New users automatically receive a 3-day free trial:

- Trial is set up on first login
- `trialEndsAt` is set to 3 days from login date
- Users get full access during trial period
- Access is controlled via `lib/access-control.ts`

## Stripe Integration

- Stripe customer is automatically created on first login
- Customer ID is stored in `stripeCustomerId` field
- Customer metadata includes `userId` for cross-referencing

## Error Handling

All user setup operations are non-blocking:
- Errors are logged but don't prevent login
- User can still sign in even if setup fails
- Setup can retry on next login if it failed previously

## Environment Variables Required

```env
# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# NextAuth
AUTH_SECRET=your-auth-secret (generate with: openssl rand -base64 32)
AUTH_URL=https://yourdomain.com (or http://localhost:3000 for dev)

# Database (for PrismaAdapter)
DATABASE_URL=postgresql://...
```

## Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth client ID"
5. Configure:
   - Application type: Web application
   - Authorized redirect URIs: `https://yourdomain.com/api/auth/callback/google`
   - For local dev: `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Client Secret to `.env`

## Database Schema

The Prisma schema includes all necessary fields:

```prisma
model User {
  id                  String   @id @default(uuid())
  email               String   @unique
  name                String
  
  // Google OAuth fields
  google_id           String?  @unique
  avatar_url          String?
  email_verified      Boolean? @default(false)
  provider            String?  @default("google")
  last_login_at       DateTime? @default(now())
  
  // Trial and subscription
  trialEndsAt         DateTime?
  subscriptionStatus  String?  @default("inactive")
  // ... other fields
}
```

## Testing

To test Google OAuth login:

1. Ensure all environment variables are set
2. Start the development server: `npm run dev`
3. Navigate to the app (should redirect to sign-in if not authenticated)
4. Click "Sign in with Google"
5. Complete Google OAuth flow
6. Verify:
   - User is created in database
   - Google profile data is stored
   - 3-day trial is set up
   - Stripe customer is created
   - User can access dashboard

## Next Steps

- [ ] Add account linking (allow users to link multiple providers)
- [ ] Add email verification flow for non-OAuth users
- [ ] Add password reset flow
- [ ] Add account deletion with data cleanup
- [ ] Add session management UI


# OAuth vs API

## Connection Types

Apps connect to Synth using different authentication methods. This document explains the differences and when each is used.

## OAuth Connections

### What is OAuth?

OAuth is a standard authentication protocol that allows users to grant Synth access to their app account without sharing passwords.

### How OAuth Works

1. User clicks "Connect [App]"
2. User is redirected to the app's authorization page
3. User logs in to the app (if not already logged in)
4. User approves access for Synth
5. App redirects back to Synth with an authorization code
6. Synth exchanges code for access token
7. Access token is stored securely
8. Synth uses token to make API calls on user's behalf

### Benefits of OAuth

**Security:**
- User never shares password with Synth
- Tokens can be revoked without changing password
- Limited scope of access

**User Experience:**
- Familiar authentication flow
- Easy to set up
- Clear permission grants

### Common OAuth Apps

Examples of apps that typically use OAuth:
- Gmail (Google OAuth)
- Slack
- Salesforce
- Microsoft 365
- Twitter

## API Key Connections

### What is an API Key?

An API key is a secret token that users generate in the app's settings and provide to Synth for authentication.

### How API Key Works

1. User goes to the app's settings
2. User generates an API key
3. User copies the API key
4. User pastes the API key into Synth
5. Synth stores the API key securely
6. Synth includes the API key in API requests

### Benefits of API Keys

**Simple:**
- Straightforward setup
- No redirect flow
- Direct authentication

**Control:**
- User can regenerate keys
- User can revoke access by deleting key
- Some apps allow multiple keys for different uses

### Common API Key Apps

Examples of apps that typically use API keys:
- Airtable
- SendGrid
- Stripe
- OpenAI
- Many developer-focused APIs

## How Synth Handles Both

### In Connections Table

The `connection_type` field indicates which method is used:
- `OAuth` for OAuth connections
- `APIKey` for API key connections

### Security

Both connection types:
- Store secrets securely (NOT in connections table)
- Use encrypted storage
- Transmit securely to Pipedream
- Never expose secrets to users

### User Experience

**For OAuth:**
- Synth provides "Connect with [App]" button
- Opens authorization flow
- Handles redirect back
- Confirms successful connection

**For API Key:**
- Synth provides input field for API key
- User pastes their key
- Synth validates the key
- Confirms successful connection

## Connection Type Stored

The connections table includes a `connection_type` field:

**Stored Value:** `OAuth` or `APIKey`

**Purpose:** Indicates how the connection was authenticated

**Usage:** Helps system know how to handle token refresh and re-authentication

## Key Principles

**Secure:** Both methods store secrets securely

**User-Friendly:** Each method optimized for its use case

**Flexible:** Support both OAuth and API key apps

**Consistent:** Same workflow validation regardless of connection type

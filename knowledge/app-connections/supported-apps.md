# Supported Apps

## Purpose of This Document

This document maintains the list of apps that Synth can integrate with for workflow automation.

## Critical Rule

**Synth must ONLY mention apps that are actually in this supported apps list.**

Do not suggest, recommend, or promise integration with apps not listed here.

## How to Use This List

### For Workflow Planning
- Check this list before suggesting apps to users
- Only create workflows using apps from this list
- If user requests unsupported app, explain it's not currently available

### For Validation
- Before creating a workflow, verify ALL apps are on this list
- Reject workflow requests that require unsupported apps
- Provide alternative supported apps when possible

## Supported Apps List

**Note:** The provided architecture information does not specify which apps are currently supported. This list should be populated based on which apps are integrated with Pipedream for the MVP.

### General Structure for Each App

When adding apps to this list, include:

**App Name**
- Category (e.g., Email, Messaging, CRM, etc.)
- Available Triggers (if any)
- Available Actions
- Connection Type (OAuth, API Key, etc.)
- Notes or limitations

## Example Structure

**Gmail**
- Category: Email
- Available Triggers: New email received
- Available Actions: Send email, create draft
- Connection Type: OAuth
- Notes: Requires Google account

**Slack**
- Category: Messaging
- Available Triggers: New message in channel
- Available Actions: Post message, create channel
- Connection Type: OAuth
- Notes: Requires workspace admin for certain actions

## Adding New Apps

When adding support for a new app:

1. Test integration with Pipedream
2. Document available triggers and actions
3. Add app to this list
4. Update connection type requirements
5. Note any special considerations

## App Not on List?

If a user requests an app not on this list:

**Response:**
- Acknowledge the request
- Explain the app is not currently supported
- Suggest alternative supported apps if applicable
- Do NOT promise future support without confirmation
- Do NOT create workflows using unsupported apps

## Key Principles

**Honest:** Only offer what's actually supported

**Current:** Keep this list up to date as apps are added

**Validated:** Always check this list before workflow creation

**Clear:** Document capabilities and limitations for each app

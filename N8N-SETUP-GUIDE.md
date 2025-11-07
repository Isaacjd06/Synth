# n8n No-Auth Setup Guide for Synth Development

## Problem Summary

When running n8n locally with `npx n8n start`, you see a login screen even after setting:
- `N8N_USER_MANAGEMENT_DISABLED=true`
- `N8N_BASIC_AUTH_ACTIVE=false`

This happens because:
1. **n8n doesn't auto-load `.env` files** from your project directory
2. **Existing owner users in the database** override the disable flag
3. **PowerShell environment variables** are session-scoped by default

---

## Quick Fix (Get Running Now)

### Step 1: Stop n8n
Press `Ctrl+C` in the terminal where n8n is running.

### Step 2: Check for Existing Users
```powershell
.\check-n8n-db.ps1
```

If users are found, back up and reset the database:

```powershell
# Backup the entire n8n directory
cd $env:USERPROFILE
Rename-Item .n8n .n8n.backup

# Or just delete users from the database:
sqlite3 "$env:USERPROFILE\.n8n\database.sqlite" "DELETE FROM user;"
```

### Step 3: Start n8n with Proper Environment
```powershell
cd C:\synth
.\start-n8n.ps1
```

### Step 4: Verify
- Open http://localhost:5678
- You should see the **workflow editor directly** (no login screen)
- Terminal should show: `User management is disabled!` or similar

---

## Diagnostic Scripts

We've created three helper scripts in `C:\synth\`:

### 1. `start-n8n.ps1` - Start n8n with correct config
```powershell
.\start-n8n.ps1
```
Sets all required environment variables and starts n8n in no-auth mode.

### 2. `check-n8n-env.ps1` - Verify environment variables
```powershell
.\check-n8n-env.ps1
```
Checks if N8N_* variables are properly set in your current session.

### 3. `check-n8n-db.ps1` - Inspect database for users
```powershell
.\check-n8n-db.ps1
```
Checks the SQLite database for existing users that would force login.

---

## Root Cause Explanation

### Why Environment Variables Don't Work

**The Problem:**
```powershell
# This ONLY affects the current PowerShell session
$env:N8N_USER_MANAGEMENT_DISABLED="true"
npx n8n start
```

**Why:**
- `$env:VAR="value"` sets a **session-only** variable
- If you close PowerShell, the variable is gone
- Opening a new terminal won't have it

**The Solution:**
Our `start-n8n.ps1` script sets variables **in the same session** before starting n8n.

### Why .env Files Are Ignored

**The Problem:**
You created a `.env` file in `C:\synth\` with:
```
N8N_USER_MANAGEMENT_DISABLED=true
N8N_BASIC_AUTH_ACTIVE=false
```

But n8n doesn't see it.

**Why:**
- n8n does NOT automatically load `.env` from your project directory
- n8n only reads `.env` from `C:\Users\isaac\.n8n\.env` (not project dir)
- Most Node.js projects use `dotenv` package, but n8n's behavior is different

**The Solution:**
Use explicit environment variables via PowerShell script (our approach) or move `.env` to `$env:USERPROFILE\.n8n\.env`.

### Why Login Screen Persists

**The Problem:**
Even with `N8N_USER_MANAGEMENT_DISABLED=true`, you still see login.

**Why:**
1. **First run** without the flag:
   - n8n creates `C:\Users\isaac\.n8n\database.sqlite`
   - Shows setup wizard to create an "owner" user
   - User is permanently stored in database

2. **Subsequent runs** with the flag:
   - n8n checks database first
   - Finds owner user → forces login
   - `N8N_USER_MANAGEMENT_DISABLED` is **ignored** if owner exists

**The Solution:**
Delete the user records from the database (or reset n8n data entirely).

---

## Permanent Setup Options

Choose one based on your preference:

### Option A: Use Startup Script (Recommended)
**Best for:** Project-specific settings that you want explicit control over.

```powershell
cd C:\synth
.\start-n8n.ps1
```

**Pros:**
- Clear and visible what settings are being used
- Easy to modify and version control
- No system-wide changes

**Cons:**
- Must use the script every time

---

### Option B: System-Level Environment Variables
**Best for:** If you want `npx n8n start` to work from anywhere without scripts.

Set permanent user-level variables:

```powershell
# Set variables (run once)
[System.Environment]::SetEnvironmentVariable('N8N_USER_MANAGEMENT_DISABLED', 'true', 'User')
[System.Environment]::SetEnvironmentVariable('N8N_BASIC_AUTH_ACTIVE', 'false', 'User')
[System.Environment]::SetEnvironmentVariable('N8N_ENCRYPTION_KEY', 'synth-dev-key-32-chars-minimum', 'User')

# Restart PowerShell, then verify:
[System.Environment]::GetEnvironmentVariable('N8N_USER_MANAGEMENT_DISABLED', 'User')

# Now you can just run:
npx n8n start
```

**Pros:**
- Works from any terminal
- No need for startup script

**Cons:**
- Affects all n8n instances on your system
- Less visible what settings are active
- Harder to change

---

### Option C: n8n Data Directory .env
**Best for:** If you prefer a config file over scripts/env vars.

Create/edit `C:\Users\isaac\.n8n\.env`:

```
N8N_USER_MANAGEMENT_DISABLED=true
N8N_BASIC_AUTH_ACTIVE=false
N8N_ENCRYPTION_KEY=synth-dev-key-32-chars-minimum
```

**Note:** This is `$env:USERPROFILE\.n8n\.env`, NOT your project directory!

**Pros:**
- Config file approach
- Persists across sessions

**Cons:**
- Not in project directory (less obvious)
- Must remember the location

---

## Database Management

### Backup Database
```powershell
# Full backup
cd $env:USERPROFILE
Copy-Item .n8n .n8n.backup -Recurse

# Database only
Copy-Item .n8n\database.sqlite .n8n\database.sqlite.backup
```

### Inspect Database
```powershell
# Install sqlite3 first (if needed)
choco install sqlite
# Or download from: https://www.sqlite.org/download.html

# Check for users
sqlite3 "$env:USERPROFILE\.n8n\database.sqlite" "SELECT * FROM user;"
```

### Remove Users (Keep Workflows)
```powershell
# Backup first!
Copy-Item "$env:USERPROFILE\.n8n\database.sqlite" "$env:USERPROFILE\.n8n\database.sqlite.backup"

# Delete users
sqlite3 "$env:USERPROFILE\.n8n\database.sqlite" "DELETE FROM user;"

# Verify
sqlite3 "$env:USERPROFILE\.n8n\database.sqlite" "SELECT COUNT(*) FROM user;"
# Should return: 0
```

### Complete Reset (Delete Everything)
```powershell
# Backup first
cd $env:USERPROFILE
Rename-Item .n8n .n8n.backup

# Start fresh
cd C:\synth
.\start-n8n.ps1
```

### Restore from Backup
```powershell
cd $env:USERPROFILE
Remove-Item .n8n -Recurse -Force
Rename-Item .n8n.backup .n8n
```

---

## Troubleshooting Checklist

### Issue: Still seeing login screen

**Check 1: Environment Variables**
```powershell
.\check-n8n-env.ps1
```
Expected: All required variables show `[OK]`

**Check 2: Database Users**
```powershell
.\check-n8n-db.ps1
```
Expected: "No users found in database"

**Check 3: n8n Logs**
Look for these lines when starting n8n:
- ✅ `User management is disabled!`
- ✅ `n8n ready on http://localhost:5678`
- ❌ `Owner account found, user management active`

**Fix:**
```powershell
# Stop n8n (Ctrl+C)

# Reset database
sqlite3 "$env:USERPROFILE\.n8n\database.sqlite" "DELETE FROM user;"

# Start with script
.\start-n8n.ps1
```

---

### Issue: Environment variables not set

**Check:**
```powershell
Get-ChildItem Env: | Where-Object { $_.Name -like 'N8N*' }
```

**If empty:**
```powershell
# Option 1: Use the startup script
.\start-n8n.ps1

# Option 2: Set manually in current session
$env:N8N_USER_MANAGEMENT_DISABLED="true"
$env:N8N_BASIC_AUTH_ACTIVE="false"
$env:N8N_ENCRYPTION_KEY="your-key-here"
npx n8n start
```

---

### Issue: n8n starts but REST API requires auth

**Check:**
```powershell
# Test REST API
curl http://localhost:5678/rest/workflows
```

**If you get 401 Unauthorized:**
1. User management isn't fully disabled
2. Check database for users
3. Verify `N8N_USER_MANAGEMENT_DISABLED=true` is set

**Fix:**
```powershell
# Verify env vars are actually set when n8n starts
.\start-n8n.ps1

# Check the terminal output for confirmation
```

---

## Verification Commands

After setup, verify everything works:

```powershell
# 1. Check environment
.\check-n8n-env.ps1
# Should show all required vars as [OK]

# 2. Check database
.\check-n8n-db.ps1
# Should show "No users found"

# 3. Start n8n
.\start-n8n.ps1
# Should show "User management is disabled!"

# 4. Test browser (in another terminal)
Start-Process http://localhost:5678
# Should open editor directly (no login)

# 5. Test REST API
curl http://localhost:5678/rest/workflows
# Should return workflow list (or empty array), not 401
```

---

## Common Mistakes to Avoid

### ❌ DON'T: Set env vars in different terminal
```powershell
# Terminal 1
$env:N8N_USER_MANAGEMENT_DISABLED="true"

# Terminal 2
npx n8n start  # ❌ Won't have the variable!
```

### ✅ DO: Set and run in same session
```powershell
# Same terminal
$env:N8N_USER_MANAGEMENT_DISABLED="true"
npx n8n start  # ✅ Has the variable
```

### ❌ DON'T: Expect project .env to work
```powershell
# C:\synth\.env
N8N_USER_MANAGEMENT_DISABLED=true  # ❌ n8n won't read this
```

### ✅ DO: Use explicit env vars or n8n data dir .env
```powershell
# C:\Users\isaac\.n8n\.env
N8N_USER_MANAGEMENT_DISABLED=true  # ✅ n8n reads this
```

### ❌ DON'T: Ignore existing database users
```powershell
# User exists in DB, but you only set env var
$env:N8N_USER_MANAGEMENT_DISABLED="true"
npx n8n start  # ❌ Still shows login
```

### ✅ DO: Remove users first
```powershell
sqlite3 "$env:USERPROFILE\.n8n\database.sqlite" "DELETE FROM user;"
$env:N8N_USER_MANAGEMENT_DISABLED="true"
npx n8n start  # ✅ No login
```

---

## n8n Version Notes

### n8n 1.x (Current)
- User management is default
- Requires `N8N_USER_MANAGEMENT_DISABLED=true` to disable
- Database user overrides env var

### n8n 0.x (Legacy)
- `N8N_BASIC_AUTH_ACTIVE=false` was primary control
- User management didn't exist
- Simpler auth model

**If you're using an older version:**
- Check with `npx n8n --version`
- Update to latest: `npm install -g n8n@latest`

---

## Integration with Synth

### REST API Access

Once n8n is running without auth:

```typescript
// Synth → n8n API calls (Next.js)
const N8N_BASE_URL = 'http://localhost:5678';

async function createN8nWorkflow(workflowData: any) {
  const response = await fetch(`${N8N_BASE_URL}/rest/workflows`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(workflowData)
  });
  return response.json();
}

async function executeWorkflow(workflowId: string) {
  const response = await fetch(
    `${N8N_BASE_URL}/rest/workflows/${workflowId}/execute`,
    { method: 'POST' }
  );
  return response.json();
}
```

No authentication headers needed! 🎉

### Production Note

**WARNING:** This no-auth setup is **FOR LOCAL DEVELOPMENT ONLY**.

In production:
- Enable user management
- Use proper authentication
- Restrict network access
- Consider n8n Cloud or properly secured self-hosted setup

---

## Quick Reference

### Daily Workflow
```powershell
# Every time you start working:
cd C:\synth
.\start-n8n.ps1

# That's it! n8n is now running at http://localhost:5678
```

### Diagnostic Flow
```powershell
# If something's wrong:
.\check-n8n-env.ps1    # Check env vars
.\check-n8n-db.ps1     # Check database
.\start-n8n.ps1        # Start with proper config
```

### Reset Flow
```powershell
# Nuclear option - start completely fresh:
cd $env:USERPROFILE
Rename-Item .n8n .n8n.backup
cd C:\synth
.\start-n8n.ps1
```

---

## Additional Resources

- [n8n Documentation](https://docs.n8n.io/)
- [n8n Environment Variables](https://docs.n8n.io/hosting/environment-variables/)
- [n8n API Documentation](https://docs.n8n.io/api/)
- [SQLite Documentation](https://www.sqlite.org/docs.html)

---

## Summary

**Root Causes:**
1. n8n doesn't auto-load project `.env` files
2. Existing database users override disable flags
3. PowerShell env vars are session-scoped

**Solution:**
1. Use `start-n8n.ps1` to set env vars and start n8n
2. Remove existing users from database
3. Verify with diagnostic scripts

**Daily Usage:**
```powershell
cd C:\synth
.\start-n8n.ps1
```

**Verification Success:**
- ✅ No login screen at http://localhost:5678
- ✅ REST API works without auth
- ✅ Terminal shows "User management is disabled!"

---

*Last updated: 2025*

# Execution Sync System - Setup & Testing Guide

This guide walks you through setting up and testing the execution synchronization system between n8n and Supabase.

---

## 📋 Overview

The execution sync system automatically fetches workflow execution history from n8n and stores it in your Supabase database. This allows Synth to:
- Track all workflow runs (past and present)
- Display execution history in the UI
- Analyze workflow performance
- Recall past execution results

---

## 🛠️ Setup Steps

### Step 1: Run the Database Migration

The `executions` table needs additional columns to store n8n execution data.

**Option A: Using Supabase Dashboard (Recommended)**

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the file: `C:\synth\scripts\add-execution-columns.sql`
4. Copy and paste the SQL into the editor
5. Click **Run** to execute the migration

**Option B: Using Supabase CLI**

```bash
# If you have Supabase CLI installed
supabase db push
```

**What this migration does:**
- Adds `n8n_execution_id` (INTEGER, UNIQUE) - Maps to n8n's execution ID
- Adds `started_at` (TIMESTAMPTZ) - When the execution started
- Adds `finished_at` (TIMESTAMPTZ) - When the execution completed
- Creates indexes for faster lookups

---

### Step 2: Verify Database Schema

After running the migration, verify your `executions` table has these columns:

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Synth execution ID |
| `workflow_id` | UUID | References `workflows.id` |
| `status` | TEXT | Execution status ("success", "error", "running") |
| `input` | JSONB | Input data sent to workflow |
| `output` | JSONB | Output data from workflow |
| `n8n_execution_id` | INTEGER (UNIQUE) | n8n's execution ID |
| `started_at` | TIMESTAMPTZ | When execution started |
| `finished_at` | TIMESTAMPTZ | When execution completed |
| `created_at` | TIMESTAMPTZ | Record creation time |

---

### Step 3: Start n8n

Use the provided PowerShell script to start n8n with the correct configuration:

```powershell
.\start-n8n.ps1
```

**Verify n8n is running:**
- n8n should be accessible at: http://localhost:5678
- The script will verify API connection and show workflow count
- You should see: `✅ Public API connection verified`

---

### Step 4: Start Next.js Dev Server

In a **separate terminal**, start the Next.js development server:

```bash
npm run dev
```

**Verify Next.js is running:**
- The app should be accessible at: http://localhost:3000
- You should see: `✓ Ready in X ms`

---

## 🧪 Testing the Sync Endpoint

### Quick Test (Automated)

Run the provided test script:

```bash
node scripts/test-sync-executions.js
```

This script will:
1. ✅ Check if n8n is running
2. ✅ Check if Next.js is running
3. ✅ Fetch executions from n8n
4. ✅ Call the sync endpoint
5. ✅ Display sync results

---

### Manual Test (Using curl)

**Test the sync endpoint:**

```bash
curl http://localhost:3000/api/workflows/sync-executions
```

**Expected Response (Success):**

```json
{
  "success": true,
  "message": "Execution synchronization completed successfully",
  "summary": {
    "total_fetched": 5,
    "new_inserted": 3,
    "already_synced": 2,
    "failed": 0
  }
}
```

**Expected Response (No Executions):**

```json
{
  "success": true,
  "message": "No executions found in n8n",
  "summary": {
    "total_fetched": 0,
    "new_inserted": 0,
    "already_synced": 0,
    "failed": 0
  }
}
```

---

### Manual Test (Using Postman or Browser)

1. Open your browser or Postman
2. Navigate to: `http://localhost:3000/api/workflows/sync-executions`
3. Make a **GET** request
4. Verify the JSON response

---

## 📊 Understanding the Response

### Summary Fields

| Field | Description |
|-------|-------------|
| `total_fetched` | Total executions fetched from n8n |
| `new_inserted` | New executions inserted into Supabase |
| `already_synced` | Executions that were already in Supabase (skipped) |
| `failed` | Executions that failed to sync (e.g., workflow not found) |

### Example Scenarios

**Scenario 1: First Sync**
```json
{
  "total_fetched": 10,
  "new_inserted": 10,
  "already_synced": 0,
  "failed": 0
}
```
*All 10 executions are new and were successfully synced.*

**Scenario 2: Incremental Sync**
```json
{
  "total_fetched": 15,
  "new_inserted": 5,
  "already_synced": 10,
  "failed": 0
}
```
*Out of 15 executions, 10 were already synced, and 5 new ones were added.*

**Scenario 3: Partial Failure**
```json
{
  "total_fetched": 8,
  "new_inserted": 6,
  "already_synced": 0,
  "failed": 2,
  "failed_executions": [
    {
      "n8n_execution_id": "123",
      "reason": "Workflow not found in Synth"
    },
    {
      "n8n_execution_id": "456",
      "reason": "Workflow not found in Synth"
    }
  ]
}
```
*2 executions failed because their workflows haven't been synced to Synth yet.*

---

## 🔍 Verifying the Sync

### Check Supabase Database

After running the sync, verify the data was inserted:

**Using Supabase Dashboard:**
1. Go to **Table Editor**
2. Select the `executions` table
3. Look for rows with `n8n_execution_id` populated

**Using SQL:**

```sql
-- Count total synced executions
SELECT COUNT(*)
FROM executions
WHERE n8n_execution_id IS NOT NULL;

-- View recent synced executions
SELECT
  id,
  workflow_id,
  n8n_execution_id,
  status,
  started_at,
  finished_at
FROM executions
WHERE n8n_execution_id IS NOT NULL
ORDER BY started_at DESC
LIMIT 10;
```

---

## 🐛 Troubleshooting

### Error: "Failed to fetch executions from n8n"

**Cause:** n8n is not running or API key is incorrect

**Solution:**
1. Make sure n8n is running: `.\start-n8n.ps1`
2. Verify the API key in `.env.local` matches the one in `start-n8n.ps1`

---

### Error: "Failed to fetch workflows from Supabase"

**Cause:** Supabase connection issue or missing `workflows` table

**Solution:**
1. Check `.env.local` has correct Supabase credentials
2. Verify `workflows` table exists in Supabase
3. Ensure `n8n_workflow_id` column exists in `workflows` table

---

### Error: "column 'n8n_execution_id' does not exist"

**Cause:** Migration not run yet

**Solution:**
1. Run the SQL migration in `scripts/add-execution-columns.sql`
2. Verify the columns exist using Supabase Table Editor

---

### Executions Syncing but `failed` Count is High

**Cause:** Workflows in n8n haven't been synced to Synth yet

**Solution:**
1. Ensure you've created workflows in Synth (not directly in n8n)
2. Or, manually create workflow records in Supabase with the correct `n8n_workflow_id`

---

## 🚀 Next Steps

Once the sync is working, you can:

1. **Set up automatic syncing** - Create a cron job or scheduled task to call the sync endpoint periodically
2. **Build UI to display executions** - Create a page in Next.js to show execution history
3. **Add filtering** - Modify the endpoint to accept query parameters (e.g., sync only specific workflows)
4. **Implement webhooks** - Set up n8n webhooks to push execution data in real-time instead of polling

---

## 📚 Related Files

- **Sync Endpoint:** `app/api/workflows/sync-executions/route.ts`
- **Database Migration:** `scripts/add-execution-columns.sql`
- **Test Script:** `scripts/test-sync-executions.js`
- **n8n Client:** `lib/n8nClient.ts`
- **Supabase Client:** `lib/supabaseServer.ts`
- **Environment Config:** `.env.local`

---

## 💡 Tips

- **Run sync after creating/running workflows** - The sync only pulls executions for workflows that exist in Synth
- **Adjust the limit** - By default, the sync fetches the 100 most recent executions. You can modify this in `route.ts:35`
- **Check logs** - Both terminal windows (n8n and Next.js) will show detailed logs with emoji indicators
- **Use unique n8n_execution_ids** - The system prevents duplicate syncs by checking `n8n_execution_id` uniqueness

---

🎉 **You're all set!** If you encounter any issues, check the troubleshooting section or review the logs in your terminals.

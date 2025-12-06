/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Test Script for Execution Sync Endpoint
 *
 * This script tests the /api/workflows/sync-executions endpoint
 *
 * Prerequisites:
 * 1. n8n must be running (port 5678)
 * 2. Next.js dev server must be running (port 3000)
 * 3. Supabase tables must be set up with the migration
 */

const N8N_URL = 'http://127.0.0.1:5678';
const NEXT_URL = 'http://localhost:3000';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiN2ZkMmU4OC1mNTMwLTQzMTktOGIwOS0wZjBjOTcyNDlkNWEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYyNDk5NjgzfQ.08pjCFPRSJt_agrd6mirT_aBeg7vkbZInQzDGDVtSpo';

async function testSyncExecutions() {
  console.log('🧪 Testing Execution Sync Endpoint\n');
  console.log('=' .repeat(60));

  // Step 1: Check if n8n is running
  console.log('\n📍 Step 1: Checking if n8n is running...');
  try {
    const n8nResponse = await fetch(`${N8N_URL}/api/v1/workflows`, {
      headers: { 'X-N8N-API-KEY': N8N_API_KEY },
    });
    if (!n8nResponse.ok) {
      throw new Error(`n8n returned status ${n8nResponse.status}`);
    }
    const n8nData = await n8nResponse.json();
    console.log(`✅ n8n is running (${n8nData.data?.length || 0} workflows found)`);
  } catch (error) {
    console.error('❌ n8n is not running or not accessible');
    console.error('   Please start n8n using: .\\start-n8n.ps1');
    process.exit(1);
  }

  // Step 2: Check if Next.js is running
  console.log('\n📍 Step 2: Checking if Next.js dev server is running...');
  try {
    const healthResponse = await fetch(`${NEXT_URL}/api/workflows`);
    console.log(`✅ Next.js is running (status: ${healthResponse.status})`);
  } catch (error) {
    console.error('❌ Next.js is not running or not accessible');
    console.error('   Please start Next.js using: npm run dev');
    process.exit(1);
  }

  // Step 3: Fetch executions from n8n directly
  console.log('\n📍 Step 3: Fetching executions from n8n directly...');
  try {
    const execResponse = await fetch(`${N8N_URL}/api/v1/executions`, {
      headers: { 'X-N8N-API-KEY': N8N_API_KEY },
    });
    const execData = await execResponse.json();
    console.log(`✅ Found ${execData.data?.length || 0} executions in n8n`);

    if (execData.data && execData.data.length > 0) {
      console.log('\n   Sample execution:');
      const sample = execData.data[0];
      console.log(`   - ID: ${sample.id}`);
      console.log(`   - Workflow ID: ${sample.workflowId}`);
      console.log(`   - Status: ${sample.finished ? 'finished' : 'running'}`);
      console.log(`   - Started: ${sample.startedAt}`);
    } else {
      console.log('   ℹ️  No executions found. Create and run a workflow in n8n first.');
    }
  } catch (error) {
    console.error('❌ Failed to fetch executions from n8n:', error.message);
  }

  // Step 4: Call sync endpoint
  console.log('\n📍 Step 4: Calling sync-executions endpoint...');
  try {
    const syncResponse = await fetch(`${NEXT_URL}/api/workflows/sync-executions`, {
      method: 'GET',
    });

    console.log(`   Response status: ${syncResponse.status}`);

    const syncData = await syncResponse.json();
    console.log('\n   Response body:');
    console.log(JSON.stringify(syncData, null, 2));

    if (syncResponse.ok) {
      console.log('\n✅ Sync completed successfully!');
      console.log('\n📊 Summary:');
      console.log(`   - Total fetched: ${syncData.summary?.total_fetched || 0}`);
      console.log(`   - New inserted: ${syncData.summary?.new_inserted || 0}`);
      console.log(`   - Already synced: ${syncData.summary?.already_synced || 0}`);
      console.log(`   - Failed: ${syncData.summary?.failed || 0}`);
    } else {
      console.error('\n❌ Sync failed with error:');
      console.error(`   ${syncData.error}`);
      if (syncData.details) {
        console.error(`   Details: ${syncData.details}`);
      }
    }
  } catch (error) {
    console.error('❌ Failed to call sync endpoint:', error.message);
    process.exit(1);
  }

  console.log('\n' + '='.repeat(60));
  console.log('🎉 Test completed!\n');
}

// Run the test
testSyncExecutions().catch((error) => {
  console.error('\n💥 Unexpected error:', error);
  process.exit(1);
});

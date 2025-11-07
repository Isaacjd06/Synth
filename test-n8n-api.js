#!/usr/bin/env node
/**
 * Synth n8n API Connection Test
 * Purpose: Verify that Synth can communicate with n8n via REST API
 *
 * Usage: node test-n8n-api.js
 */

require('dotenv').config({ path: '.env.local' });

const N8N_URL = process.env.N8N_URL || 'http://localhost:5678';
const N8N_API_KEY = process.env.N8N_API_KEY;

if (!N8N_API_KEY) {
  console.error('❌ Error: N8N_API_KEY not found in .env.local');
  process.exit(1);
}

async function testN8nConnection() {
  console.log('🔍 Testing Synth → n8n API connection...\n');
  console.log(`URL: ${N8N_URL}`);
  console.log(`API Key: ${N8N_API_KEY.substring(0, 20)}...\n`);

  const tests = [
    { name: 'Health Check', endpoint: '/healthz', useApiKey: false },
    { name: 'Workflows', endpoint: '/api/v1/workflows', useApiKey: true },
    { name: 'Executions', endpoint: '/api/v1/executions', useApiKey: true },
  ];

  let allPassed = true;

  for (const test of tests) {
    try {
      const headers = test.useApiKey ? { 'X-N8N-API-KEY': N8N_API_KEY } : {};

      const response = await fetch(`${N8N_URL}${test.endpoint}`, {
        method: 'GET',
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${test.name}: OK`);
        if (test.endpoint === '/api/v1/workflows') {
          console.log(`   Workflows count: ${data.data?.length || 0}`);
        }
      } else {
        console.log(`❌ ${test.name}: Failed (${response.status} ${response.statusText})`);
        allPassed = false;
      }
    } catch (error) {
      console.log(`❌ ${test.name}: Error - ${error.message}`);
      allPassed = false;
    }
  }

  console.log('\n' + '='.repeat(50));
  if (allPassed) {
    console.log('✅ All tests passed! Synth ↔ n8n connection is working.');
  } else {
    console.log('❌ Some tests failed. Check the output above.');
    process.exit(1);
  }
}

testN8nConnection();

#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Synth ↔ n8n Integration Test Suite
 * Tests the three main integration routes:
 * 1. POST /api/workflows/create - Create workflows
 * 2. POST /api/workflows/trigger - Trigger workflows
 * 3. GET /api/executions/sync - Sync executions
 *
 * Usage: node test-synth-n8n-integration.js
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// ANSI colors for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color, ...args) {
  console.log(color, ...args, colors.reset);
}

async function test(name, fn) {
  try {
    log(colors.cyan, `\n🧪 Testing: ${name}`);
    await fn();
    log(colors.green, `✅ PASSED: ${name}`);
    return true;
  } catch (error) {
    log(colors.red, `❌ FAILED: ${name}`);
    log(colors.red, `   Error: ${error.message}`);
    return false;
  }
}

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  log(colors.blue, `   → ${options.method || 'GET'} ${endpoint}`);

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  const contentType = response.headers.get('content-type');
  let data;

  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${JSON.stringify(data)}`);
  }

  return { status: response.status, data };
}

// Store workflow ID for later tests
let createdWorkflowId = null;
let triggeredExecutionId = null;

async function runTests() {
  log(colors.yellow, '\n' + '='.repeat(60));
  log(colors.yellow, 'Synth ↔ n8n Integration Test Suite');
  log(colors.yellow, '='.repeat(60));

  const results = [];

  // Test 1: Create a workflow
  results.push(
    await test('Create workflow with minimal data', async () => {
      const response = await request('/api/workflows/create', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Workflow ' + Date.now(),
          intent: 'Send a notification when something happens',
          description: 'This is a test workflow created by the integration test',
          trigger: {
            type: 'manual',
            config: {},
          },
          actions: [
            {
              type: 'code',
              config: {
                name: 'Log Message',
                code: 'return { message: "Hello from Synth!" };',
              },
            },
          ],
        }),
      });

      if (!response.data.success) {
        throw new Error('Expected success: true');
      }

      if (!response.data.workflow) {
        throw new Error('Expected workflow object in response');
      }

      if (!response.data.workflow.id) {
        throw new Error('Expected workflow.id in response');
      }

      createdWorkflowId = response.data.workflow.id;
      log(colors.green, `   Created workflow ID: ${createdWorkflowId}`);

      if (response.data.workflow.n8n_workflow_id) {
        log(
          colors.green,
          `   n8n workflow ID: ${response.data.workflow.n8n_workflow_id}`
        );
      } else {
        log(colors.yellow, '   ⚠️  Warning: n8n_workflow_id is null');
      }
    })
  );

  // Test 2: Create workflow without optional fields
  results.push(
    await test('Create workflow with only required fields', async () => {
      const response = await request('/api/workflows/create', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Minimal Test Workflow',
          intent: 'Test minimal workflow creation',
        }),
      });

      if (!response.data.success) {
        throw new Error('Expected success: true');
      }

      log(colors.green, `   Created workflow ID: ${response.data.workflow.id}`);
    })
  );

  // Test 3: Try to create workflow with missing required fields
  results.push(
    await test('Reject workflow creation without required fields', async () => {
      try {
        await request('/api/workflows/create', {
          method: 'POST',
          body: JSON.stringify({
            description: 'Missing name and intent',
          }),
        });
        throw new Error('Should have thrown an error');
      } catch (error) {
        if (!error.message.includes('400')) {
          throw new Error('Expected 400 Bad Request');
        }
        log(colors.green, '   Correctly rejected invalid request');
      }
    })
  );

  // Test 4: Trigger the created workflow
  if (createdWorkflowId) {
    results.push(
      await test('Trigger existing workflow', async () => {
        const response = await request('/api/workflows/trigger', {
          method: 'POST',
          body: JSON.stringify({
            workflow_id: createdWorkflowId,
            input: {
              testData: 'Hello from integration test',
            },
          }),
        });

        if (!response.data.success) {
          throw new Error('Expected success: true');
        }

        if (!response.data.execution) {
          throw new Error('Expected execution object in response');
        }

        triggeredExecutionId = response.data.execution.id;
        log(
          colors.green,
          `   Execution ID: ${response.data.execution.id || 'N/A'}`
        );
        log(
          colors.green,
          `   Status: ${response.data.execution.status}`
        );
      })
    );
  } else {
    log(colors.yellow, '\n⚠️  Skipping trigger test (no workflow created)');
  }

  // Test 5: Sync executions from n8n
  results.push(
    await test('Sync all executions from n8n', async () => {
      const response = await request('/api/executions/sync?limit=10');

      if (!response.data.success) {
        throw new Error('Expected success: true');
      }

      if (!response.data.summary) {
        throw new Error('Expected summary object in response');
      }

      const summary = response.data.summary;
      log(colors.green, `   Total executions: ${summary.total}`);
      log(colors.green, `   Inserted: ${summary.inserted}`);
      log(colors.green, `   Updated: ${summary.updated}`);
      log(colors.green, `   Skipped: ${summary.skipped}`);

      if (summary.errors && summary.errors.length > 0) {
        log(colors.yellow, `   Errors: ${summary.errors.length}`);
        summary.errors.forEach((err) =>
          log(colors.yellow, `     - ${err}`)
        );
      }
    })
  );

  // Test 6: Sync executions for specific workflow
  if (createdWorkflowId) {
    results.push(
      await test('Sync executions for specific workflow', async () => {
        const response = await request(
          `/api/executions/sync?workflow_id=${createdWorkflowId}&limit=5`
        );

        if (!response.data.success) {
          throw new Error('Expected success: true');
        }

        const summary = response.data.summary;
        log(colors.green, `   Total executions: ${summary.total}`);
      })
    );
  } else {
    log(
      colors.yellow,
      '\n⚠️  Skipping workflow-specific sync test (no workflow created)'
    );
  }

  // Summary
  log(colors.yellow, '\n' + '='.repeat(60));
  const passed = results.filter(Boolean).length;
  const failed = results.length - passed;

  if (failed === 0) {
    log(colors.green, `\n✅ All ${passed} tests passed!`);
    log(
      colors.green,
      '\n🎉 Synth ↔ n8n integration is working correctly!'
    );
  } else {
    log(colors.red, `\n❌ ${failed} test(s) failed, ${passed} passed`);
    process.exit(1);
  }
}

// Check if Next.js server is running
async function checkServer() {
  try {
    await fetch(`${BASE_URL}/api/workflows`);
    return true;
  } catch (error) {
    log(
      colors.red,
      `\n❌ Cannot connect to ${BASE_URL}`
    );
    log(
      colors.yellow,
      '   Make sure your Next.js server is running: npm run dev'
    );
    return false;
  }
}

(async () => {
  if (await checkServer()) {
    await runTests();
  }
})();

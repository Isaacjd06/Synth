/**
 * Test script for /api/workflows/run endpoint
 *
 * Usage: node test-workflow-run.js [workflow_id]
 *
 * If no workflow_id is provided, it will create a test workflow first.
 */

const testWorkflow = {
  name: "Test Workflow for Execution",
  description: "A simple workflow to test execution",
  intent: "Test the workflow execution system",
  trigger: {
    type: "manual",
    config: {}
  },
  actions: [
    {
      type: "code",
      config: {
        name: "Process Input",
        code: `
          const input = $json.input || {};
          return [{
            json: {
              message: 'Hello from Synth Execution!',
              timestamp: new Date().toISOString(),
              input_received: input
            }
          }];
        `
      }
    }
  ]
};

const testRunData = {
  input_data: {
    test_key: "test_value",
    timestamp: new Date().toISOString()
  }
};

async function createTestWorkflow() {
  console.log('🔧 Creating test workflow first...\n');

  try {
    const response = await fetch('http://localhost:3000/api/workflows/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testWorkflow),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to create workflow: ${error.error || response.statusText}`);
    }

    const data = await response.json();
    console.log(`✅ Test workflow created with ID: ${data.workflow.id}\n`);
    return data.workflow.id;
  } catch (error) {
    console.error('❌ Failed to create test workflow:', error.message);
    throw error;
  }
}

async function testWorkflowRun(workflowId) {
  console.log('🧪 Testing /api/workflows/run endpoint...\n');
  console.log(`📋 Workflow ID: ${workflowId}`);
  console.log('📋 Input data:');
  console.log(JSON.stringify(testRunData.input_data, null, 2));
  console.log('\n📤 Sending POST request to http://localhost:3000/api/workflows/run\n');

  try {
    const response = await fetch('http://localhost:3000/api/workflows/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        workflow_id: workflowId,
        ...testRunData
      }),
    });

    console.log(`📊 Response Status: ${response.status} ${response.statusText}\n`);

    const data = await response.json();

    if (response.ok || response.status === 207) {
      if (data.warning) {
        console.log('⚠️ PARTIAL SUCCESS:\n');
      } else {
        console.log('✅ SUCCESS! Workflow executed:\n');
      }
      console.log(JSON.stringify(data, null, 2));

      if (data.execution) {
        console.log('\n📝 Summary:');
        console.log(`   - Execution ID: ${data.execution.id}`);
        console.log(`   - Workflow: "${data.execution.workflow_name}"`);
        console.log(`   - Status: ${data.execution.status}`);
        console.log(`   - n8n Execution ID: ${data.execution.n8n_execution_id}`);
        console.log(`   - Started: ${data.execution.started_at}`);
        console.log(`   - Finished: ${data.execution.finished_at || 'Still running'}`);

        if (data.summary) {
          console.log('\n📊 Execution Details:');
          console.log(`   - Input keys: ${data.summary.input_keys.join(', ') || 'none'}`);
          console.log(`   - Output keys: ${data.summary.output_keys.join(', ') || 'none'}`);
          if (data.summary.execution_time_ms) {
            console.log(`   - Execution time: ${data.summary.execution_time_ms}ms`);
          }
        }

        if (data.execution.n8n_execution_id) {
          console.log('\n🌐 View in n8n: http://localhost:5678/execution/' + data.execution.n8n_execution_id);
        }
      }
    } else {
      console.log('❌ ERROR:\n');
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

async function main() {
  const args = process.argv.slice(2);
  let workflowId = args[0];

  try {
    // If no workflow ID provided, create a test workflow
    if (!workflowId) {
      console.log('ℹ️ No workflow_id provided. Creating a test workflow...\n');
      workflowId = await createTestWorkflow();
    }

    // Test the run endpoint
    await testWorkflowRun(workflowId);
  } catch (error) {
    console.error('\n💥 Test failed:', error.message);
    process.exit(1);
  }
}

main();

/**
 * Test script for /api/workflows/create endpoint
 *
 * Usage: node test-workflow-create.js
 */

const testWorkflow = {
  name: "Test Workflow",
  description: "A test workflow to verify the create endpoint",
  intent: "Test the workflow creation system",
  trigger: {
    type: "manual",
    config: {}
  },
  actions: [
    {
      type: "code",
      config: {
        name: "Log Message",
        code: "return [{ json: { message: 'Hello from Synth!' } }]"
      }
    }
  ]
};

async function testWorkflowCreate() {
  console.log('🧪 Testing /api/workflows/create endpoint...\n');
  console.log('📋 Test workflow data:');
  console.log(JSON.stringify(testWorkflow, null, 2));
  console.log('\n📤 Sending POST request to http://localhost:3000/api/workflows/create\n');

  try {
    const response = await fetch('http://localhost:3000/api/workflows/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testWorkflow),
    });

    console.log(`📊 Response Status: ${response.status} ${response.statusText}\n`);

    const data = await response.json();

    if (response.ok) {
      console.log('✅ SUCCESS! Workflow created:\n');
      console.log(JSON.stringify(data, null, 2));
      console.log('\n📝 Summary:');
      console.log(`   - Synth Workflow ID: ${data.workflow.id}`);
      console.log(`   - n8n Workflow ID: ${data.workflow.n8n_workflow_id}`);
      console.log(`   - Name: "${data.workflow.name}"`);
      console.log(`   - Active: ${data.workflow.active}`);
      console.log('\n🌐 View in n8n: http://localhost:5678/workflow/' + data.workflow.n8n_workflow_id);
    } else {
      console.log('❌ ERROR:\n');
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

testWorkflowCreate();

/**
 * POST /api/workflows/create
 *
 * Creates a new workflow in Synth and n8n
 *
 * Flow:
 * 1. Accept user intent and workflow blueprint
 * 2. Save workflow to Supabase workflows table
 * 3. Create matching workflow in n8n via REST API
 * 4. Update Supabase with n8n workflow ID
 * 5. Return confirmation with workflow details
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { createWorkflow, WorkflowBlueprint } from '@/lib/n8nClient';

// Temporary user ID (matches schema-analysis.md)
const TEMP_USER_ID = '00000000-0000-0000-0000-000000000000';

export async function POST(request: NextRequest) {
  try {
    console.log('📥 [Workflow Create] Received request to create workflow');
    const body = await request.json();
    console.log('📋 [Workflow Create] Request body:', JSON.stringify(body, null, 2));

    // Validate required fields
    if (!body.name || !body.intent) {
      console.error('❌ [Workflow Create] Validation failed: missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields: name and intent are required' },
        { status: 400 }
      );
    }

    // Construct workflow blueprint with defaults
    const blueprint: WorkflowBlueprint = {
      name: body.name,
      description: body.description || '',
      intent: body.intent,
      trigger: body.trigger || {
        type: 'manual',
        config: {},
      },
      actions: body.actions || [],
    };
    console.log('🔧 [Workflow Create] Constructed blueprint:', JSON.stringify(blueprint, null, 2));

    // Step 1: Save workflow blueprint to Supabase
    console.log('💾 [Workflow Create] Step 1: Saving workflow to Supabase...');
    const { data: insertedWorkflow, error: insertError } = await supabaseServer
      .from('workflows')
      .insert({
        name: blueprint.name,
        description: blueprint.description,
        intent: blueprint.intent,
        trigger: blueprint.trigger,
        actions: blueprint.actions,
        user_id: TEMP_USER_ID,
        active: false,
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ [Workflow Create] Failed to insert workflow into Supabase:', insertError);
      return NextResponse.json(
        {
          error: 'Failed to save workflow to database',
          details: insertError.message,
        },
        { status: 500 }
      );
    }

    console.log('✅ [Workflow Create] Workflow saved to Supabase with ID:', insertedWorkflow.id);

    // Step 2: Create workflow in n8n
    console.log('🔄 [Workflow Create] Step 2: Creating workflow in n8n at http://localhost:5678...');
    let n8nWorkflow;
    let n8nWorkflowId = null;

    try {
      n8nWorkflow = await createWorkflow(blueprint);
      n8nWorkflowId = n8nWorkflow.id;
      console.log('✅ [Workflow Create] Workflow created in n8n with ID:', n8nWorkflowId);

      // Step 3: Update Supabase with n8n workflow ID
      if (n8nWorkflowId) {
        console.log('🔗 [Workflow Create] Step 3: Linking n8n workflow ID to Supabase record...');
        const { error: updateError } = await supabaseServer
          .from('workflows')
          .update({ n8n_workflow_id: n8nWorkflowId })
          .eq('id', insertedWorkflow.id);

        if (updateError) {
          console.error(
            '⚠️ [Workflow Create] Failed to update workflow with n8n ID:',
            updateError
          );
          // Non-fatal: workflow exists in both systems, just not linked
        } else {
          console.log('✅ [Workflow Create] Successfully linked n8n workflow ID to Supabase');
        }
      }
    } catch (n8nError) {
      console.error('❌ [Workflow Create] Failed to create workflow in n8n:', n8nError);
      // Workflow exists in Supabase but not in n8n
      return NextResponse.json(
        {
          warning: 'Workflow saved to Synth but failed to create in n8n',
          workflow: insertedWorkflow,
          error: n8nError instanceof Error ? n8nError.message : 'Unknown error',
        },
        { status: 207 } // 207 Multi-Status: partial success
      );
    }

    // Step 4: Return success response
    const successResponse = {
      success: true,
      message: 'Workflow created successfully',
      workflow: {
        id: insertedWorkflow.id,
        name: insertedWorkflow.name,
        description: insertedWorkflow.description,
        intent: insertedWorkflow.intent,
        active: insertedWorkflow.active,
        n8n_workflow_id: n8nWorkflowId,
        created_at: insertedWorkflow.created_at,
      },
    };

    console.log('🎉 [Workflow Create] Success! Workflow created in both systems:');
    console.log(`   - Synth ID: ${insertedWorkflow.id}`);
    console.log(`   - n8n ID: ${n8nWorkflowId}`);
    console.log(`   - Name: "${insertedWorkflow.name}"`);

    return NextResponse.json(successResponse, { status: 201 });
  } catch (error) {
    console.error('❌ [Workflow Create] Unexpected error in /api/workflows/create:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

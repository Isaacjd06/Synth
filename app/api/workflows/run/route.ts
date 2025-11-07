/**
 * POST /api/workflows/run
 *
 * Executes a workflow in n8n and saves the execution result
 *
 * Flow:
 * 1. Accept workflow_id (Synth UUID) and optional input_data
 * 2. Fetch n8n_workflow_id from Supabase workflows table
 * 3. Execute workflow in n8n via REST API
 * 4. Save execution result to Supabase executions table
 * 5. Return execution status and summary
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { executeWorkflow } from '@/lib/n8nClient';

export async function POST(request: NextRequest) {
  try {
    console.log('📥 [Workflow Run] Received request to execute workflow');
    const body = await request.json();
    console.log('📋 [Workflow Run] Request body:', JSON.stringify(body, null, 2));

    // Validate required fields
    if (!body.workflow_id) {
      console.error('❌ [Workflow Run] Validation failed: missing workflow_id');
      return NextResponse.json(
        { error: 'Missing required field: workflow_id is required' },
        { status: 400 }
      );
    }

    const { workflow_id, input_data = {} } = body;
    console.log(`🔍 [Workflow Run] Looking up workflow with ID: ${workflow_id}`);

    // Step 1: Fetch n8n_workflow_id from Supabase
    console.log('💾 [Workflow Run] Step 1: Fetching workflow from Supabase...');
    const { data: workflow, error: fetchError } = await supabaseServer
      .from('workflows')
      .select('id, name, n8n_workflow_id')
      .eq('id', workflow_id)
      .single();

    if (fetchError) {
      console.error('❌ [Workflow Run] Failed to fetch workflow from Supabase:', fetchError);
      return NextResponse.json(
        {
          error: 'Workflow not found',
          details: fetchError.message,
        },
        { status: 404 }
      );
    }

    if (!workflow.n8n_workflow_id) {
      console.error('❌ [Workflow Run] Workflow exists but has no n8n_workflow_id');
      return NextResponse.json(
        {
          error: 'Workflow is not linked to n8n',
          details: 'This workflow does not have an associated n8n workflow ID',
        },
        { status: 400 }
      );
    }

    console.log(`✅ [Workflow Run] Found workflow: "${workflow.name}" with n8n ID: ${workflow.n8n_workflow_id}`);

    // Step 2: Execute workflow in n8n
    console.log(`🚀 [Workflow Run] Step 2: Executing workflow in n8n...`);
    console.log(`📤 [Workflow Run] Sending input data:`, JSON.stringify(input_data, null, 2));

    let execution;
    let executionStartTime = new Date().toISOString();

    try {
      execution = await executeWorkflow(workflow.n8n_workflow_id, input_data);
      console.log('✅ [Workflow Run] Workflow executed successfully in n8n');
      console.log(`🔍 [Workflow Run] Execution ID: ${execution.id}`);
      console.log(`🔍 [Workflow Run] Execution finished: ${execution.finished}`);
    } catch (n8nError) {
      console.error('❌ [Workflow Run] Failed to execute workflow in n8n:', n8nError);

      // Save failed execution to Supabase
      const { error: insertError } = await supabaseServer
        .from('executions')
        .insert({
          workflow_id: workflow_id,
          status: 'error',
          input: input_data,
          output: {
            error: n8nError instanceof Error ? n8nError.message : 'Unknown error',
          },
          started_at: executionStartTime,
          finished_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error('⚠️ [Workflow Run] Failed to save error execution to database:', insertError);
      }

      return NextResponse.json(
        {
          error: 'Failed to execute workflow in n8n',
          details: n8nError instanceof Error ? n8nError.message : 'Unknown error',
        },
        { status: 500 }
      );
    }

    // Step 3: Save execution result to Supabase
    console.log('💾 [Workflow Run] Step 3: Saving execution result to Supabase...');

    // Extract output data from execution
    const outputData = execution.data?.resultData?.runData || {};
    const executionStatus = execution.finished ? 'success' : 'running';
    const finishedAt = execution.stoppedAt || (execution.finished ? new Date().toISOString() : null);

    const { data: savedExecution, error: insertError } = await supabaseServer
      .from('executions')
      .insert({
        workflow_id: workflow_id,
        status: executionStatus,
        input: input_data,
        output: outputData,
        n8n_execution_id: execution.id,
        started_at: execution.startedAt || executionStartTime,
        finished_at: finishedAt,
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ [Workflow Run] Failed to save execution to Supabase:', insertError);
      // Non-fatal: execution succeeded in n8n, just wasn't saved to our DB
      return NextResponse.json(
        {
          warning: 'Workflow executed successfully but failed to save to database',
          execution: {
            n8n_execution_id: execution.id,
            workflow_id: workflow_id,
            status: executionStatus,
            finished: execution.finished,
          },
          error: insertError.message,
        },
        { status: 207 } // 207 Multi-Status: partial success
      );
    }

    console.log('✅ [Workflow Run] Execution saved to Supabase with ID:', savedExecution.id);

    // Step 4: Return success response
    const successResponse = {
      success: true,
      message: 'Workflow executed successfully',
      execution: {
        id: savedExecution.id,
        workflow_id: savedExecution.workflow_id,
        workflow_name: workflow.name,
        status: savedExecution.status,
        n8n_execution_id: savedExecution.n8n_execution_id,
        started_at: savedExecution.started_at,
        finished_at: savedExecution.finished_at,
        finished: execution.finished,
      },
      summary: {
        input_keys: Object.keys(input_data),
        output_keys: Object.keys(outputData),
        execution_time_ms: finishedAt
          ? new Date(finishedAt).getTime() - new Date(execution.startedAt || executionStartTime).getTime()
          : null,
      },
    };

    console.log('🎉 [Workflow Run] Success! Workflow executed and saved:');
    console.log(`   - Workflow: "${workflow.name}" (${workflow_id})`);
    console.log(`   - Execution ID: ${savedExecution.id}`);
    console.log(`   - n8n Execution ID: ${execution.id}`);
    console.log(`   - Status: ${executionStatus}`);
    console.log(`   - Finished: ${execution.finished}`);

    return NextResponse.json(successResponse, { status: 200 });
  } catch (error) {
    console.error('❌ [Workflow Run] Unexpected error in /api/workflows/run:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

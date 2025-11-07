/**
 * POST /api/workflows/trigger
 *
 * Triggers an existing workflow in n8n on demand
 *
 * Flow:
 * 1. Accept workflow ID and optional input data
 * 2. Fetch workflow from Supabase to get n8n workflow ID
 * 3. Execute workflow in n8n via REST API
 * 4. Save execution record to Supabase executions table
 * 5. Return execution details
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { executeWorkflow } from '@/lib/n8nClient';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.workflow_id) {
      return NextResponse.json(
        { error: 'Missing required field: workflow_id' },
        { status: 400 }
      );
    }

    // Step 1: Fetch workflow from Supabase
    const { data: workflow, error: fetchError } = await supabaseServer
      .from('workflows')
      .select('id, name, n8n_workflow_id, active')
      .eq('id', body.workflow_id)
      .single();

    if (fetchError || !workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }

    // Check if workflow has n8n ID
    if (!workflow.n8n_workflow_id) {
      return NextResponse.json(
        {
          error: 'Workflow is not linked to n8n',
          details: 'This workflow was not successfully created in n8n',
        },
        { status: 400 }
      );
    }

    // Step 2: Execute workflow in n8n
    let n8nExecution;
    try {
      n8nExecution = await executeWorkflow(
        workflow.n8n_workflow_id,
        body.input || {}
      );
    } catch (n8nError) {
      console.error('Failed to execute workflow in n8n:', n8nError);

      // Save failed execution to Supabase
      await supabaseServer.from('executions').insert({
        workflow_id: workflow.id,
        n8n_execution_id: null,
        status: 'error',
        input: body.input || {},
        output: {
          error: n8nError instanceof Error ? n8nError.message : 'Unknown error',
        },
        created_at: new Date().toISOString(),
      });

      return NextResponse.json(
        {
          error: 'Failed to execute workflow in n8n',
          details: n8nError instanceof Error ? n8nError.message : 'Unknown error',
        },
        { status: 500 }
      );
    }

    // Step 3: Save execution to Supabase
    const executionStatus = n8nExecution.finished ? 'success' : 'running';

    const { data: savedExecution, error: insertError } = await supabaseServer
      .from('executions')
      .insert({
        workflow_id: workflow.id,
        n8n_execution_id: n8nExecution.id,
        status: executionStatus,
        input: body.input || {},
        output: n8nExecution.data || {},
        started_at: n8nExecution.startedAt,
        finished_at: n8nExecution.stoppedAt || null,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to save execution to Supabase:', insertError);
      // Non-fatal: execution ran successfully in n8n
    }

    // Step 4: Return success response
    return NextResponse.json(
      {
        success: true,
        message: 'Workflow triggered successfully',
        execution: {
          id: savedExecution?.id || null,
          workflow_id: workflow.id,
          workflow_name: workflow.name,
          n8n_execution_id: n8nExecution.id,
          status: executionStatus,
          started_at: n8nExecution.startedAt,
          finished_at: n8nExecution.stoppedAt || null,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error in /api/workflows/trigger:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

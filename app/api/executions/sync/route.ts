/**
 * GET /api/executions/sync
 *
 * Fetches recent executions from n8n and syncs them to Supabase
 *
 * Flow:
 * 1. Optionally accept workflow_id to filter executions
 * 2. Fetch recent executions from n8n REST API
 * 3. For each execution, check if it exists in Supabase
 * 4. Insert or update execution records in Supabase
 * 5. Return sync summary
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { getExecutions, N8nExecution } from '@/lib/n8nClient';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const workflowId = searchParams.get('workflow_id');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    // Step 1: Get n8n workflow ID if Synth workflow ID is provided
    let n8nWorkflowId: string | undefined;

    if (workflowId) {
      const { data: workflow, error: fetchError } = await supabaseServer
        .from('workflows')
        .select('n8n_workflow_id')
        .eq('id', workflowId)
        .single();

      if (fetchError || !workflow?.n8n_workflow_id) {
        return NextResponse.json(
          { error: 'Workflow not found or not linked to n8n' },
          { status: 404 }
        );
      }

      n8nWorkflowId = workflow.n8n_workflow_id;
    }

    // Step 2: Fetch executions from n8n
    let n8nExecutions: N8nExecution[];
    try {
      n8nExecutions = await getExecutions({
        workflowId: n8nWorkflowId,
        limit,
      });
    } catch (n8nError) {
      console.error('Failed to fetch executions from n8n:', n8nError);
      return NextResponse.json(
        {
          error: 'Failed to fetch executions from n8n',
          details: n8nError instanceof Error ? n8nError.message : 'Unknown error',
        },
        { status: 500 }
      );
    }

    // Step 3: Sync executions to Supabase
    const syncResults = {
      total: n8nExecutions.length,
      inserted: 0,
      updated: 0,
      skipped: 0,
      errors: [] as string[],
    };

    for (const n8nExecution of n8nExecutions) {
      try {
        // Find corresponding Synth workflow ID
        const { data: workflow } = await supabaseServer
          .from('workflows')
          .select('id')
          .eq('n8n_workflow_id', n8nExecution.workflowId)
          .single();

        if (!workflow) {
          syncResults.skipped++;
          continue;
        }

        // Check if execution already exists in Supabase
        const { data: existingExecution } = await supabaseServer
          .from('executions')
          .select('id, status')
          .eq('n8n_execution_id', n8nExecution.id)
          .single();

        const executionData = {
          workflow_id: workflow.id,
          n8n_execution_id: n8nExecution.id,
          status: n8nExecution.finished
            ? n8nExecution.data?.resultData
              ? 'success'
              : 'error'
            : 'running',
          input: {},
          output: n8nExecution.data?.resultData || {},
          started_at: n8nExecution.startedAt,
          finished_at: n8nExecution.stoppedAt || null,
        };

        if (existingExecution) {
          // Update existing execution
          const { error: updateError } = await supabaseServer
            .from('executions')
            .update(executionData)
            .eq('id', existingExecution.id);

          if (updateError) {
            syncResults.errors.push(
              `Failed to update execution ${n8nExecution.id}: ${updateError.message}`
            );
          } else {
            syncResults.updated++;
          }
        } else {
          // Insert new execution
          const { error: insertError } = await supabaseServer
            .from('executions')
            .insert({
              ...executionData,
              created_at: new Date().toISOString(),
            });

          if (insertError) {
            syncResults.errors.push(
              `Failed to insert execution ${n8nExecution.id}: ${insertError.message}`
            );
          } else {
            syncResults.inserted++;
          }
        }
      } catch (error) {
        syncResults.errors.push(
          `Error processing execution ${n8nExecution.id}: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        );
      }
    }

    // Step 4: Return sync summary
    return NextResponse.json(
      {
        success: true,
        message: 'Executions synced successfully',
        summary: syncResults,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error in /api/executions/sync:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/workflows/trigger
 *
 * LEGACY ROUTE: This route is deprecated. Use /api/workflows/run instead.
 * This route has been converted from n8n to Pipedream for MVP.
 *
 * Triggers an existing workflow in Pipedream on demand
 *
 * Flow:
 * 1. Accept workflow ID and optional input data
 * 2. Fetch workflow from Neon (Prisma) to get Pipedream workflow ID (stored in n8n_workflow_id field)
 * 3. Execute workflow in Pipedream via REST API
 * 4. Save execution record to Neon executions table
 * 5. Return execution details
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateAndCheckSubscription } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { runWorkflow } from '@/lib/pipedream/runWorkflow';

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateAndCheckSubscription();
    if (authResult instanceof NextResponse) {
      return authResult; // Returns 401 or 403
    }
    const { userId } = authResult;

    const body = await request.json();

    // Validate required fields
    if (!body.workflow_id) {
      return NextResponse.json(
        { error: 'Missing required field: workflow_id' },
        { status: 400 }
      );
    }

    // Step 1: Fetch workflow from Neon (Prisma)
    const workflow = await prisma.workflows.findFirst({
      where: {
        id: body.workflow_id,
        user_id: userId,
      },
      select: {
        id: true,
        name: true,
        n8n_workflow_id: true, // Temporarily stores Pipedream workflow ID
        active: true,
        user_id: true,
      },
    });

    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }

    // Check if workflow has Pipedream ID (stored in n8n_workflow_id field temporarily)
    if (!workflow.n8n_workflow_id) {
      return NextResponse.json(
        {
          error: 'Workflow is not activated',
          details: 'This workflow has not been deployed to Pipedream. Please activate it first.',
        },
        { status: 400 }
      );
    }

    // Step 2: Execute workflow in Pipedream
    const runResult = await runWorkflow(
      workflow.n8n_workflow_id, // This is actually the Pipedream workflow ID
      body.input || {}
    );

    if (!runResult.ok) {
      // Save failed execution to Neon (Prisma)
      await prisma.execution.create({
        data: {
          workflow_id: workflow.id,
          user_id: userId,
          input_data: body.input || {},
          output_data: {
            error: runResult.error,
            details: runResult.details,
          },
          status: 'failure',
          pipedream_execution_id: null,
          finished_at: new Date(),
        },
      });

      return NextResponse.json(
        {
          error: 'Failed to execute workflow in Pipedream',
          details: runResult.error || runResult.details,
        },
        { status: 500 }
      );
    }

    const execution = runResult.execution;

    // Step 3: Save execution to Neon (Prisma)
    const executionStatus = execution.status || (execution.finished_at ? 'success' : 'running');

    let savedExecution;
    try {
      savedExecution = await prisma.execution.create({
        data: {
          workflow_id: workflow.id,
          user_id: userId,
          input_data: body.input || {},
          output_data: execution.data?.output || null,
          status: executionStatus,
          pipedream_execution_id: execution.id || null,
          finished_at: execution.finished_at ? new Date(execution.finished_at) : null,
        },
      });
    } catch (insertError: unknown) {
      console.error('Failed to save execution to Neon:', insertError);
      // Non-fatal: execution ran successfully in Pipedream
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
          pipedream_execution_id: execution.id || null,
          status: executionStatus,
          started_at: execution.started_at,
          finished_at: execution.finished_at || null,
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

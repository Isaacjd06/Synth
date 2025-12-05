/**
 * GET /api/workflows/sync-executions
 * 
 * DEPRECATED: This route was for n8n integration. 
 * MVP uses Pipedream only, and executions are logged automatically during workflow runs.
 * 
 * For MVP, use the regular execution endpoints (/api/executions) which automatically
 * log executions when workflows are run via /api/workflows/run.
 * 
 * This route is kept for backward compatibility but will not function in MVP.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Minimal type for n8n execution response
type N8NExecution = {
  id: number;
  workflowId: string;
  status?: string;
  finished?: boolean;
  startedAt?: string;
  finishedAt?: string;
  stoppedAt?: string;
  data?: any;
  payload?: any;
  result?: any;
  output?: any;
};

export async function GET(request: NextRequest) {
  // MVP: This route is deprecated. Executions are automatically logged during workflow runs.
  return NextResponse.json(
    {
      ok: false,
      error: 'This endpoint is deprecated. MVP uses Pipedream, and executions are automatically logged during workflow runs.',
      message: 'Use /api/executions to view execution history.',
    },
    { status: 410 } // 410 Gone - indicates the resource is no longer available
  );

  /* DEPRECATED CODE - Kept for reference
  try {
    const N8N_URL = process.env.N8N_URL || 'http://127.0.0.1:5678';
    const N8N_API_KEY = process.env.N8N_API_KEY;

    if (!N8N_API_KEY) {
      return NextResponse.json(
        { error: 'N8N_API_KEY not configured' },
        { status: 500 }
      );
    }

    console.log('🔄 Fetching executions from n8n...');

    // Fetch executions from n8n
    const n8nResponse = await fetch(`${N8N_URL}/api/v1/executions`, {
      method: 'GET',
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text();
      console.error('❌ n8n API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to fetch from n8n', details: errorText },
        { status: 500 }
      );
    }

    const n8nData = await n8nResponse.json();
    const executions: N8NExecution[] = n8nData.data || n8nData.results || [];

    console.log(`✅ Fetched ${executions.length} executions from n8n`);

    if (executions.length === 0) {
      return NextResponse.json({
        ok: true,
        fetched: 0,
        inserted: 0,
        skipped: 0,
      });
    }

    // Get existing pipedream_execution_ids to avoid duplicates (using n8n IDs temporarily stored here)
    const existing = await prisma.execution.findMany({
      where: {
        pipedream_execution_id: { not: null },
      },
      select: {
        pipedream_execution_id: true,
      },
    });

    const existingIds = new Set(
      existing.map((e) => e.pipedream_execution_id).filter(Boolean) as string[]
    );

    // Get workflow mappings (n8n_workflow_id -> id)
    // NOTE: n8n_workflow_id field temporarily stores Pipedream IDs during MVP
    const workflows = await prisma.workflows.findMany({
      where: {
        n8n_workflow_id: { not: null },
      },
      select: {
        id: true,
        n8n_workflow_id: true,
      },
    });

    const workflowMap = new Map<string, string>();
    workflows.forEach((w) => {
      if (w.n8n_workflow_id) {
        workflowMap.set(w.n8n_workflow_id, w.id);
      }
    });

    console.log(`🧩 Mapped ${workflowMap.size} workflows`);

    // Process executions
    const toInsert = [];
    let skippedCount = 0;

    for (const exec of executions) {
      // Skip if already synced (check by pipedream_execution_id)
      if (existingIds.has(exec.id.toString())) {
        skippedCount++;
        continue;
      }

      // Skip if workflow not found
      const workflowId = workflowMap.get(exec.workflowId);
      if (!workflowId) {
        skippedCount++;
        continue;
      }

      // Determine status
      let status = 'unknown';
      if (exec.status) {
        status = exec.status;
      } else if (exec.finished === true) {
        status = 'success';
      } else if (exec.finished === false) {
        status = 'running';
      }

      // Extract input and output
      const inputData = exec.data || exec.payload || {};
      const outputData = exec.result || exec.output || {};

      toInsert.push({
        workflow_id: workflowId,
        user_id: "00000000-0000-0000-0000-000000000000", // SYSTEM_USER_ID
        input_data: inputData,
        output_data: outputData,
        status: status,
        pipedream_execution_id: exec.id.toString(), // Store n8n execution ID in pipedream_execution_id field temporarily
        created_at: exec.startedAt ? new Date(exec.startedAt) : new Date(),
        finished_at: exec.finishedAt || exec.stoppedAt ? new Date(exec.finishedAt || exec.stoppedAt!) : null,
      });
    }

    // Bulk insert using Prisma
    let insertedCount = 0;
    if (toInsert.length > 0) {
      try {
        // Prisma doesn't support bulk insert directly, so we'll use createMany
        const result = await prisma.execution.createMany({
          data: toInsert,
          skipDuplicates: true,
        });
        insertedCount = result.count;
      } catch (insertError: any) {
        console.error('❌ Insert error:', insertError);
        return NextResponse.json(
          { error: 'Failed to insert executions', details: insertError.message },
          { status: 500 }
        );
      }
    }

    console.log(`🧩 Inserted ${insertedCount}, skipped ${skippedCount}`);
    console.log('🏁 Sync complete');

    return NextResponse.json({
      ok: true,
      fetched: executions.length,
      inserted: insertedCount,
      skipped: skippedCount,
    });
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
  */
}

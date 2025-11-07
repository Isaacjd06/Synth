/**
 * GET /api/workflows/sync-executions
 * Synchronizes execution history from n8n to Supabase
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

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

    // Get existing n8n_execution_ids to avoid duplicates
    const { data: existing, error: existingError } = await supabaseServer
      .from('executions')
      .select('n8n_execution_id')
      .not('n8n_execution_id', 'is', null);

    if (existingError) {
      console.error('❌ Supabase error:', existingError);
      return NextResponse.json(
        { error: 'Failed to query existing executions', details: existingError.message },
        { status: 500 }
      );
    }

    const existingIds = new Set(
      (existing || []).map((e) => e.n8n_execution_id)
    );

    // Get workflow mappings (n8n_workflow_id -> id)
    const { data: workflows, error: workflowError } = await supabaseServer
      .from('workflows')
      .select('id, n8n_workflow_id');

    if (workflowError) {
      console.error('❌ Supabase error:', workflowError);
      return NextResponse.json(
        { error: 'Failed to fetch workflows', details: workflowError.message },
        { status: 500 }
      );
    }

    const workflowMap = new Map<string, string>();
    (workflows || []).forEach((w) => {
      if (w.n8n_workflow_id) {
        workflowMap.set(w.n8n_workflow_id, w.id);
      }
    });

    console.log(`🧩 Mapped ${workflowMap.size} workflows`);

    // Process executions
    const toInsert = [];
    let skippedCount = 0;

    for (const exec of executions) {
      // Skip if already synced
      if (existingIds.has(exec.id)) {
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
        input_data: inputData,
        output_data: outputData,
        status: status,
        n8n_execution_id: exec.id,
        created_at: exec.startedAt || new Date().toISOString(),
        finished_at: exec.finishedAt || exec.stoppedAt || new Date().toISOString(),
      });
    }

    // Bulk insert
    let insertedCount = 0;
    if (toInsert.length > 0) {
      const { data: inserted, error: insertError } = await supabaseServer
        .from('executions')
        .insert(toInsert)
        .select('id');

      if (insertError) {
        console.error('❌ Insert error:', insertError);
        return NextResponse.json(
          { error: 'Failed to insert executions', details: insertError.message },
          { status: 500 }
        );
      }

      insertedCount = inserted?.length || 0;
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
}

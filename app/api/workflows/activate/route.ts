"use server";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000000";

// n8n environment variables
const N8N_URL = process.env.N8N_API_URL!;
const N8N_API_KEY = process.env.N8N_API_KEY!;

export async function POST(req: Request) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "Workflow ID is required." },
        { status: 400 }
      );
    }

    if (!N8N_URL || !N8N_API_KEY) {
      return NextResponse.json(
        { error: "Missing n8n environment variables." },
        { status: 500 }
      );
    }

    // 1. Fetch workflow from Neon
    const workflow = await prisma.workflows.findFirst({
      where: {
        id,
        user_id: SYSTEM_USER_ID,
      },
    });

    if (!workflow) {
      return NextResponse.json(
        { error: "Workflow not found." },
        { status: 404 }
      );
    }

    // 2. Build n8n workflow JSON (MVP)
    // For now you can extend this later when the Brain generates full workflows
    const n8nBody = {
      name: workflow.name,
      active: true,
      settings: {},
      nodes: [
        {
          id: "1",
          name: "Webhook",
          type: "n8n-nodes-base.webhook",
          typeVersion: 1,
          position: [200, 300],
          parameters: {
            httpMethod: "POST",
            path: `synth-${workflow.id}`,
            responseMode: "onReceived",
            options: {},
          },
        },
        {
          id: "2",
          name: "Set",
          type: "n8n-nodes-base.set",
          typeVersion: 2,
          position: [500, 300],
          parameters: {
            values: {
              string: [
                {
                  name: "message",
                  value: `Workflow ${workflow.name} executed successfully`,
                },
              ],
            },
          },
        },
      ],
      connections: {
        Webhook: {
          main: [
            [
              {
                node: "Set",
                type: "main",
                index: 0,
              },
            ],
          ],
        },
      },
    };

    // 3. Deploy to n8n
    const res = await fetch(`${N8N_URL}/workflows`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-N8N-API-KEY": N8N_API_KEY,
      },
      body: JSON.stringify(n8nBody),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("n8n ERROR:", data);
      return NextResponse.json(
        { error: "Failed to activate workflow in n8n.", details: data },
        { status: 500 }
      );
    }

    // 4. Save n8n workflow ID in Neon
    await prisma.workflows.update({
      where: { id },
      data: {
        n8n_workflow_id: data.id.toString(),
        active: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Workflow activated successfully.",
        n8n_workflow_id: data.id,
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error("WORKFLOW ACTIVATE ERROR:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

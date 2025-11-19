import { NextResponse } from "next/server";

console.log("🔥 API /api/workflows/run was loaded");

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function POST(request: Request) {
  try {
    console.log("➡️ /api/workflows/run — POST called");

    const { id } = await request.json();
    console.log("➡️ Workflow ID received:", id);

    const webhookUrl = "http://localhost:5678/webhook-test/synth-run";
    console.log("➡️ Sending POST to:", webhookUrl);

    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workflowId: id }),
    });

    const rawText = await res.text();
    console.log("⬅️ RAW RESPONSE FROM n8n:", rawText);

    let data;
    try {
      data = JSON.parse(rawText);
    } catch (e) {
      data = { error: "JSON parse failed", raw: rawText };
    }

    return NextResponse.json(
      { ok: true, message: "Workflow triggered", n8n: data },
      { status: 200, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  } catch (err: any) {
    console.log("🔥 ERROR inside route:", err.message);

    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }
}

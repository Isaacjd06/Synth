import { NextResponse } from "next/server";

export async function GET() {
  try {
    const url = process.env.N8N_API_URL;
    const key = process.env.N8N_API_KEY;

    console.log("DEBUG → Attempting fetch:", url);

    const res = await fetch(url + "/workflows", {
      headers: {
        "X-N8N-API-KEY": key ?? "",
      },
    });

    const text = await res.text();

    return NextResponse.json({
      ok: true,
      status: res.status,
      url,
      key_present: !!key,
      body: text,
    });
  } catch (err: any) {
    return NextResponse.json({
      ok: false,
      error: err.message,
      stack: err.stack,
      url: process.env.N8N_API_URL,
      key_present: !!process.env.N8N_API_KEY,
    });
  }
}

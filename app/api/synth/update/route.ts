import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/synth/update - Fetch latest synth update
export async function GET() {
  try {
    // Fetch the first user
    const user = await prisma.user.findFirst()

    if (!user) {
      return NextResponse.json({
        success: false,
        error: "No users found in database.",
      })
    }

    // Fetch the latest synth update for this user
    const latestUpdate = await prisma.synthUpdates.findFirst({
      where: { user_id: user.id },
      orderBy: { created_at: "desc" },
    })

    if (!latestUpdate) {
      return NextResponse.json({
        success: true,
        update: null,
        message: "No synth updates found yet.",
      })
    }

    return NextResponse.json({
      success: true,
      update: latestUpdate,
    })
  } catch (error: any) {
    console.error("❌ Error in GET /api/synth/update:", error)
    return NextResponse.json({
      success: false,
      error: error.message || "Internal Server Error",
    })
  }
}

// POST /api/synth/update
export async function POST() {
  try {
    // 🧠 1️⃣ Fetch the first user and all related data
    const user = await prisma.user.findFirst({
      include: {
        workflows: { include: { executions: true } },
        connections: true,
        memory: true,
        chatMessages: true,
      },
    })

    // Handle no users found
    if (!user) {
      return NextResponse.json({
        success: false,
        error: "No users found in database.",
      })
    }

    // 🧩 2️⃣ Build snapshot of what Synth 'knows' about the user
    const snapshot = {
      name: user.name,
      email: user.email,
      workflowCount: user.workflows.length,
      executionCount: user.workflows.reduce(
        (sum, w) => sum + w.executions.length,
        0
      ),
      connectionCount: user.connections.length,
      memoryCount: user.memory.length,
      chatCount: user.chatMessages.length,
      workflowNames: user.workflows.map((w) => w.name),
      connectionNames: user.connections.map((c) => c.service_name),
      memoryKeys: user.memory.map((m) => m.key),
    }

    // 🧠 3️⃣ Create a readable summary string
    const definedWorkflows = snapshot.workflowNames.filter(
      (name) => name && name.trim().length > 0
    )

    const summary = `
🧠 Synth Updates:
You have ${definedWorkflows.length || 0} workflow${definedWorkflows.length === 1 ? "" : "s"} set up and ready.

${
  snapshot.connectionCount === 0
    ? "Connect your favorite apps to unlock Synth's full potential."
    : `You have ${snapshot.connectionCount} app connection${snapshot.connectionCount === 1 ? "" : "s"} linked.`
}

${
  definedWorkflows.length > 0
    ? `Your active workflow${definedWorkflows.length === 1 ? "" : "s"}: ${definedWorkflows.join(", ")}.`
    : "No active workflows yet."
}
`

    // 🧩 4️⃣ Save the update to the SynthUpdates table
    const update = await prisma.synthUpdates.create({
      data: {
        user_id: user.id,
        summary,
        insights: snapshot,
      },
    })

    // 🧠 5️⃣ Return success JSON
    return NextResponse.json({
      success: true,
      message: "Synth Updates generated successfully.",
      update,
    })
  } catch (error: any) {
    console.error("❌ Error in /api/synth/update:", error)
    return NextResponse.json({
      success: false,
      error: error.message || "Internal Server Error",
    })
  }
}

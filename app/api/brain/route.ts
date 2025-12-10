import { NextResponse } from "next/server";
import { authenticateAndCheckSubscription } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { fetchKnowledgeContext, formatKnowledgeContextForPrompt } from "@/lib/knowledge-context";
import { getRelevantMemories, formatMemoriesForContext } from "@/lib/memory";
import { BRANDING_INSTRUCTIONS } from "@/lib/ai-branding";
import { SYNTH_IDENTITY } from "@/lib/synth-identity";
import { logError } from "@/lib/error-logger";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

interface BrainRequestBody {
  message: string;
  context?: {
    analyzeStats?: boolean;
    analyzeWorkflows?: boolean;
    provideStrategy?: boolean;
  };
}

/**
 * Fetches analytics and statistics for the user
 */
async function fetchAnalyticsData(userId: string) {
  try {
    // Get workflow statistics
    const workflows = await prisma.workflows.findMany({
      where: { user_id: userId },
      include: {
        executions: {
          orderBy: { created_at: "desc" },
          take: 100,
        },
      },
    });

    // Calculate execution statistics
    const totalExecutions = await prisma.executions.count({
      where: { user_id: userId },
    });

    const executionsLast24h = await prisma.executions.count({
      where: {
        user_id: userId,
        created_at: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    });

    const successExecutions = await prisma.executions.count({
      where: {
        user_id: userId,
        status: "success",
      },
    });

    const failedExecutions = await prisma.executions.count({
      where: {
        user_id: userId,
        status: "error",
      },
    });

    const successRate = totalExecutions > 0 ? (successExecutions / totalExecutions) * 100 : 0;

    // Get workflow performance metrics
    const workflowStats = workflows.map((workflow) => {
      const executions = workflow.executions;
      const workflowSuccessRate =
        executions.length > 0
          ? (executions.filter((e) => e.status === "success").length / executions.length) * 100
          : 0;
      const lastExecuted = executions[0]?.created_at || null;

      return {
        id: workflow.id,
        name: workflow.name,
        status: workflow.status,
        totalExecutions: executions.length,
        successRate: workflowSuccessRate,
        lastExecuted,
      };
    });

    return {
      workflows: {
        total: workflows.length,
        active: workflows.filter((w) => w.status === "active").length,
        inactive: workflows.filter((w) => w.status === "inactive").length,
        stats: workflowStats,
      },
      executions: {
        total: totalExecutions,
        last24h: executionsLast24h,
        successful: successExecutions,
        failed: failedExecutions,
        successRate: successRate.toFixed(1),
      },
    };
  } catch (error) {
    logError("app/api/brain (fetchAnalyticsData)", error);
    return null;
  }
}

/**
 * Generates strategic analysis using OpenAI
 */
async function generateBrainResponse(
  message: string,
  knowledgeContext: string,
  memoryContext: string,
  analyticsData: any,
  context?: BrainRequestBody["context"]
): Promise<{ ok: boolean; response?: any; error?: string }> {
  if (!OPENAI_API_KEY) {
    return {
      ok: false,
      error: "OPENAI_API_KEY is not configured",
    };
  }

  // Build analytics context
  let analyticsContext = "";
  if (analyticsData) {
    analyticsContext = `
## ANALYTICS & STATISTICS

### Workflow Performance
- Total Workflows: ${analyticsData.workflows.total}
- Active Workflows: ${analyticsData.workflows.active}
- Inactive Workflows: ${analyticsData.workflows.inactive}

### Execution Statistics
- Total Executions: ${analyticsData.executions.total}
- Executions (Last 24h): ${analyticsData.executions.last24h}
- Success Rate: ${analyticsData.executions.successRate}%
- Successful: ${analyticsData.executions.successful}
- Failed: ${analyticsData.executions.failed}

### Individual Workflow Performance
${analyticsData.workflows.stats
  .map(
    (w: any) =>
      `- ${w.name}: ${w.totalExecutions} executions, ${w.successRate.toFixed(1)}% success rate${w.lastExecuted ? `, last executed: ${new Date(w.lastExecuted).toLocaleDateString()}` : ""}`
  )
  .join("\n")}
`;
  }

  // Build system prompt
  const systemPrompt = `${SYNTH_IDENTITY}

${BRANDING_INSTRUCTIONS}

## YOUR SPECIFIC ROLE AS SYNTH'S BRAIN

Your role:
- Analyze workflow performance, execution statistics, and business metrics USING knowledge base frameworks
- Provide strategic business advice HEAVILY RELYING on your knowledge base expertise
- Identify patterns, bottlenecks, and opportunities using knowledge base methodologies
- Recommend actions to optimize workflows and business processes based on knowledge base best practices
- Think critically about business challenges and propose solutions grounded in knowledge base principles

## KNOWLEDGE BASE - YOUR PRIMARY SOURCE OF EXPERTISE
${knowledgeContext ? knowledgeContext : "Loading knowledge base..."}

${memoryContext ? `\n\n## MEMORY CONTEXT\n${memoryContext}\n\n` : ""}${analyticsContext ? `\n\n## ANALYTICS DATA\n${analyticsContext}\n\n` : ""}

CRITICAL INSTRUCTIONS:
1. HEAVILY RELY on your knowledge base - it is your PRIMARY source of business expertise
2. Always base recommendations on knowledge base frameworks, methodologies, and best practices
3. Reference specific knowledge base concepts, frameworks, or principles in your analysis
4. Apply knowledge base insights to interpret data and statistics
5. Use knowledge base terminology and methodologies consistently
6. Ground all strategic thinking in knowledge base principles
7. Be specific and actionable - cite knowledge base sources when relevant
8. Think strategically about long-term business impact using knowledge base frameworks
9. Consider both immediate fixes and strategic improvements based on knowledge base guidance
10. Never mention technical backends or AI providers
11. Speak as Synth itself - you ARE Synth's intelligence

Return a JSON object with this structure:
{
  "reply": "Natural language response with strategic analysis and recommendations",
  "insights": ["Key insight 1", "Key insight 2", ...],
  "recommendations": ["Actionable recommendation 1", "Actionable recommendation 2", ...],
  "concerns": ["Any concerns or issues identified", ...],
  "opportunities": ["Opportunities for improvement", ...]
}`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        ok: false,
        error: `OpenAI API error: ${errorData.error?.message || response.statusText}`,
      };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return {
        ok: false,
        error: "No response from OpenAI API",
      };
    }

    try {
      const parsed = JSON.parse(content);
      return {
        ok: true,
        response: parsed,
      };
    } catch (parseError) {
      // If parsing fails, return as plain text response
      return {
        ok: true,
        response: {
          reply: content,
          insights: [],
          recommendations: [],
          concerns: [],
          opportunities: [],
        },
      };
    }
  } catch (error: unknown) {
    logError("app/api/brain (generateBrainResponse)", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to generate response",
    };
  }
}

export async function POST(req: Request) {
  try {
    const authResult = await authenticateAndCheckSubscription();
    if (authResult instanceof NextResponse) {
      return authResult; // Returns 401 or 403
    }
    const { userId } = authResult;

    const body = (await req.json()) as BrainRequestBody;
    const { message, context } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    // 1. Fetch knowledge base context (user-specific + hardcoded)
    const knowledgeContextData = await fetchKnowledgeContext(userId);
    const knowledgeContext = formatKnowledgeContextForPrompt(knowledgeContextData, true);

    // 2. Fetch relevant memories
    const relevantMemories = await getRelevantMemories(userId, undefined, 10);
    const memoryContext = formatMemoriesForContext(relevantMemories);

    // 3. Fetch analytics and statistics
    const analyticsData = await fetchAnalyticsData(userId);

    // 4. Generate strategic brain response
    const brainResponse = await generateBrainResponse(
      message,
      knowledgeContext,
      memoryContext,
      analyticsData,
      context
    );

    if (!brainResponse.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: brainResponse.error,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        data: brainResponse.response,
        analytics: analyticsData,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    logError("app/api/brain", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

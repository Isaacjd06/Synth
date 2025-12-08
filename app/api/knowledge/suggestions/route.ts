import { NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/knowledge/suggestions
 * Generate AI-powered suggestions for improving knowledge base
 */
export async function GET() {
  try {
    const authResult = await authenticateUser();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { userId } = authResult;

    const suggestions = [];

    // 1. Check for undefined terms in unstructured knowledge
    const unstructuredKnowledge = await prisma.knowledge.findMany({
      where: {
        user_id: userId,
        type: { in: ["text", "markdown"] },
        content: { not: null },
      },
      select: { content: true },
    });

    // Extract potential terms (simple pattern matching for acronyms and capitalized terms)
    const potentialTerms = new Set<string>();
    unstructuredKnowledge.forEach((item) => {
      if (item.content) {
        // Find acronyms (2-5 uppercase letters)
        const acronyms = item.content.match(/\b[A-Z]{2,5}\b/g);
        if (acronyms) {
          acronyms.forEach((term) => potentialTerms.add(term));
        }
      }
    });

    // Check which terms are not in glossary
    const glossaryTerms = await prisma.glossary.findMany({
      where: { user_id: userId },
      select: { term: true },
    });

    const definedTerms = new Set(glossaryTerms.map((g) => g.term.toUpperCase()));
    const undefinedTerms = Array.from(potentialTerms).filter(
      (term) => !definedTerms.has(term.toUpperCase())
    );

    if (undefinedTerms.length > 0) {
      suggestions.push({
        id: `glossary-${Date.now()}`,
        type: "definition",
        title: `Define ${undefinedTerms.slice(0, 3).join(", ")} in your glossary`,
        description: `You mentioned ${undefinedTerms.length > 1 ? "these terms" : "this term"} in your notes but ${undefinedTerms.length > 1 ? "haven't defined them" : "haven't defined it"}.`,
        actionLabel: "Add Definition",
        priority: "medium",
      });
    }

    // 2. Check for tools mentioned but not connected
    const structuredKnowledge = await prisma.structured_knowledge.findMany({
      where: {
        user_id: userId,
        type: "tool",
      },
      select: { data: true },
    });

    const mentionedTools = new Set<string>();
    structuredKnowledge.forEach((item) => {
      if (item.data && typeof item.data === "object" && "name" in item.data) {
        mentionedTools.add(String(item.data.name));
      }
    });

    // Check which tools are not connected
    const connections = await prisma.connections.findMany({
      where: {
        user_id: userId,
        status: "active",
      },
      select: { service_name: true },
    });

    const connectedTools = new Set(connections.map((c) => c.service_name));
    const unconnectedTools = Array.from(mentionedTools).filter(
      (tool) => !connectedTools.has(tool)
    );

    if (unconnectedTools.length > 0) {
      suggestions.push({
        id: `connection-${Date.now()}`,
        type: "connection",
        title: `Connect ${unconnectedTools.slice(0, 2).join(" and ")}`,
        description: `You listed ${unconnectedTools.length > 1 ? "these tools" : "this tool"} but ${unconnectedTools.length > 1 ? "haven't connected them" : "haven't connected it"}. Connect to enable automations.`,
        actionLabel: "Go to Connections",
        actionLink: "/settings/connections",
        priority: "medium",
      });
    }

    // 3. Check for missing business rules
    const businessRules = await prisma.business_rules.findMany({
      where: { user_id: userId },
    });

    if (businessRules.length === 0) {
      suggestions.push({
        id: `rules-${Date.now()}`,
        type: "rule",
        title: "Add your first business rule",
        description: "Business rules help Synth understand constraints and guidelines for your automations.",
        actionLabel: "Add Rule",
        priority: "low",
      });
    }

    // 4. Check for workflows that could benefit from knowledge
    const workflows = await prisma.workflows.findMany({
      where: {
        user_id: userId,
        active: true,
      },
      select: { id: true, name: true, intent: true },
    });

    const knowledgeCount = await prisma.knowledge.count({
      where: { user_id: userId },
    });

    if (workflows.length > 0 && knowledgeCount === 0) {
      suggestions.push({
        id: `knowledge-${Date.now()}`,
        type: "workflow",
        title: "Add knowledge to improve workflow context",
        description: "Your workflows could be more effective with business knowledge. Add processes, guidelines, or context.",
        actionLabel: "Add Knowledge",
        actionLink: "/knowledge",
        priority: "medium",
      });
    }

    // 5. Check for incomplete structured knowledge
    const companyInfo = await prisma.structured_knowledge.findFirst({
      where: {
        user_id: userId,
        type: "company_info",
      },
    });

    if (!companyInfo) {
      suggestions.push({
        id: `company-${Date.now()}`,
        type: "definition",
        title: "Complete your company profile",
        description: "Adding company information helps Synth create more contextual workflows.",
        actionLabel: "Add Company Info",
        priority: "low",
      });
    }

    return NextResponse.json({
      ok: true,
      suggestions: suggestions.slice(0, 10), // Limit to 10 suggestions
    });
  } catch (error: unknown) {
    console.error("KNOWLEDGE SUGGESTIONS ERROR:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Internal server error",
        suggestions: [],
      },
      { status: 500 }
    );
  }
}


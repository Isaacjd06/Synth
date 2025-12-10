import { prisma } from "@/lib/prisma";
import { formatHardcodedKnowledgeForPrompt } from "@/lib/hardcoded-knowledge";

/**
 * Knowledge base context for AI workflow generation and general intelligence
 */
export interface KnowledgeContext {
  businessRules: Array<{ content: string; priority: string }>;
  glossary: Array<{ term: string; definition: string }>;
  companyInfo: {
    companyName?: string;
    industry?: string;
    targetCustomer?: string;
    keyMetrics?: string;
    objectives?: string;
  } | null;
  products: Array<{ name: string; description: string; pricing: string; delivery: string }>;
  teamMembers: Array<{ name: string; role: string; responsibilities: string }>;
  tools: string[];
  unstructuredKnowledge: Array<{ title: string; content: string; type: string }>;
}

/**
 * Fetches all knowledge base data for a user to provide context to AI
 */
export async function fetchKnowledgeContext(userId: string): Promise<KnowledgeContext> {
  try {
    // Fetch all knowledge base data in parallel
    const [
      businessRules,
      glossary,
      structuredKnowledge,
      unstructuredKnowledge,
    ] = await Promise.all([
      // Business rules
      prisma.business_rules.findMany({
        where: { user_id: userId },
        orderBy: { priority: "desc" },
        select: { content: true, priority: true },
      }),

      // Glossary
      prisma.glossary.findMany({
        where: { user_id: userId },
        orderBy: { term: "asc" },
        select: { term: true, definition: true },
      }),

      // Structured knowledge
      prisma.structured_knowledge.findMany({
        where: { user_id: userId },
        select: { type: true, data: true },
      }),

      // Unstructured knowledge (text, markdown, etc.)
      prisma.knowledge.findMany({
        where: {
          user_id: userId,
          type: { in: ["text", "markdown"] },
          content: { not: null },
        },
        select: { title: true, content: true, type: true },
        take: 20, // Limit to most recent 20 items
      }),
    ]);

    // Process structured knowledge
    const companyInfo = structuredKnowledge
      .find((item) => item.type === "company_info")
      ?.data as KnowledgeContext["companyInfo"] || null;

    const products = structuredKnowledge
      .filter((item) => item.type === "product")
      .map((item) => item.data as KnowledgeContext["products"][0]);

    const teamMembers = structuredKnowledge
      .filter((item) => item.type === "team_member")
      .map((item) => item.data as KnowledgeContext["teamMembers"][0]);

    const tools = structuredKnowledge
      .filter((item) => item.type === "tool")
      .map((item) => {
        const data = item.data as { name?: string };
        return data.name || "";
      })
      .filter(Boolean);

    return {
      businessRules: businessRules.map((r) => ({
        content: r.content,
        priority: r.priority,
      })),
      glossary: glossary.map((g) => ({
        term: g.term,
        definition: g.definition,
      })),
      companyInfo,
      products,
      teamMembers,
      tools,
      unstructuredKnowledge: unstructuredKnowledge
        .filter((k) => k.content)
        .map((k) => ({
          title: k.title,
          content: k.content || "",
          type: k.type,
        })),
    };
  } catch (error) {
    console.error("Error fetching knowledge context:", error);
    // Return empty context on error
    return {
      businessRules: [],
      glossary: [],
      companyInfo: null,
      products: [],
      teamMembers: [],
      tools: [],
      unstructuredKnowledge: [],
    };
  }
}

/**
 * Formats knowledge context into a string for AI prompts
 * Includes both user-specific knowledge and universal hardcoded knowledge
 */
export function formatKnowledgeContextForPrompt(context: KnowledgeContext, includeHardcoded: boolean = true): string {
  const sections: string[] = [];

  // Add hardcoded universal knowledge first - THIS IS MANDATORY AND PRIMARY
  if (includeHardcoded) {
    const hardcodedKnowledge = formatHardcodedKnowledgeForPrompt();
    if (hardcodedKnowledge) {
      sections.push('═══════════════════════════════════════════════════════════');
      sections.push('PRIMARY KNOWLEDGE SOURCE - SYNTH\'S BUSINESS EXPERTISE');
      sections.push('═══════════════════════════════════════════════════════════');
      sections.push('');
      sections.push(hardcodedKnowledge);
      sections.push('');
      sections.push('═══════════════════════════════════════════════════════════');
      sections.push('USER-SPECIFIC BUSINESS CONTEXT (in addition to knowledge base above)');
      sections.push('═══════════════════════════════════════════════════════════');
      sections.push('');
    }
  }

  // Company Information
  if (context.companyInfo) {
    sections.push("## COMPANY INFORMATION");
    if (context.companyInfo.companyName) {
      sections.push(`Company Name: ${context.companyInfo.companyName}`);
    }
    if (context.companyInfo.industry) {
      sections.push(`Industry: ${context.companyInfo.industry}`);
    }
    if (context.companyInfo.targetCustomer) {
      sections.push(`Target Customer: ${context.companyInfo.targetCustomer}`);
    }
    if (context.companyInfo.keyMetrics) {
      sections.push(`Key Metrics: ${context.companyInfo.keyMetrics}`);
    }
    if (context.companyInfo.objectives) {
      sections.push(`Objectives: ${context.companyInfo.objectives}`);
    }
    sections.push("");
  }

  // Business Rules
  if (context.businessRules.length > 0) {
    sections.push("## BUSINESS RULES (MUST FOLLOW)");
    sections.push("These are strict constraints that MUST be obeyed:");
    context.businessRules.forEach((rule, index) => {
      sections.push(`${index + 1}. [${rule.priority.toUpperCase()}] ${rule.content}`);
    });
    sections.push("");
  }

  // Glossary
  if (context.glossary.length > 0) {
    sections.push("## GLOSSARY");
    sections.push("Term definitions specific to this business:");
    context.glossary.forEach((entry) => {
      sections.push(`- ${entry.term}: ${entry.definition}`);
    });
    sections.push("");
  }

  // Products
  if (context.products.length > 0) {
    sections.push("## PRODUCTS/SERVICES");
    context.products.forEach((product) => {
      sections.push(`- ${product.name}: ${product.description}`);
      if (product.pricing) sections.push(`  Pricing: ${product.pricing}`);
      if (product.delivery) sections.push(`  Delivery: ${product.delivery}`);
    });
    sections.push("");
  }

  // Team Members
  if (context.teamMembers.length > 0) {
    sections.push("## TEAM STRUCTURE");
    context.teamMembers.forEach((member) => {
      sections.push(`- ${member.name} (${member.role}): ${member.responsibilities}`);
    });
    sections.push("");
  }

  // Tools
  if (context.tools.length > 0) {
    sections.push("## AVAILABLE TOOLS/INTEGRATIONS");
    sections.push(`Connected tools: ${context.tools.join(", ")}`);
    sections.push("");
  }

  // Unstructured Knowledge
  if (context.unstructuredKnowledge.length > 0) {
    sections.push("## ADDITIONAL CONTEXT");
    context.unstructuredKnowledge.forEach((knowledge) => {
      sections.push(`### ${knowledge.title}`);
      sections.push(knowledge.content.substring(0, 500)); // Limit length
      sections.push("");
    });
  }

  return sections.join("\n");
}


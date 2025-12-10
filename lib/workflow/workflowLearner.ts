/**
 * Workflow Learning Service
 * 
 * Analyzes manually created workflows to extract patterns and learn from them.
 * This knowledge is then used to improve AI workflow generation.
 */

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export interface WorkflowPattern {
  type: 'trigger' | 'action' | 'workflow_structure' | 'app_combination';
  name: string;
  description?: string;
  data: Record<string, unknown>;
  tags: string[];
}

/**
 * Analyzes a workflow and extracts learnable patterns
 */
export async function learnFromWorkflow(
  workflowId: string,
  userId: string,
  workflowData: {
    name: string;
    description?: string | null;
    intent?: string | null;
    trigger?: Prisma.InputJsonValue | null;
    actions?: Prisma.InputJsonValue | null;
    created_by_ai?: boolean;
  }
): Promise<void> {
  // Skip learning from AI-generated workflows to avoid circular learning
  if (workflowData.created_by_ai) {
    return;
  }

  try {
    const patterns = extractPatterns(workflowData);
    
    // Store each pattern
    for (const pattern of patterns) {
      await storePattern(userId, workflowId, workflowData.name, pattern);
    }

    console.log(`[WorkflowLearner] Learned ${patterns.length} patterns from workflow ${workflowId}`);
  } catch (error) {
    console.error(`[WorkflowLearner] Error learning from workflow ${workflowId}:`, error);
    // Don't throw - learning failures shouldn't break workflow creation
  }
}

/**
 * Extracts patterns from a workflow structure
 */
function extractPatterns(workflowData: {
  name: string;
  description?: string | null;
  intent?: string | null;
  trigger?: Prisma.InputJsonValue | null;
  actions?: Prisma.InputJsonValue | null;
}): WorkflowPattern[] {
  const patterns: WorkflowPattern[] = [];

  // Extract trigger pattern
  if (workflowData.trigger && typeof workflowData.trigger === 'object') {
    const trigger = workflowData.trigger as Record<string, unknown>;
    if (trigger.type && trigger.app) {
      patterns.push({
        type: 'trigger',
        name: `${trigger.app}_${trigger.type}_trigger`,
        description: `Trigger pattern: ${trigger.app} ${trigger.type}`,
        data: trigger,
        tags: extractTags(workflowData, ['trigger', trigger.app as string, trigger.type as string]),
      });
    }
  }

  // Extract action patterns
  if (workflowData.actions && Array.isArray(workflowData.actions)) {
    workflowData.actions.forEach((action, index) => {
      if (action && typeof action === 'object') {
        const actionObj = action as Record<string, unknown>;
        if (actionObj.type || actionObj.app) {
          patterns.push({
            type: 'action',
            name: `${actionObj.app || 'unknown'}_${actionObj.type || 'action'}_${index}`,
            description: `Action pattern: ${actionObj.app} ${actionObj.type}`,
            data: actionObj,
            tags: extractTags(workflowData, ['action', actionObj.app as string, actionObj.type as string]),
          });
        }
      }
    });
  }

  // Extract app combination pattern
  const apps = extractApps(workflowData);
  if (apps.length > 1) {
    patterns.push({
      type: 'app_combination',
      name: `app_combination_${apps.sort().join('_')}`,
      description: `Common app combination: ${apps.join(' + ')}`,
      data: { apps, count: apps.length },
      tags: extractTags(workflowData, ['combination', ...apps]),
    });
  }

  // Extract workflow structure pattern
  if (workflowData.intent || workflowData.description) {
    patterns.push({
      type: 'workflow_structure',
      name: `workflow_structure_${workflowData.intent || 'general'}`,
      description: `Workflow structure for: ${workflowData.intent || workflowData.name}`,
      data: {
        intent: workflowData.intent,
        hasDescription: !!workflowData.description,
        triggerType: workflowData.trigger && typeof workflowData.trigger === 'object' 
          ? (workflowData.trigger as Record<string, unknown>).type 
          : null,
        actionCount: Array.isArray(workflowData.actions) ? workflowData.actions.length : 0,
      },
      tags: extractTags(workflowData, ['structure', workflowData.intent as string]),
    });
  }

  return patterns;
}

/**
 * Extracts tags from workflow data
 */
function extractTags(
  workflowData: {
    name: string;
    description?: string | null;
    intent?: string | null;
  },
  baseTags: string[]
): string[] {
  const tags = [...baseTags];

  // Add intent as tag
  if (workflowData.intent) {
    tags.push(workflowData.intent);
  }

  // Extract keywords from name and description
  const text = `${workflowData.name} ${workflowData.description || ''}`.toLowerCase();
  const keywords = ['email', 'slack', 'notification', 'schedule', 'webhook', 'automation', 'sync', 'data'];
  keywords.forEach(keyword => {
    if (text.includes(keyword)) {
      tags.push(keyword);
    }
  });

  return [...new Set(tags)]; // Remove duplicates
}

/**
 * Extracts unique apps from workflow
 */
function extractApps(workflowData: {
  trigger?: Prisma.InputJsonValue | null;
  actions?: Prisma.InputJsonValue | null;
}): string[] {
  const apps = new Set<string>();

  // Extract from trigger
  if (workflowData.trigger && typeof workflowData.trigger === 'object') {
    const trigger = workflowData.trigger as Record<string, unknown>;
    if (trigger.app && typeof trigger.app === 'string') {
      apps.add(trigger.app);
    }
  }

  // Extract from actions
  if (workflowData.actions && Array.isArray(workflowData.actions)) {
    workflowData.actions.forEach(action => {
      if (action && typeof action === 'object') {
        const actionObj = action as Record<string, unknown>;
        if (actionObj.app && typeof actionObj.app === 'string') {
          apps.add(actionObj.app);
        }
      }
    });
  }

  return Array.from(apps);
}

/**
 * Stores a learned pattern in the database
 */
async function storePattern(
  userId: string,
  sourceWorkflowId: string,
  sourceWorkflowName: string,
  pattern: WorkflowPattern
): Promise<void> {
  // Check if similar pattern already exists
  const existing = await prisma.workflow_learned_patterns.findFirst({
    where: {
      user_id: userId,
      pattern_type: pattern.type,
      pattern_name: pattern.name,
    },
  });

  if (existing) {
    // Update existing pattern - increment usage count
    await prisma.workflow_learned_patterns.update({
      where: { id: existing.id },
      data: {
        usage_count: existing.usage_count + 1,
        last_used_at: new Date(),
        updated_at: new Date(),
        // Merge tags
        tags: [...new Set([...existing.tags, ...pattern.tags])],
        // Update confidence based on usage
        confidence_score: Math.min(0.95, existing.confidence_score + 0.05),
      },
    });
  } else {
    // Create new pattern
    await prisma.workflow_learned_patterns.create({
      data: {
        user_id: userId,
        pattern_type: pattern.type,
        pattern_name: pattern.name,
        pattern_description: pattern.description,
        extracted_data: pattern.data as Prisma.InputJsonValue,
        source_workflow_id: sourceWorkflowId,
        source_workflow_name: sourceWorkflowName,
        tags: pattern.tags,
        usage_count: 1,
        confidence_score: 0.5,
        last_used_at: new Date(),
      },
    });
  }
}

/**
 * Retrieves learned patterns for a user, optionally filtered by type or tags
 */
export async function getLearnedPatterns(
  userId: string,
  options?: {
    patternType?: 'trigger' | 'action' | 'workflow_structure' | 'app_combination';
    tags?: string[];
    limit?: number;
    minConfidence?: number;
  }
): Promise<Array<{
  type: string;
  name: string;
  description: string | null;
  data: unknown;
  tags: string[];
  usageCount: number;
  confidenceScore: number;
}>> {
  const where: Prisma.workflow_learned_patternsWhereInput = {
    user_id: userId,
  };

  if (options?.patternType) {
    where.pattern_type = options.patternType;
  }

  if (options?.tags && options.tags.length > 0) {
    where.tags = { hasSome: options.tags };
  }

  if (options?.minConfidence !== undefined) {
    where.confidence_score = { gte: options.minConfidence };
  }

  const patterns = await prisma.workflow_learned_patterns.findMany({
    where,
    orderBy: [
      { confidence_score: 'desc' },
      { usage_count: 'desc' },
    ],
    take: options?.limit || 50,
    select: {
      pattern_type: true,
      pattern_name: true,
      pattern_description: true,
      extracted_data: true,
      tags: true,
      usage_count: true,
      confidence_score: true,
    },
  });

  return patterns.map(p => ({
    type: p.pattern_type,
    name: p.pattern_name,
    description: p.pattern_description,
    data: p.extracted_data,
    tags: p.tags,
    usageCount: p.usage_count,
    confidenceScore: p.confidence_score,
  }));
}

/**
 * Formats learned patterns for AI context
 */
export function formatLearnedPatternsForPrompt(patterns: Array<{
  type: string;
  name: string;
  description: string | null;
  data: unknown;
  tags: string[];
  usageCount: number;
  confidenceScore: number;
}>): string {
  if (patterns.length === 0) {
    return '';
  }

  const sections: string[] = [];
  sections.push('## LEARNED WORKFLOW PATTERNS');
  sections.push('The following patterns have been learned from manually created workflows. Use these as examples when generating new workflows:');
  sections.push('');

  // Group by type
  const byType = patterns.reduce((acc, pattern) => {
    if (!acc[pattern.type]) {
      acc[pattern.type] = [];
    }
    acc[pattern.type].push(pattern);
    return acc;
  }, {} as Record<string, typeof patterns>);

  for (const [type, typePatterns] of Object.entries(byType)) {
    sections.push(`### ${type.toUpperCase().replace('_', ' ')} Patterns`);
    
    typePatterns.slice(0, 5).forEach(pattern => {
      sections.push(`- **${pattern.name}** (used ${pattern.usageCount}x, confidence: ${(pattern.confidenceScore * 100).toFixed(0)}%)`);
      if (pattern.description) {
        sections.push(`  ${pattern.description}`);
      }
      sections.push(`  Pattern data: ${JSON.stringify(pattern.data, null, 2).substring(0, 200)}...`);
    });
    
    sections.push('');
  }

  return sections.join('\n');
}


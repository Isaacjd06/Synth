# Workflow Learning System

## Overview

The Workflow Learning System enables Synth to learn from manually created workflows and improve AI workflow generation over time. When a user manually creates a workflow, the system analyzes it, extracts patterns, and stores this knowledge for future AI workflow generation.

## Architecture

### Components

1. **Database Schema** (`prisma/schema.prisma`)
   - `workflow_learned_patterns` table: Stores extracted patterns from workflows
   - `workflows.created_by_ai` field: Tracks whether a workflow was AI-generated (to avoid circular learning)

2. **Workflow Learner Service** (`lib/workflow/workflowLearner.ts`)
   - Analyzes workflows and extracts patterns:
     - **Trigger patterns**: Common trigger configurations (e.g., Gmail webhook, scheduled cron)
     - **Action patterns**: Common action configurations (e.g., Slack message, email send)
     - **App combinations**: Frequently used app combinations (e.g., Gmail + Slack)
     - **Workflow structures**: Overall workflow patterns based on intent
   - Stores patterns with usage counts and confidence scores
   - Provides functions to retrieve and format patterns for AI context

3. **Integration Points**
   - **Workflow Creation** (`app/api/workflows/create/route.ts`): 
     - Accepts `created_by_ai` flag
     - Triggers learning for manually created workflows (async, non-blocking)
   - **Workflow Generation** (`app/api/workflows/generate/route.ts`):
     - Marks AI-generated workflows with `created_by_ai: true`
   - **AI Generation** (`lib/ai.ts`):
     - Fetches learned patterns for the user
     - Includes patterns in AI prompts to guide workflow generation

## How It Works

### 1. Pattern Extraction

When a user manually creates a workflow:

```typescript
// In app/api/workflows/create/route.ts
if (!created_by_ai) {
  learnFromWorkflow(workflowId, userId, workflowData)
    .catch(error => {
      console.error("Failed to learn from workflow:", error);
    });
}
```

The learner extracts:
- **Trigger patterns**: Type, app, and configuration
- **Action patterns**: Each action's type, app, operation, and config
- **App combinations**: Which apps are commonly used together
- **Workflow structures**: Intent-based patterns

### 2. Pattern Storage

Patterns are stored with:
- `usage_count`: How many times this pattern has been seen
- `confidence_score`: Confidence in the pattern (increases with usage)
- `tags`: Keywords for filtering and matching
- `extracted_data`: The actual pattern data (JSON)

If a similar pattern already exists, it's updated (usage count incremented, confidence increased).

### 3. Pattern Retrieval for AI

When generating a workflow with AI:

```typescript
// In lib/ai.ts
const patterns = await getLearnedPatterns(userId, {
  minConfidence: 0.3,
  limit: 20,
});
learnedPatternsContext = formatLearnedPatternsForPrompt(patterns);
```

The patterns are formatted and included in the AI system prompt, guiding the AI to:
- Prefer frequently used patterns
- Use high-confidence patterns as templates
- Combine learned patterns when appropriate
- Adapt patterns to fit specific requirements

## Database Schema

```prisma
model workflow_learned_patterns {
  id                    String   @id @default(uuid())
  user_id               String?
  pattern_type          String   // 'trigger', 'action', 'workflow_structure', 'app_combination'
  pattern_name          String
  pattern_description   String?
  extracted_data        Json
  source_workflow_id    String?
  source_workflow_name  String?
  usage_count           Int      @default(1)
  confidence_score      Float    @default(0.5)
  tags                  String[]
  created_at            DateTime @default(now())
  updated_at            DateTime @updatedAt
  last_used_at          DateTime?
  workflows             workflows? @relation(...)
}
```

## Usage

### Learning from Manual Workflows

Automatically happens when:
- User creates a workflow via `/api/workflows/create` without `created_by_ai: true`
- Workflow is successfully created and validated

### Using Learned Patterns

Automatically happens when:
- User generates a workflow via `/api/workflows/generate`
- AI includes learned patterns in the generation prompt

### Manual Pattern Retrieval

```typescript
import { getLearnedPatterns } from "@/lib/workflow/workflowLearner";

const patterns = await getLearnedPatterns(userId, {
  patternType: 'trigger',
  tags: ['gmail', 'email'],
  minConfidence: 0.7,
  limit: 10,
});
```

## Benefits

1. **Personalization**: AI learns each user's workflow preferences
2. **Improvement Over Time**: More workflows = better pattern recognition
3. **Context-Aware**: Patterns are user-specific, respecting individual preferences
4. **Non-Intrusive**: Learning happens asynchronously, doesn't slow down workflow creation
5. **Avoids Circular Learning**: AI-generated workflows are excluded from learning

## Future Enhancements

- Pattern similarity matching for better pattern consolidation
- Cross-user pattern sharing (with privacy controls)
- Pattern expiration/decay for outdated patterns
- Pattern validation and quality scoring
- Visual pattern analytics dashboard


# Memory Schema

## What is the Memory Table?

The memory table stores long-term user context and reasoning artifacts.

## Purpose

**Primary Function:** Enable Synth to maintain continuity and learn over time.

**Use Cases:**
- Store user preferences
- Save reasoning about past workflows
- Learn user patterns
- Improve future workflow planning
- Maintain context across conversations

## Memory Table Structure

**Table Name:** memory

**Database:** Neon (PostgreSQL)

**ORM:** Prisma

## Fields

### Memory ID
- **Type:** Primary key
- **Purpose:** Unique identifier for each memory entry

### User ID
- **Type:** Foreign key
- **Purpose:** Associates memory with specific user
- **Relationship:** Belongs to one user

### Context Type
- **Type:** String/Enum
- **Purpose:** Categorizes the type of memory
- **Examples:**
  - preference
  - reasoning
  - pattern
  - workflow_decision
  - user_behavior

### Content
- **Type:** Text or JSON
- **Purpose:** The actual memory data
- **Format:** Flexible - can be plain text or structured JSON

### Relevance Score
- **Type:** Number/Float
- **Purpose:** Indicates how relevant this memory is
- **Use:** Helps prioritize which memories to reference

### Created Timestamp
- **Type:** DateTime
- **Purpose:** When the memory was created

### Last Accessed Timestamp
- **Type:** DateTime
- **Purpose:** When the memory was last used
- **Use:** Helps identify stale memories

### Metadata
- **Type:** JSON (optional)
- **Purpose:** Additional information about the memory

## How Memory is Used

### During Workflow Planning
- Synth retrieves relevant memories for the user
- Past workflow decisions inform new workflows
- User preferences guide action selection

### During Conversations
- Memory provides context about user history
- Helps Synth understand user's typical needs
- Enables personalized responses

### For Learning
- Synth stores reasoning about why workflows were created
- Patterns in user behavior are identified and saved
- Future interactions become more intelligent

## Memory Rules

### What to Store
- Long-term context that will be useful in the future
- Reasoning artifacts about workflow decisions
- User preferences and patterns
- Insights about user's automation needs

### What NOT to Store
- Temporary conversation context (use chat_messages instead)
- Sensitive secrets (use secure storage)
- Redundant information
- Irrelevant data

## Writing to Memory

Memory entries are created by:
- Synth AI Brain during conversations
- After significant workflow decisions
- When user preferences are identified
- When patterns emerge

## Reading from Memory

Memory entries are retrieved:
- When planning new workflows
- During conversations for context
- When analyzing user needs
- For personalization

## Memory and Context Preservation

Memory table is one of two context mechanisms:
1. **memory** - Long-term reasoning and artifacts
2. **chat_messages** - Short-term conversation history

Together, these enable Synth to maintain context and learn over time.

## Key Principles

**Long-Term:** Memory is for persistent, long-term context

**User-Specific:** Each user has their own memory space

**Relevant:** Memories have relevance scores for prioritization

**Accessible:** Memories are retrieved when needed for planning

**Intelligent:** Memory enables Synth to improve over time

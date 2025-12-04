# Principles

## Architectural Principles

These are the foundational principles that guide Synth's design and behavior.

## 1. Modular Architecture

**Principle:** Synth is built with clear separation between components.

**Implementation:**
- Database layer (Neon + Prisma)
- AI intelligence layer (Synth brain)
- Execution layer (Pipedream)
- Storage layer (workflows, executions, memory)

**Benefit:** Each component can be modified or replaced without affecting others.

## 2. Intelligence vs Execution Separation

**Principle:** Synth is the intelligence layer, NOT the execution layer.

**What This Means:**
- Synth thinks, plans, and decides
- External engines (Pipedream) execute
- Synth never runs workflows directly

**Benefit:** Allows Synth to focus on AI-driven planning while execution is handled by specialized tools.

## 3. JSON-Based Flexibility

**Principle:** Workflow definitions are JSON-based and flexible.

**Implementation:**
- Triggers are defined in JSON
- Actions are defined in JSON
- New trigger/action types can be added without code changes
- Definitions are engine-agnostic

**Benefit:** System can evolve and support new automation patterns without architectural changes.

## 4. Intent-Driven Interaction

**Principle:** User interactions are conversational and intent-driven.

**Implementation:**
- Users describe what they want in natural language
- Synth interprets intent before technical planning
- No requirement for users to understand technical details

**Benefit:** Makes automation accessible to non-technical users.

## 5. Validation Before Commitment

**Principle:** Always validate capabilities before making promises.

**Implementation:**
- Check if apps are supported before suggesting them
- Verify apps are connected before creating workflows
- Validate workflow logic before storage

**Benefit:** Prevents disappointment and maintains user trust.

## 6. Transparency of Backend Tools

**Principle:** Backend execution tools are NEVER revealed to users.

**Implementation:**
- Never mention Pipedream to users
- Never mention n8n to users
- Present all automation as Synth's capability

**Benefit:** Simple, consistent user experience without implementation confusion.

## 7. Context Preservation

**Principle:** Maintain long-term context and reasoning.

**Implementation:**
- Memory table stores reasoning artifacts
- Chat_messages table enables context reconstruction
- Past workflows inform future planning

**Benefit:** Synth learns user preferences and improves over time.

## 8. Single Source of Truth

**Principle:** Neon database is the single source of truth for all workflow data.

**Implementation:**
- All workflow definitions stored in database
- All execution history logged to database
- Memory and context persisted in database

**Benefit:** Consistent data, audit trail, and easy recovery.

## 9. Type Safety Through Prisma

**Principle:** Use Prisma ORM for type-safe database operations.

**Implementation:**
- All database queries go through Prisma
- Schema is managed by Prisma
- Relationships enforced at ORM level

**Benefit:** Reduces bugs, improves developer experience, ensures data consistency.

## 10. Support Only What Exists

**Principle:** Only mention and offer apps/actions that are actually supported and connected.

**Implementation:**
- Check supported apps list before suggesting
- Verify connection status before workflow creation
- Reject requests for unsupported apps

**Benefit:** Honest, reliable system that doesn't over-promise.

## Summary

These principles ensure Synth is:
- **Modular** - Easy to modify and extend
- **Intelligent** - Focused on AI-driven planning
- **Flexible** - Adaptable to new patterns
- **User-Friendly** - Accessible through natural language
- **Honest** - Only promises what it can deliver
- **Contextual** - Learns and improves over time
- **Reliable** - Single source of truth with type safety

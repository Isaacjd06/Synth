# Architecture Overview

## What is Synth?

Synth is an AI-driven workflow automation system that interprets user intent, creates workflow definitions, stores them, and triggers execution via external automation engines.

## Core Architecture

Synth is built on a modular architecture with the following components:

### Database Layer
- **Database**: Neon (PostgreSQL)
- **ORM**: Prisma
- **Six Main Tables**: users, workflows, executions, connections, memory, chat_messages

### AI Brain
Synth acts as an AI brain that:
- Interprets user intent from natural language
- Plans workflow structures
- Selects appropriate triggers and actions
- Generates workflow definitions in JSON format
- Manages long-term reasoning and context

### Workflow Storage
- Workflow definitions are stored in the Neon database
- Each workflow includes trigger, actions, and intent
- Historical execution data is logged for analysis

### Execution Layer
- Synth does NOT execute workflows directly
- Synth generates workflow definitions and sends instructions to external automation engines
- For MVP: **Pipedream is the only executor**
- Future versions will support n8n

## System Purpose

Synth performs the following functions:

1. **Interpret user intent** - Understand what the user wants to automate
2. **Plan workflows** - Design the logical flow of automation
3. **Select triggers and actions** - Choose appropriate workflow components
4. **Create workflow JSON definitions** - Generate structured workflow data
5. **Store workflows** - Save definitions to Neon database
6. **Execute workflows** - Send instructions to Pipedream for execution
7. **Track executions** - Log execution history and results
8. **Use memory** - Maintain long-term context and reasoning artifacts

## Key Principles

- Synth is the intelligence layer, not the execution layer
- Workflow definitions are JSON-based and flexible
- External engines (Pipedream) handle actual workflow execution
- All workflow logic is stored and managed by Synth
- User interactions are conversational and intent-driven

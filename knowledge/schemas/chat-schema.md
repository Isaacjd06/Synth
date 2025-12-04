# Chat Schema

## What is the Chat Messages Table?

The chat_messages table logs messages for context reconstruction.

## Purpose

**Primary Function:** Enable Synth to reconstruct conversation context.

**Use Cases:**
- Maintain conversation history
- Understand user request history
- Preserve conversation continuity
- Debug user interactions
- Provide context for workflow planning

## Chat Messages Table Structure

**Table Name:** chat_messages

**Database:** Neon (PostgreSQL)

**ORM:** Prisma

## Fields

### Message ID
- **Type:** Primary key
- **Purpose:** Unique identifier for each message

### User ID
- **Type:** Foreign key
- **Purpose:** Associates message with specific user
- **Relationship:** Belongs to one user

### Role
- **Type:** String/Enum
- **Purpose:** Identifies who sent the message
- **Options:**
  - user (message from the user)
  - assistant (message from Synth)
  - system (system-generated messages)

### Content
- **Type:** Text
- **Purpose:** The actual message text
- **Contains:** The full message content

### Timestamp
- **Type:** DateTime
- **Purpose:** When the message was sent
- **Use:** Orders messages chronologically

### Conversation ID
- **Type:** String (optional)
- **Purpose:** Groups related messages together
- **Use:** Helps identify which messages belong to the same conversation thread

### Metadata
- **Type:** JSON (optional)
- **Purpose:** Additional information about the message
- **Examples:** Source, context tags, etc.

## How Chat Messages Are Used

### Context Reconstruction
- When a user returns to a conversation
- Synth reads recent chat_messages to understand context
- Conversation history informs current responses

### Understanding User Requests
- Past messages show what the user has asked for
- Helps identify patterns in user needs
- Provides context for new workflow requests

### Maintaining Continuity
- Users can reference previous conversations
- Synth can recall what was discussed
- Enables natural, continuous dialogue

### Debugging
- Chat messages help identify where interactions went wrong
- Useful for improving system behavior
- Provides audit trail of conversations

## Writing Chat Messages

Messages are logged by:
- Chat interface when user sends a message
- Synth after generating each response
- System for important status updates

**Every message is logged** to ensure complete conversation history.

## Reading Chat Messages

Messages are retrieved:
- When reconstructing conversation context
- When user returns to previous conversation
- When analyzing user interaction patterns
- For debugging and improvement

## Chat vs Memory

**chat_messages** and **memory** serve different purposes:

### chat_messages (Short-Term)
- Recent conversation history
- Full message logs
- Enables context reconstruction
- Temporary, conversation-level context

### memory (Long-Term)
- Persistent user context
- Reasoning artifacts
- User preferences and patterns
- Permanent, user-level context

Together, they provide both immediate context and long-term learning.

## Key Principles

**Complete Logging:** Every message is recorded

**User-Specific:** Each user has their own message history

**Chronological:** Messages are ordered by timestamp

**Role-Identified:** Clear distinction between user, assistant, and system messages

**Conversation-Grouped:** Messages can be grouped by conversation ID

**Context-Enabling:** Essential for maintaining conversation continuity

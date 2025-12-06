import EventEmitter from "events";

/**
 * Internal backend event bus for decoupled event handling.
 * Events are emitted from various routes and can be listened to by other parts of the system.
 */
export const Events = new EventEmitter();

/**
 * Typed event names for type safety
 */
export type EventName =
  | "workflow:created"
  | "workflow:executed"
  | "chat:message"
  | "memory:updated"
  | "subscription:updated";

/**
 * Event payload types
 */
export interface WorkflowCreatedPayload {
  workflow_id: string;
  user_id: string;
  workflow_name: string;
}

export interface WorkflowExecutedPayload {
  workflow_id: string;
  user_id: string;
  execution_id: string;
  status: string;
}

export interface ChatMessagePayload {
  message_id: string;
  user_id: string;
  conversation_id: string;
}

export interface MemoryUpdatedPayload {
  memory_id: string;
  user_id: string;
  context_type: string;
}

export interface SubscriptionUpdatedPayload {
  user_id: string;
  subscription_status: string;
  subscription_plan?: string;
  event_type: string;
}

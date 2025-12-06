"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";

export interface ChatMessage {
  id: string;
  user_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  conversation_id?: string | null;
  created_at: string;
  metadata?: any;
}

interface UseChatOptions {
  conversationId?: string;
  onMessageAdded?: (message: ChatMessage) => void;
}

export function useChat(options: UseChatOptions = {}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);
  const messagesRef = useRef<ChatMessage[]>([]);
  
  // Keep ref in sync with state
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Load messages from API
  const loadMessages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Only load messages if we have a conversation ID
      if (!options.conversationId) {
        setMessages([]);
        setLoading(false);
        return;
      }

      const params = new URLSearchParams({
        conversation_id: options.conversationId,
      });

      const response = await fetch(`/api/chat/messages?${params.toString()}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `HTTP ${response.status}: Failed to fetch messages`;
        console.error("Chat fetch error:", {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        });
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log("Chat API response:", { ok: data.ok, messagesLength: data.messages?.length });
      
      if (data.ok && Array.isArray(data.messages)) {
        // Transform messages to match ChatMessage interface
        const transformedMessages = data.messages.map((msg: any) => ({
          id: msg.id,
          user_id: msg.user_id || "",
          role: msg.role,
          content: msg.content,
          conversation_id: msg.conversation_id,
          created_at: msg.created_at,
          metadata: msg.metadata,
        }));
        setMessages(transformedMessages);
        // Auto-scroll after loading
        setTimeout(() => {
          if (shouldAutoScrollRef.current) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
          }
        }, 100);
      } else {
        console.warn("Chat API returned unexpected format:", data);
        setMessages([]);
      }
    } catch (err: any) {
      console.error("Error loading messages:", err);
      console.error("Error details:", {
        message: err.message,
        stack: err.stack,
        name: err.name,
      });
      setError(err.message || "Failed to load messages");
      toast.error("Failed to Load Messages", {
        description: err.message || "Could not load chat history.",
      });
    } finally {
      setLoading(false);
    }
  }, [options.conversationId]);

  // Save message to API
  const saveMessage = useCallback(
    async (message: Omit<ChatMessage, "id" | "created_at">): Promise<ChatMessage | null> => {
      try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message.content,
          session_id: options.conversationId || undefined,
        }),
      });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to save message");
        }

        const data = await response.json();
        if (data.success && data.data) {
          return data.data;
        }
        return null;
      } catch (err: any) {
        console.error("Error saving message:", err);
        toast.error("Failed to Save Message", {
          description: err.message || "Could not save your message.",
        });
        return null;
      }
    },
    [options.conversationId]
  );

  // Send message and get AI response
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isSending) return;

      setIsSending(true);
      setError(null);

      // Optimistically add user message
      const userMessage: ChatMessage = {
        id: `temp-${Date.now()}`,
        user_id: "", // Will be populated by API response
        role: "user",
        content: content.trim(),
        conversation_id: options.conversationId || null,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => {
        const updated = [...prev, userMessage];
        shouldAutoScrollRef.current = true;
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
        return updated;
      });

      try {
        // Save user message
        const savedUserMessage = await saveMessage(userMessage);
        if (savedUserMessage) {
          setMessages((prev) =>
            prev.map((msg) => (msg.id === userMessage.id ? savedUserMessage : msg))
          );
        }

        // Get current messages state for conversation history (use ref to avoid stale closure)
        const currentMessages = messagesRef.current.filter((msg) => !msg.id.startsWith("temp-"));
        const conversationHistory = currentMessages
          .map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
          .join("\n\n");
        const fullMessage = conversationHistory
          ? `${conversationHistory}\n\nUser: ${content.trim()}`
          : `User: ${content.trim()}`;

        // Get AI response from brain
        const brainResponse = await fetch("/api/brain", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: fullMessage }),
        });

        if (!brainResponse.ok) {
          const errorData = await brainResponse.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to get AI response");
        }

        const brainData = await brainResponse.json();
        if (!brainData.ok || !brainData.data) {
          throw new Error("Invalid response from AI");
        }

        const aiData = brainData.data;
        // Handle both response formats: { reply } or { message }
        const replyText = aiData.reply || aiData.message || "I'm sorry, I couldn't generate a response.";
        
        const assistantMessage: ChatMessage = {
          id: `temp-assistant-${Date.now()}`,
          user_id: "", // Will be populated by API response
          role: "assistant",
          content: replyText,
          conversation_id: options.conversationId || null,
          created_at: new Date().toISOString(),
          metadata: {
            intent: aiData.intent,
            memory_to_write: aiData.memory_to_write,
            workflow_plan: aiData.workflow_plan,
          },
        };

        // Optimistically add assistant message
        setMessages((prev) => [...prev, assistantMessage]);
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);

        // Save assistant message
        const savedAssistantMessage = await saveMessage(assistantMessage);
        if (savedAssistantMessage) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessage.id ? savedAssistantMessage : msg
            )
          );
        }

        // Handle memory creation if needed
        if (aiData.memory_to_write && Array.isArray(aiData.memory_to_write)) {
          for (const memoryItem of aiData.memory_to_write) {
            try {
              await fetch("/api/memory/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  context_type: "preference",
                  content: memoryItem.value || memoryItem,
                  metadata: { key: memoryItem.key || null },
                }),
              });
            } catch (err) {
              console.error("Failed to save memory:", err);
              // Non-fatal, continue
            }
          }
        }

        // Handle workflow plan if needed (show modal placeholder)
        if (aiData.workflow_plan && aiData.workflow_plan.should_create_workflow) {
          // TODO: Show workflow preview modal
          console.log("Workflow plan generated:", aiData.workflow_plan);
        }

        if (options.onMessageAdded && savedAssistantMessage) {
          options.onMessageAdded(savedAssistantMessage);
        }
      } catch (err: any) {
        console.error("Error sending message:", err);
        setError(err.message || "Failed to send message");
        toast.error("Failed to Send Message", {
          description: err.message || "Could not send your message. Please try again.",
        });

        // Remove optimistic messages on error
        setMessages((prev) => prev.filter((msg) => !msg.id.startsWith("temp-")));
      } finally {
        setIsSending(false);
      }
    },
    [isSending, saveMessage, options]
  );

  // Handle scroll behavior
  const handleScroll = useCallback(() => {
    const container = messagesEndRef.current?.parentElement;
    if (container) {
      const isNearBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight < 100;
      shouldAutoScrollRef.current = isNearBottom;
    }
  }, []);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (shouldAutoScrollRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Load messages on mount
  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  return {
    messages,
    loading,
    error,
    isSending,
    sendMessage,
    loadMessages,
    messagesEndRef,
    handleScroll,
  };
}


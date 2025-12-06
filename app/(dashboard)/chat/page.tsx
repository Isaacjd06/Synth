"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/Button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2 } from "lucide-react";
import SubscriptionGate from "@/components/subscription/SubscriptionGate";
import SubscriptionInactiveBanner from "@/components/subscription/SubscriptionInactiveBanner";

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
  metadata?: {
    intent?: string;
    action_taken?: string;
    workflow_id?: string;
    [key: string]: any;
  };
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load session_id from localStorage on mount
  useEffect(() => {
    const storedSessionId = localStorage.getItem("chat_session_id");
    if (storedSessionId) {
      setSessionId(storedSessionId);
      fetchMessages(storedSessionId);
    } else {
      setIsLoadingInitial(false);
    }
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    // Use setTimeout to ensure DOM is updated
    setTimeout(() => {
      // Try to find the ScrollArea viewport
      const viewport = document.querySelector('[data-radix-scroll-area-viewport]') as HTMLDivElement;
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      } else if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const response = await fetch(
        `/api/chat/messages?conversation_id=${encodeURIComponent(conversationId)}`
      );
      const data = await response.json();

      if (data.ok && data.messages) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setIsLoadingInitial(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputMessage.trim() || isLoading) {
      return;
    }

    const userMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: inputMessage.trim(),
      created_at: new Date().toISOString(),
    };

    // Add user message instantly
    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage.content,
          session_id: sessionId,
        }),
      });

      const data = await response.json();

      if (data.ok) {
        // Update session_id if we got a new one
        if (data.session_id && data.session_id !== sessionId) {
          setSessionId(data.session_id);
          localStorage.setItem("chat_session_id", data.session_id);
        }

        // Replace messages with the full conversation from API
        if (data.messages) {
          setMessages(data.messages);
        }

        // Show status bubble if workflow action was taken
        if (data.action_taken === "create_workflow" && data.workflow_id) {
          // Status will be shown via the message metadata
        }
      } else {
        // Add error message
        const errorMessage: ChatMessage = {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: data.error || "An error occurred. Please try again.",
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error: any) {
      console.error("Error sending message:", error);
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "Failed to send message. Please try again.",
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-4xl mx-auto w-full">
      <SubscriptionGate>
        <SubscriptionInactiveBanner />
        <div className="mb-4">
          <h1 className="text-3xl font-bold text-white mb-2">Chat</h1>
          <p className="text-gray-400 text-sm">
            Ask me to create workflows, run them, or ask questions.
          </p>
        </div>

        <Card className="flex-1 flex flex-col overflow-hidden min-h-0">
        <CardContent className="flex-1 p-0 flex flex-col min-h-0">
          {isLoadingInitial ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-400 py-8">
                    <p>No messages yet. Start a conversation!</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div key={message.id}>
                      <MessageBubble message={message} />
                      {message.metadata?.action_taken === "create_workflow" &&
                        message.metadata?.workflow_id && (
                          <div className="mt-2 ml-4">
                            <StatusBubble
                              type="create"
                              workflowId={message.metadata.workflow_id}
                            />
                          </div>
                        )}
                      {message.metadata?.action_taken === "run_workflow" && (
                        <div className="mt-2 ml-4">
                          <StatusBubble type="run" />
                        </div>
                      )}
                    </div>
                  ))
                )}
                {isLoading && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Thinking...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          )}

          {/* Sticky footer input area */}
          <div className="border-t border-border p-4 flex-shrink-0">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type your message..."
                disabled={isLoading}
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
              <Button
                type="submit"
                disabled={isLoading || !inputMessage.trim()}
                variant="default"
                size="icon"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
      </SubscriptionGate>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[80%] rounded-lg px-4 py-2 ${
          isUser
            ? "bg-[#194c92] text-white"
            : "bg-gray-800 text-gray-100 border border-gray-700"
        }`}
      >
        <p className="text-sm whitespace-pre-wrap break-words">
          {message.content}
        </p>
        <p
          className={`text-xs mt-1 ${
            isUser ? "text-blue-200" : "text-gray-400"
          }`}
        >
          {new Date(message.created_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}

function StatusBubble({
  type,
  workflowId,
}: {
  type: "create" | "run";
  workflowId?: string;
}) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-900/30 border border-green-700/50 rounded-md text-sm text-green-300">
      {type === "create" && workflowId && (
        <>
          <span className="font-medium">✓ Workflow created:</span>
          <span className="font-mono text-xs">{workflowId}</span>
        </>
      )}
      {type === "run" && (
        <span className="font-medium">✓ Workflow executed successfully</span>
      )}
    </div>
  );
}

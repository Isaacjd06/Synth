"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ChatHeader from "@/components/chat/ChatHeader";
import MessageBubble from "@/components/chat/MessageBubble";
import MessageComposer from "@/components/chat/MessageComposer";
import TypingIndicator from "@/components/chat/TypingIndicator";
import EmptyChat from "@/components/chat/EmptyChat";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { supabase } from "@/lib/supabaseClient";

/**
 * Chat Page
 *
 * Main conversational interface with Synth AI.
 * Features:
 * - Real-time chat with Synth backend (via /api/chat)
 * - Persistent message history stored in Supabase
 * - Scrollable message history with user and Synth messages
 * - Real-time typing indicator when Synth is composing
 * - Fixed bottom message composer
 * - Empty state for new conversations
 * - Animated message entrance with stagger effect
 * - Auto-scroll to latest message
 * - Background gradient effects for atmosphere
 * - Workflow activation buttons (when applicable)
 */

// Message type definition
interface Message {
  id: string;
  role: "user" | "synth" | "assistant";
  message: string;
  time?: string;
  created_at?: string;
  workflowId?: string;
}

const TEMP_USER_ID = "00000000-0000-0000-0000-000000000000";

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isFetchingMessages, setIsFetchingMessages] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [activatingWorkflowId, setActivatingWorkflowId] = useState<
    string | null
  >(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Generate or retrieve session ID
  useEffect(() => {
    const storedSessionId = localStorage.getItem("chat_session_id");
    if (storedSessionId) {
      setSessionId(storedSessionId);
    } else {
      const newSessionId = crypto.randomUUID();
      setSessionId(newSessionId);
      localStorage.setItem("chat_session_id", newSessionId);
    }
  }, []);

  // Fetch existing messages from Supabase when session ID is ready
  useEffect(() => {
    if (!sessionId) return;

    const fetchMessages = async () => {
      try {
        setIsFetchingMessages(true);
        const { data, error } = await supabase
          .from("chat_messages")
          .select("*")
          .eq("session_id", sessionId)
          .order("created_at", { ascending: true });

        if (error) {
          console.error("Error fetching messages:", error);
          return;
        }

        if (data && data.length > 0) {
          const formattedMessages: Message[] = data.map((msg) => {
            const created = new Date(msg.created_at);
            const time = created.toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
            });

            return {
              id: msg.id,
              role: msg.role === "assistant" ? "synth" : msg.role,
              message: msg.message,
              created_at: msg.created_at,
              time: time,
            };
          });
          setMessages(formattedMessages);
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
      } finally {
        setIsFetchingMessages(false);
      }
    };

    fetchMessages();
  }, [sessionId]);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Handle sending a message
  const handleSendMessage = async (messageText: string) => {
    // Get current time
    const now = new Date();
    const time = now.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });

    // Add user message
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      message: messageText,
      time: time,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: messageText,
          userId: TEMP_USER_ID,
          sessionId: sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const data = await response.json();

      // Update session ID if provided
      if (data.sessionId && data.sessionId !== sessionId) {
        setSessionId(data.sessionId);
        localStorage.setItem("chat_session_id", data.sessionId);
      }

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "synth",
        message: data.message,
        time: new Date().toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        }),
        workflowId: data.workflowId || undefined,
      };

      setIsTyping(false);
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      setIsTyping(false);
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: "synth",
        message: "Sorry, I encountered an error. Please try again.",
        time: new Date().toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  // Handle workflow activation
  const handleActivateWorkflow = async (workflowId: string) => {
    if (!workflowId || activatingWorkflowId) return;

    setActivatingWorkflowId(workflowId);

    try {
      const response = await fetch("/api/activate-workflow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ workflow_id: workflowId }),
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Non-JSON response received:", text.substring(0, 200));
        throw new Error(
          `Server returned non-JSON response (${contentType}). Check server logs.`
        );
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to activate workflow");
      }

      // Update the message to show success
      setMessages((prev) =>
        prev.map((msg) =>
          msg.workflowId === workflowId
            ? {
                ...msg,
                message: msg.message.replace(
                  "Activate it?",
                  `Activated! (n8n ID: ${data.n8n_id})`
                ),
              }
            : msg
        )
      );
    } catch (error) {
      console.error("Error activating workflow:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to activate workflow";

      // Update the message to show error
      setMessages((prev) =>
        prev.map((msg) =>
          msg.workflowId === workflowId
            ? {
                ...msg,
                message: `${msg.message}\n\nError: ${errorMessage}`,
              }
            : msg
        )
      );
    } finally {
      setActivatingWorkflowId(null);
    }
  };

  // Handle start chat from empty state
  const handleStartChat = () => {
    // Focus input or send a greeting
    const greeting = "Hello Synth!";
    handleSendMessage(greeting);
  };

  // Stagger animation for messages
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  // Check if message has workflow activation button
  const hasActivateButton = (msg: Message) => {
    return (
      msg.role === "synth" &&
      msg.message.includes("Activate it?") &&
      msg.workflowId
    );
  };

  // Render message with activation button if needed
  const renderMessageWithButton = (msg: Message) => {
    if (!hasActivateButton(msg)) {
      return msg.message;
    }

    const parts = msg.message.split("Activate it?");
    const beforeText = parts[0];
    const isActivating = activatingWorkflowId === msg.workflowId;

    return (
      <div>
        {beforeText}
        <div className="mt-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            onClick={() =>
              msg.workflowId && handleActivateWorkflow(msg.workflowId)
            }
            disabled={isActivating}
            className="px-4 py-2 bg-gradient-to-r from-[#0229bf] to-[#3d5af1] text-white rounded-lg text-sm font-medium shadow-[0_0_15px_-5px_#0229bf] hover:shadow-[0_0_20px_-3px_#3d5af1] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isActivating ? "Activating..." : "Activate Workflow"}
          </motion.button>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col h-full bg-[#0a0a0a] text-[#f5f5f5]"
      >
        {/* Header */}
        <ChatHeader />

        {/* Chat Container */}
        <div className="flex-1 overflow-y-auto relative" ref={chatContainerRef}>
          {isFetchingMessages ? (
            // Loading State
            <div className="flex items-center justify-center h-full">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-8 h-8 border-2 border-[#0229bf]/30 border-t-[#0229bf] rounded-full"
              />
            </div>
          ) : messages.length === 0 ? (
            // Empty State
            <EmptyChat onStartChat={handleStartChat} />
          ) : (
            // Messages List
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="max-w-4xl mx-auto px-8 py-6"
            >
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  role={msg.role === "assistant" ? "synth" : msg.role}
                  message={renderMessageWithButton(msg)}
                  time={msg.time}
                />
              ))}

              {/* Typing Indicator */}
              <AnimatePresence>
                {isTyping && <TypingIndicator />}
              </AnimatePresence>

              {/* Scroll Anchor */}
              <div ref={messagesEndRef} />
            </motion.div>
          )}

          {/* Background Gradient Effects */}
          <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
            {/* Top Gradient */}
            <motion.div
              className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-[#0229bf]/5 rounded-full blur-3xl"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 12,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            {/* Bottom Gradient */}
            <motion.div
              className="absolute bottom-0 right-1/3 w-[600px] h-[600px] bg-[#3d5af1]/5 rounded-full blur-3xl"
              animate={{
                scale: [1.2, 1, 1.2],
                opacity: [0.5, 0.3, 0.5],
              }}
              transition={{
                duration: 12,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 6,
              }}
            />
          </div>
        </div>

        {/* Message Composer - Fixed Bottom */}
        <MessageComposer
          onSendMessage={handleSendMessage}
          disabled={isTyping || isFetchingMessages}
        />
      </motion.div>
    </DashboardLayout>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";

interface Message {
  id: string;
  role: "user" | "assistant";
  message: string;
  created_at?: string;
  workflowId?: string;
}

const TEMP_USER_ID = "00000000-0000-0000-0000-000000000000";

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingMessages, setIsFetchingMessages] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [activatingWorkflowId, setActivatingWorkflowId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
          const formattedMessages: Message[] = data.map((msg) => ({
            id: msg.id,
            role: msg.role,
            message: msg.message,
            created_at: msg.created_at,
          }));
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

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      message: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const messageText = input.trim();
    setInput("");
    setIsLoading(true);

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
        role: "assistant",
        message: data.message,
        workflowId: data.workflowId || undefined,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        message: "Sorry, I encountered an error. Please try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      // Focus back on input after response
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleActivateWorkflow = async (workflowId: string) => {
    if (!workflowId || activatingWorkflowId) return;

    setActivatingWorkflowId(workflowId);

    try {
      console.log("Activating workflow:", workflowId);
      const response = await fetch("/api/activate-workflow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ workflow_id: workflowId }),
      });

      console.log("Activate workflow response status:", response.status);
      console.log("Activate workflow response headers:", Object.fromEntries(response.headers.entries()));

      // Check content type to ensure it's JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Non-JSON response received:", text.substring(0, 200));
        throw new Error(`Server returned non-JSON response (${contentType}). Check server logs.`);
      }

      const data = await response.json();
      console.log("Activate workflow response data:", data);

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
      const errorMessage = error instanceof Error ? error.message : "Failed to activate workflow";
      
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

  const renderMessageContent = (msg: Message) => {
    const hasActivateButton = msg.role === "assistant" &&
                             msg.message.includes("Activate it?") &&
                             msg.workflowId;

    if (!hasActivateButton) {
      return (
        <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
          {msg.message}
        </p>
      );
    }

    // Split message to show text before "Activate it?" and make it a button
    const parts = msg.message.split("Activate it?");
    const beforeText = parts[0];
    const isActivating = activatingWorkflowId === msg.workflowId;

    return (
      <div className="space-y-3">
        {beforeText && (
          <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
            {beforeText}
          </p>
        )}
        <button
          onClick={() => msg.workflowId && handleActivateWorkflow(msg.workflowId)}
          disabled={isActivating}
          className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium rounded-lg bg-[#0229bf] text-white hover:bg-[#0229bf]/90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 transition-all duration-150 shadow-lg shadow-[#0229bf]/20 hover:shadow-xl hover:shadow-[#0229bf]/30"
        >
          {isActivating ? (
            <>
              <svg className="animate-spin -ml-0.5 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Activating...
            </>
          ) : (
            "Activate Workflow"
          )}
        </button>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-black">
      {/* Header */}
      <header className="flex-shrink-0 border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-xl supports-[backdrop-filter]:bg-zinc-950/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-xl font-semibold tracking-tight text-white">
            Synth
          </h1>
        </div>
      </header>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {isFetchingMessages ? (
            <div className="flex items-center justify-center min-h-[calc(100vh-14rem)]">
              <div className="flex flex-col items-center gap-3">
                <div className="relative w-10 h-10">
                  <div className="absolute inset-0 rounded-full border-2 border-zinc-800"></div>
                  <div className="absolute inset-0 rounded-full border-2 border-[#0229bf] border-t-transparent animate-spin"></div>
                </div>
                <p className="text-sm text-zinc-400 animate-pulse">
                  Loading messages...
                </p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center min-h-[calc(100vh-14rem)]">
              <div className="text-center max-w-md space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 shadow-lg shadow-[#0229bf]/10 ring-1 ring-[#0229bf]/20">
                  <svg className="w-8 h-8 text-[#0229bf]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <div className="space-y-2">
                  <p className="text-base font-medium text-zinc-100">
                    Start a conversation
                  </p>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    Describe what you'd like to automate, and I'll help you create a workflow.
                  </p>
                </div>
                <div className="pt-2">
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
                    Try
                  </p>
                  <div className="inline-block px-4 py-2.5 bg-zinc-900 rounded-lg border border-zinc-800 text-sm text-zinc-300 shadow-sm hover:border-[#0229bf]/50 transition-colors">
                    "When I receive an email, send a Slack notification"
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, index) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  } animate-in fade-in slide-in-from-bottom-2 duration-300`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div
                    className={`group relative max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 ${
                      msg.role === "user"
                        ? "bg-[#0229bf] text-white rounded-br-md shadow-lg shadow-[#0229bf]/20"
                        : "bg-zinc-900 text-zinc-100 border border-zinc-800/80 rounded-bl-md shadow-sm"
                    }`}
                  >
                    {renderMessageContent(msg)}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-[#0229bf] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-2 h-2 bg-[#0229bf] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-2 h-2 bg-[#0229bf] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </div>
                      <p className="text-sm text-zinc-400">
                        Synth is thinking
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Form */}
      <div className="flex-shrink-0 border-t border-zinc-800/60 bg-zinc-950/80 backdrop-blur-xl supports-[backdrop-filter]:bg-zinc-950/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <form onSubmit={handleSubmit} className="flex gap-2 sm:gap-3">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Message Synth..."
                autoComplete="off"
                className="w-full pl-4 pr-4 py-3 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-50 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#0229bf] focus:border-transparent transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:border-zinc-700 focus:shadow-lg focus:shadow-[#0229bf]/10"
                disabled={isLoading || isFetchingMessages}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !input.trim() || isFetchingMessages}
              className="inline-flex items-center justify-center px-5 sm:px-6 py-3 rounded-xl bg-[#0229bf] text-white font-medium text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#0229bf]/90 active:scale-[0.98] disabled:active:scale-100 transition-all duration-150 shadow-lg shadow-[#0229bf]/20 hover:shadow-xl hover:shadow-[#0229bf]/30"
            >
              <span className="hidden sm:inline">Send</span>
              <svg className="w-5 h-5 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}


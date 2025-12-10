"use client";
import { useState, useRef, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, AlertTriangle, X, Clock, Lock } from "lucide-react";
import AppShell from "@/components/app/AppShell";
import { PageTransition, PageItem } from "@/components/app/PageTransition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import QuickActionsBar from "@/components/chat/QuickActionsBar";
import AutomationCreatedModal from "@/components/workflows/AutomationCreatedModal";
import SubscriptionBanner from "@/components/subscription/SubscriptionBanner";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { synthToast } from "@/lib/synth-toast";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isWorkflowCreation?: boolean;
}

interface FixInChatContext {
  prefill?: string;
  workflowId?: string;
  executionId?: string;
  errorMessage?: string;
}

// Processing states for better UX feedback
type ProcessingState = "thinking" | "analyzing" | "generating" | "finalizing" | null;

const processingMessages: Record<string, string> = {
  thinking: "Synth is thinking...",
  analyzing: "Analyzing your request...",
  generating: "Generating workflow logic...",
  finalizing: "Finalizing automation...",
};

export default function ChatPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isSubscribed, requireSubscription } = useSubscription();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [processingState, setProcessingState] = useState<ProcessingState>(null);
  const [showAutomationModal, setShowAutomationModal] = useState(false);
  const [fixContext, setFixContext] = useState<FixInChatContext | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Workflow for modal (will be set when workflow is created)
  const [createdWorkflow, setCreatedWorkflow] = useState<{
    id: string;
    name: string;
    description: string;
    trigger: string;
    actions: string[];
  } | null>(null);

  // Handle "Fix in Chat" entry from other pages via URL params
  useEffect(() => {
    const prefill = searchParams.get("prefill");
    const workflowId = searchParams.get("workflowId");
    const executionId = searchParams.get("executionId");
    const errorMessage = searchParams.get("errorMessage");
    
    if (prefill || errorMessage) {
      setFixContext({
        prefill: prefill || undefined,
        workflowId: workflowId || undefined,
        executionId: executionId || undefined,
        errorMessage: errorMessage || undefined,
      });
      if (prefill) {
        setInput(prefill);
      }
      // Clear URL params
      router.replace("/app/chat");
      // Focus input
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [searchParams, router]);

  useEffect(() => {
    // Only scroll when there are messages to avoid initial scroll issues
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const simulateProcessingStates = async () => {
    const states: ProcessingState[] = ["thinking", "analyzing", "generating", "finalizing"];
    for (const state of states) {
      setProcessingState(state);
      await new Promise((r) => setTimeout(r, 400 + Math.random() * 300));
    }
    setProcessingState(null);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const messageToSend = input.trim();
    setInput("");
    setIsLoading(true);
    setProcessingState("thinking");
    setFixContext(null); // Clear fix context after sending

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: messageToSend,
          session_id: messages.length > 0 ? messages[0].id : undefined 
        }),
      });

      const data = await response.json();

      if (data.ok && data.messages) {
        // Update messages with all messages from the conversation
        const formattedMessages: Message[] = data.messages.map((msg: any) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.created_at),
          isWorkflowCreation: msg.metadata?.action_taken === "create_workflow",
        }));
        setMessages(formattedMessages);

        // If a workflow was created, show the modal
        if (data.workflow_id) {
          setCreatedWorkflow({
            id: data.workflow_id,
            name: `Workflow ${data.workflow_id.slice(0, 8)}`,
            description: "AI-generated workflow based on your conversation with Synth.",
            trigger: "Custom trigger configured",
            actions: ["Process input", "Execute logic", "Send notification"],
          });
          setShowAutomationModal(true);
        }
      } else {
        // Handle error response
        // API returns 'error' field, not 'message'
        const errorText = data.error || data.message || "I encountered an error processing your request. Please try again.";
        const errorMessage: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: errorText,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
        synthToast.error("Error", errorText);
      }
    } catch (error) {
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      synthToast.error("Error", "Failed to send message");
    } finally {
      setIsLoading(false);
      setProcessingState(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case "create":
        setInput("Create a new workflow that ");
        inputRef.current?.focus();
        break;
      case "workflows":
        router.push("/app/workflows");
        break;
      case "followup":
        setInput("Set up automated follow-up reminders for ");
        inputRef.current?.focus();
        break;
      case "summary":
        setInput("Build a daily summary report that ");
        inputRef.current?.focus();
        break;
      case "reset":
        setMessages([]);
        setFixContext(null);
        synthToast.success("Conversation Cleared", "Start fresh with a new chat.");
        break;
    }
  };

  const handleCreateWorkflow = () => {
    // Check subscription before creating workflow
    if (!requireSubscription("create automations")) return;
    
    // Generate a dynamic workflow based on conversation
    const latestUserMessage = [...messages].reverse().find(m => m.role === "user");
    setCreatedWorkflow({
      id: `wf-${Date.now()}`,
      name: latestUserMessage?.content.slice(0, 30) + "..." || "New Automation",
      description: "AI-generated workflow based on your conversation with Synth.",
      trigger: "Custom trigger configured",
      actions: ["Process input", "Execute logic", "Send notification"],
    });
    setShowAutomationModal(true);
  };

  const dismissFixContext = () => {
    setFixContext(null);
    setInput("");
  };

  return (
    <AppShell>
      <div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden">
        {/* Subscription Banner - Fixed at top */}
        {!isSubscribed && (
          <div className="px-4 pt-4 flex-shrink-0">
            <SubscriptionBanner feature="create and manage automations" />
          </div>
        )}

        {/* Page Header - Fixed below banner */}
        <PageTransition className="px-4 py-5 border-b border-border/60 flex-shrink-0">
          <PageItem>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shadow-[0_0_20px_-5px_hsl(217_100%_60%/0.3)]">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold text-gradient">Synth Chat</h1>
                <p className="text-sm text-muted-foreground font-light">
                  Your intelligent automation assistant
                </p>
              </div>
            </div>
          </PageItem>
        </PageTransition>

        {/* Fix in Chat Context Banner - Fixed */}
        <AnimatePresence>
          {fixContext && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="px-4 border-b border-amber-500/30 bg-amber-500/10 flex-shrink-0"
            >
              <div className="py-3 flex items-center justify-between max-w-2xl mx-auto">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  <div>
                    <p className="text-sm font-medium text-amber-200">Fix Requested</p>
                    <p className="text-xs text-amber-300/70">
                      {fixContext.executionId
                        ? `Execution #${fixContext.executionId}`
                        : fixContext.workflowId
                        ? `Workflow #${fixContext.workflowId}`
                        : "Error analysis loaded"}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={dismissFixContext}
                  className="h-8 w-8 text-amber-300 hover:text-amber-100 hover:bg-amber-500/20"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Actions Bar - Fixed */}
        <div className="px-4 border-b border-border/40 flex-shrink-0">
          <QuickActionsBar onAction={handleQuickAction} />
        </div>

        {/* Chat Messages Area - Only scrolls when messages exist */}
        {messages.length > 0 ? (
          <ScrollArea className="flex-1 px-4 min-h-0">
          <div className="max-w-2xl mx-auto py-6 space-y-6">
            <AnimatePresence mode="popLayout">
                {messages.map((message) => (
                  <motion.div 
                    key={message.id} 
                    className="space-y-3"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Message Bubble */}
                    <div
                      className={cn(
                        "p-4 rounded-2xl max-w-[85%] transition-all duration-300",
                        message.role === "user"
                          ? "ml-auto bg-primary text-primary-foreground shadow-[0_4px_20px_-5px_hsl(217_100%_60%/0.4)]"
                          : "bg-card/90 text-foreground border border-border/60 shadow-sm"
                      )}
                    >
                      <p className="text-sm leading-relaxed">{message.content}</p>
                      {/* Timestamp */}
                      <div className={cn(
                        "flex items-center gap-1 mt-2 text-[10px]",
                        message.role === "user" 
                          ? "text-primary-foreground/60 justify-end" 
                          : "text-muted-foreground/60"
                      )}>
                        <Clock className="w-3 h-3" />
                        {formatTime(message.timestamp)}
                      </div>
                    </div>

                    {/* Workflow action buttons - only for assistant workflow messages */}
                    {message.role === "assistant" && (
                      <motion.div 
                        className="flex gap-2 flex-wrap pl-1"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15, duration: 0.3 }}
                      >
                        {message.isWorkflowCreation && (
                          <Button 
                            size="sm" 
                            onClick={handleCreateWorkflow}
                            className="gap-1.5 btn-synth"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            Create This Workflow
                          </Button>
                        )}
                        <Button variant="outline" size="sm" className="text-xs">
                          Modify Request
                        </Button>
                        <Button variant="ghost" size="sm" className="text-xs">
                          Explain More
                        </Button>
                      </motion.div>
                    )}
                  </motion.div>
                ))}
            </AnimatePresence>

            {/* Processing/Thinking Indicator */}
            <AnimatePresence>
              {isLoading && (
                <motion.div 
                  className="bg-card/90 p-4 rounded-2xl max-w-[85%] border border-border/60 shadow-sm"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-center gap-3">
                    {/* Animated Icon */}
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                    </motion.div>
                    
                    <div className="flex-1">
                      <p className="text-sm text-foreground font-medium">
                        {processingState ? processingMessages[processingState] : "Processing..."}
                      </p>
                      {/* Progress Steps */}
                      <div className="flex items-center gap-1.5 mt-2">
                        {["thinking", "analyzing", "generating", "finalizing"].map((step, index) => (
                          <motion.div
                            key={step}
                            className={cn(
                              "h-1 rounded-full transition-all duration-300",
                              step === processingState
                                ? "w-6 bg-primary"
                                : processingState && 
                                  ["thinking", "analyzing", "generating", "finalizing"].indexOf(processingState) > index
                                ? "w-4 bg-primary/50"
                                : "w-4 bg-muted"
                            )}
                            animate={step === processingState ? { scale: [1, 1.1, 1] } : {}}
                            transition={{ duration: 0.5, repeat: Infinity }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        ) : (
          <div className="flex-1 px-4 flex items-center justify-center min-h-0">
            <div className="max-w-2xl mx-auto w-full">
              <motion.div 
                className="flex flex-col items-center justify-center text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
              >
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 shadow-[0_0_30px_-5px_hsl(217_100%_60%/0.2)]">
                  <Sparkles className="w-8 h-8 text-primary/60" />
                </div>
                <p className="text-muted-foreground font-light mb-2">
                  Describe your workflow, and Synth will build it for you.
                </p>
                <p className="text-xs text-muted-foreground/60">
                  Try: "Create a workflow to capture leads and sync to CRM"
                </p>
              </motion.div>
            </div>
          </div>
        )}

        {/* Message Input Area - Fixed at bottom */}
        <div className="px-4 py-4 border-t border-border/60 bg-background/90 backdrop-blur-sm flex-shrink-0">
          <div className="max-w-2xl mx-auto flex gap-3">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={fixContext ? "Describe how to fix this issue..." : "Describe your automation..."}
              disabled={isLoading}
              className="flex-1 bg-muted/30 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all duration-300 h-11"
            />
            <Button 
              onClick={handleSend} 
              disabled={isLoading || !input.trim()}
              className="btn-synth h-11 px-5 gap-2"
            >
              <Send className="w-4 h-4" />
              Send
            </Button>
          </div>
        </div>
      </div>

      {/* Automation Created Modal */}
      {createdWorkflow && (
        <AutomationCreatedModal
          open={showAutomationModal}
          onOpenChange={setShowAutomationModal}
          workflow={createdWorkflow}
        />
      )}
    </AppShell>
  );
}

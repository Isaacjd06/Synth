"use client";

import { motion } from "framer-motion";
import { MessageSquare, User, Bot, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  message: string;
  timestamp: string;
}

const dummyMessages: ChatMessage[] = [
  {
    id: "1",
    role: "user",
    message: "Can you help me set up a new workflow for daily reports?",
    timestamp: "2 hours ago",
  },
  {
    id: "2",
    role: "assistant",
    message: "I'll help you create a daily report workflow. Let's start by connecting your data sources...",
    timestamp: "2 hours ago",
  },
  {
    id: "3",
    role: "user",
    message: "Great! I need to pull data from Notion and send it to Slack.",
    timestamp: "1 hour ago",
  },
  {
    id: "4",
    role: "assistant",
    message: "Perfect! I've configured the workflow to fetch data from Notion every morning at 9 AM...",
    timestamp: "1 hour ago",
  },
];

export function ChatCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
    >
      <Card className="bg-[#151515] border-[#1f1f1f] rounded-xl p-5 hover:shadow-[0_0_10px_#0229bf40] transition-all duration-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#0229bf]" />
            <h2 className="text-lg font-semibold text-[#f5f5f5]">Recent Chat</h2>
          </div>
          <span className="text-xs text-[#9ca3af]">{dummyMessages.length} messages</span>
        </div>

        <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
          {dummyMessages.map((msg, index) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, x: msg.role === "user" ? -10 : 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
              className={cn(
                "flex gap-3 p-3 rounded-lg",
                "bg-[#0b0b0b] border border-[#1f1f1f]",
                "hover:border-[#0229bf40] transition-all duration-200"
              )}
            >
              {/* Role icon */}
              <div
                className={cn(
                  "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                  msg.role === "user"
                    ? "bg-[#9ca3af20] text-[#9ca3af]"
                    : "bg-[#0229bf20] text-[#0229bf]"
                )}
              >
                {msg.role === "user" ? (
                  <User className="w-4 h-4" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
              </div>

              {/* Message content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-[#f5f5f5]">
                    {msg.role === "user" ? "You" : "Synth AI"}
                  </span>
                  <span className="text-xs text-[#9ca3af]">{msg.timestamp}</span>
                </div>
                <p className="text-sm text-[#9ca3af] line-clamp-2">{msg.message}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <Button
          variant="ghost"
          className="w-full mt-4 text-[#0229bf] hover:text-[#3d5af1] hover:bg-[#0229bf10] group"
        >
          View Full Chat
          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
      </Card>
    </motion.div>
  );
}

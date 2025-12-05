"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, ChevronUp, Copy, Check } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { ChatMessage } from "./useChat";

interface MessageListProps {
  messages: ChatMessage[];
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  onScroll?: () => void;
}

export default function MessageList({
  messages,
  messagesEndRef,
  onScroll,
}: MessageListProps) {
  const [expandedMetadata, setExpandedMetadata] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const toggleMetadata = (messageId: string) => {
    const newExpanded = new Set(expandedMetadata);
    if (newExpanded.has(messageId)) {
      newExpanded.delete(messageId);
    } else {
      newExpanded.add(messageId);
    }
    setExpandedMetadata(newExpanded);
  };

  const copyToClipboard = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(messageId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const getMessageStyles = (role: ChatMessage["role"]) => {
    switch (role) {
      case "user":
        return "bg-[#194c92] text-white ml-auto";
      case "assistant":
        return "bg-gray-800 text-gray-100 mr-auto";
      case "system":
        return "bg-gray-900/50 text-gray-400 mx-auto border border-gray-800";
      default:
        return "bg-gray-800 text-gray-100";
    }
  };

  const getMessageAlignment = (role: ChatMessage["role"]) => {
    switch (role) {
      case "user":
        return "items-end";
      case "assistant":
        return "items-start";
      case "system":
        return "items-center";
      default:
        return "items-start";
    }
  };

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-gray-400 text-lg mb-2">No messages yet</p>
          <p className="text-gray-500 text-sm">Start a conversation with Synth</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-6 space-y-4 w-full"
      onScroll={onScroll}
    >
      {messages.map((message, index) => {
        const hasMetadata = message.metadata && Object.keys(message.metadata).length > 0;
        const isExpanded = expandedMetadata.has(message.id);
        const isCopied = copiedId === message.id;

        return (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className={`flex flex-col ${getMessageAlignment(message.role)} gap-2 w-full`}
          >
            <div className={`flex flex-col ${getMessageAlignment(message.role)} max-w-[85%] sm:max-w-[75%] lg:max-w-[70%] w-full min-w-0`}>
              <div
                className={`rounded-lg px-4 py-3 ${getMessageStyles(message.role)} relative group min-w-0`}
              >
                <div className="flex items-start justify-between gap-3 min-w-0">
                  <p className="text-sm whitespace-pre-wrap break-words flex-1 min-w-0 overflow-wrap-anywhere word-break-break-word">
                    {message.content}
                  </p>
                  {message.role !== "system" && (
                    <button
                      onClick={() => copyToClipboard(message.content, message.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 p-1 hover:bg-black/20 rounded"
                      aria-label="Copy message"
                    >
                      {isCopied ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Timestamp */}
              <span className="text-xs text-gray-500 px-2">
                {formatDateTime(message.created_at)}
              </span>

              {/* Metadata Panel */}
              {hasMetadata && (
                <div className="w-full mt-2">
                  <button
                    onClick={() => toggleMetadata(message.id)}
                    className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-300 transition-colors px-2 py-1"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="w-3 h-3" />
                        Hide details
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3 h-3" />
                        Show details
                      </>
                    )}
                  </button>

                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-2 bg-black/40 border border-gray-800 rounded-md p-3 overflow-x-auto"
                    >
                      <pre className="text-xs text-gray-300 whitespace-pre-wrap">
                        {JSON.stringify(message.metadata, null, 2)}
                      </pre>
                    </motion.div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
}


"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Send } from "lucide-react";

interface ChatComposerProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  isLoading?: boolean;
}

export default function ChatComposer({
  onSend,
  disabled = false,
  isLoading = false,
}: ChatComposerProps) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleSubmit = () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage) {
      setError("Message cannot be empty");
      return;
    }

    if (disabled || isLoading) {
      return;
    }

    setError(null);
    onSend(trimmedMessage);
    setMessage("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-t border-gray-800 bg-[#0a0a0a] p-4 w-full max-w-full overflow-x-hidden">
      {error && (
        <div className="mb-2 text-sm text-red-400 bg-red-900/20 border border-red-800 rounded-md p-2">
          {error}
        </div>
      )}
      <div className="flex items-end gap-3 max-w-4xl mx-auto w-full">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              setError(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type your message... (Shift+Enter for newline)"
            disabled={disabled || isLoading}
            rows={1}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-gray-100 placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-[#194c92] focus:border-[#194c92] disabled:opacity-50 disabled:cursor-not-allowed min-h-[52px] max-h-[200px] overflow-y-auto"
          />
        </div>
        <Button
          onClick={handleSubmit}
          disabled={disabled || isLoading || !message.trim()}
          className="flex-shrink-0 h-[52px] px-6"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
      <p className="text-xs text-gray-500 mt-2 text-center">
        Press Enter to send, Shift+Enter for newline
      </p>
    </div>
  );
}


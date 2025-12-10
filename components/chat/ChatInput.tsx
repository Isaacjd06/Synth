import { useState, useRef, KeyboardEvent } from "react";
import { Send, Paperclip, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
  placeholder?: string;
}

const ChatInput = ({ onSend, isLoading = false, placeholder = "Message Synth..." }: ChatInputProps) => {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    if (!input.trim() || isLoading) return;
    onSend(input.trim());
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "52px";
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Auto-resize
    if (textareaRef.current) {
      textareaRef.current.style.height = "52px";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  return (
    <div className="border-t border-border/50 bg-background/95 backdrop-blur-sm px-4 py-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-end gap-3 bg-muted/30 border border-border/50 rounded-xl p-2">
          {/* Attach button */}
          <Button
            variant="ghost"
            size="icon"
            className="flex-shrink-0 h-10 w-10 text-muted-foreground hover:text-foreground"
            disabled={isLoading}
          >
            <Paperclip className="w-5 h-5" />
          </Button>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={1}
            disabled={isLoading}
            className={cn(
              "flex-1 min-h-[52px] max-h-[200px] px-3 py-3 bg-transparent text-sm text-foreground",
              "placeholder:text-muted-foreground focus:outline-none resize-none",
              "disabled:opacity-50"
            )}
          />

          {/* Send button */}
          <Button
            onClick={handleSubmit}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="flex-shrink-0 h-10 w-10 rounded-lg"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>

        {/* Hint */}
        <p className="text-[10px] text-muted-foreground/60 text-center mt-2">
          Press <kbd className="px-1 py-0.5 rounded bg-muted/50 text-muted-foreground font-mono text-[9px]">Enter</kbd> to send, 
          <kbd className="px-1 py-0.5 rounded bg-muted/50 text-muted-foreground font-mono text-[9px] ml-1">Shift+Enter</kbd> for newline
        </p>
      </div>
    </div>
  );
};

export default ChatInput;




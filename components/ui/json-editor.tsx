"use client";

import { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface JsonEditorProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "onChange"> {
  value: string;
  onChange: (val: string) => void;
  error?: string;
}

export default function JsonEditor({
  value,
  onChange,
  error,
  className,
  ...props
}: JsonEditorProps) {
  return (
    <div className="space-y-2">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "w-full h-96 p-3 md:p-4 bg-black/40 border rounded-md text-xs md:text-sm font-mono text-gray-300",
          "focus:outline-none focus:ring-2 focus:ring-[#194c92] focus:border-[#194c92]",
          "resize-none overflow-x-auto",
          error
            ? "border-red-500 focus:ring-red-500 focus:border-red-500"
            : "border-gray-700",
          className
        )}
        placeholder='{\n  "name": "...",\n  "description": "...",\n  "trigger": { "type": "manual" },\n  "actions": []\n}'
        {...props}
      />
      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}


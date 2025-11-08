"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Edit2, Trash2, Save, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * MemoryDialog Component
 *
 * Modal dialog for viewing and editing memory entries.
 * Features:
 * - Full memory key display
 * - Colored type badge
 * - Scrollable full value text
 * - Edit mode with textarea
 * - Delete and save actions
 * - Spring animation on open/close
 * - Success state after save
 */

interface Memory {
  id: number | string;
  key: string;
  type: "Insight" | "Preference" | "System";
  value: string;
  updated_at: string;
}

interface MemoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  memory: Memory | null;
  onSave?: (id: number | string, newValue: string) => void;
  onDelete?: (id: number | string) => void;
}

export default function MemoryDialog({
  isOpen,
  onClose,
  memory,
  onSave,
  onDelete,
}: MemoryDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedValue, setEditedValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Initialize edit value when memory changes
  useState(() => {
    if (memory) {
      setEditedValue(memory.value);
    }
  });

  if (!memory) return null;

  const handleEdit = () => {
    setEditedValue(memory.value);
    setIsEditing(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 800));

    onSave?.(memory.id, editedValue);
    setIsSaving(false);
    setShowSuccess(true);

    // Show success briefly then exit edit mode
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setShowSuccess(false);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this memory?")) {
      onDelete?.(memory.id);
      onClose();
    }
  };

  const handleClose = () => {
    setIsEditing(false);
    setShowSuccess(false);
    onClose();
  };

  // Badge color based on type
  const getBadgeColor = () => {
    switch (memory.type) {
      case "Insight":
        return "bg-purple-500/10 text-purple-400 border-purple-500/30";
      case "Preference":
        return "bg-blue-500/10 text-blue-400 border-blue-500/30";
      case "System":
        return "bg-green-500/10 text-green-400 border-green-500/30";
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/30";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl bg-neutral-950/95 backdrop-blur-md border border-neutral-800 text-[#f5f5f5] rounded-2xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", duration: 0.4 }}
        >
          <DialogHeader>
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <DialogTitle className="text-2xl font-bold mb-3">
                  {memory.key}
                </DialogTitle>
                <span
                  className={`inline-block text-xs font-medium px-3 py-1.5 rounded-full border ${getBadgeColor()}`}
                >
                  {memory.type}
                </span>
              </div>
            </div>
            <DialogDescription className="text-[#9ca3af] text-sm mt-2">
              Last updated {memory.updated_at}
            </DialogDescription>
          </DialogHeader>

          {/* Memory Value */}
          <div className="mt-6">
            {isEditing ? (
              <div className="space-y-3">
                <label className="text-sm font-medium text-[#f5f5f5]">
                  Memory Value
                </label>
                <textarea
                  value={editedValue}
                  onChange={(e) => setEditedValue(e.target.value)}
                  rows={8}
                  className="w-full px-4 py-3 bg-neutral-900 border border-neutral-800 rounded-lg text-[#f5f5f5] text-sm leading-relaxed focus:outline-none focus:border-[#0229bf] focus:ring-2 focus:ring-[#0229bf]/20 transition-all duration-200 resize-none"
                />
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto">
                <p className="text-[#f5f5f5] text-sm leading-relaxed whitespace-pre-wrap">
                  {memory.value}
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-3 mt-8 pt-6 border-t border-neutral-800">
            {isEditing ? (
              <>
                {/* Cancel Button */}
                <button
                  onClick={() => setIsEditing(false)}
                  disabled={isSaving}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-[#f5f5f5] rounded-lg text-sm font-medium transition-colors duration-200 disabled:opacity-50"
                >
                  Cancel
                </button>

                {/* Save Button */}
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSave}
                  disabled={isSaving || editedValue === memory.value}
                  className="flex items-center gap-2 px-4 py-2 bg-[#0229bf] hover:bg-[#0229bf]/90 text-white rounded-lg text-sm font-medium shadow-[0_0_15px_-3px_#0229bf80] transition-all duration-200 disabled:opacity-50"
                >
                  <AnimatePresence mode="wait">
                    {showSuccess ? (
                      <motion.div
                        key="success"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                      >
                        <Check className="w-4 h-4" />
                      </motion.div>
                    ) : isSaving ? (
                      <motion.div
                        key="loading"
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                      />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                  </AnimatePresence>
                  {showSuccess ? "Saved!" : isSaving ? "Saving..." : "Save"}
                </motion.button>
              </>
            ) : (
              <>
                {/* Delete Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDelete}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-sm font-medium transition-all duration-200"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </motion.button>

                {/* Edit Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleEdit}
                  className="flex items-center gap-2 px-4 py-2 bg-[#0229bf] hover:bg-[#0229bf]/90 text-white rounded-lg text-sm font-medium shadow-[0_0_15px_-3px_#0229bf80] transition-all duration-200"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </motion.button>
              </>
            )}
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

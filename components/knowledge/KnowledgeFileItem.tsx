"use client";
import { motion } from "framer-motion";
import { FileText, File, Table, FileCode, Eye, Trash2, Download } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface UploadedFile {
  id: string;
  name: string;
  type: "pdf" | "txt" | "md" | "docx" | "csv";
  size: string;
  uploadedAt: string;
  fileUrl: string;
  mimeType: string;
}

interface KnowledgeFileItemProps {
  file: UploadedFile;
  index: number;
  onViewMetadata: (file: UploadedFile) => void;
  onDelete: (id: string) => void;
}

const fileIcons = {
  pdf: { icon: FileText, color: "text-red-400", bg: "bg-red-500/20" },
  txt: { icon: File, color: "text-muted-foreground", bg: "bg-muted" },
  md: { icon: FileCode, color: "text-purple-400", bg: "bg-purple-500/20" },
  docx: { icon: FileText, color: "text-blue-400", bg: "bg-blue-500/20" },
  csv: { icon: Table, color: "text-green-400", bg: "bg-green-500/20" },
};

const KnowledgeFileItem = ({ file, index, onViewMetadata, onDelete }: KnowledgeFileItemProps) => {
  const config = fileIcons[file.type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      <Card className="p-4 bg-card border-border hover:border-border/80 transition-all">
        <div className="flex items-center gap-4">
          <div className={cn("p-2.5 rounded-lg shrink-0", config.bg)}>
            <Icon className={cn("w-5 h-5", config.color)} />
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-foreground text-sm truncate">{file.name}</h4>
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              <Badge variant="outline" className="text-[10px] uppercase">
                {file.type}
              </Badge>
              <span>•</span>
              <span>{file.size}</span>
              <span>•</span>
              <span>Uploaded {file.uploadedAt}</span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <Button variant="ghost" size="sm" onClick={() => onViewMetadata(file)}>
              <Eye className="w-3.5 h-3.5 mr-1" />
              Metadata
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => onDelete(file.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default KnowledgeFileItem;





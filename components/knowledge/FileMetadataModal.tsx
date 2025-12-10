import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Download, File } from "lucide-react";
import type { UploadedFile } from "./KnowledgeFileItem";
import { toast } from "sonner";

interface FileMetadataModalProps {
  file: UploadedFile | null;
  open: boolean;
  onClose: () => void;
}

const FileMetadataModal = ({ file, open, onClose }: FileMetadataModalProps) => {
  if (!file) return null;

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <File className="w-5 h-5 text-primary" />
            File Metadata
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <div className="flex justify-between items-start">
              <span className="text-sm text-muted-foreground">File Name</span>
              <span className="text-sm text-foreground font-medium text-right max-w-[200px] truncate">
                {file.name}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">File URL</span>
              <div className="flex items-center gap-2">
                <code className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded max-w-[150px] truncate">
                  {file.fileUrl}
                </code>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCopy(file.fileUrl)}>
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">MIME Type</span>
              <span className="text-sm text-foreground">{file.mimeType}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Size</span>
              <span className="text-sm text-foreground">{file.size}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Uploaded</span>
              <span className="text-sm text-foreground">{file.uploadedAt}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Knowledge Item</span>
              <span className="text-sm text-foreground">file_knowledge_{file.id}</span>
            </div>
          </div>

          <div className="pt-4 border-t border-border">
            <Button variant="outline" className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Download File
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FileMetadataModal;




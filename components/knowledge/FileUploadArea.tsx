import { useRef, useState } from "react";
import { Upload, File, X, FileText, Table, FileCode } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface FileUploadAreaProps {
  onUpload: (files: File[]) => void;
}

const supportedTypes = [
  { ext: "PDF", icon: FileText, color: "text-red-400" },
  { ext: "TXT", icon: File, color: "text-muted-foreground" },
  { ext: "MD", icon: FileCode, color: "text-purple-400" },
  { ext: "DOCX", icon: FileText, color: "text-blue-400" },
  { ext: "CSV", icon: Table, color: "text-green-400" },
];

const FileUploadArea = ({ onUpload }: FileUploadAreaProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    onUpload(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onUpload(Array.from(e.target.files));
    }
  };

  return (
    <Card
      className={cn(
        "p-8 border-2 border-dashed transition-colors",
        isDragging ? "border-primary bg-primary/5" : "border-border bg-card"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 rounded-full bg-primary/10">
            <Upload className="w-6 h-6 text-primary" />
          </div>
        </div>

        <h3 className="font-medium text-foreground mb-1">
          {isDragging ? "Drop files here" : "Drag and drop files"}
        </h3>
        <p className="text-sm text-muted-foreground mb-4">or click to browse</p>

        <Button onClick={() => fileInputRef.current?.click()}>
          <Upload className="w-4 h-4 mr-2" />
          Upload File
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          multiple
          accept=".pdf,.txt,.md,.doc,.docx,.csv"
          onChange={handleFileSelect}
        />

        <div className="mt-6 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground mb-3">Supported file types:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {supportedTypes.map((type) => {
              const Icon = type.icon;
              return (
                <Badge key={type.ext} variant="outline" className="text-xs">
                  <Icon className={cn("w-3 h-3 mr-1", type.color)} />
                  {type.ext}
                </Badge>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-3">Maximum file size: 10MB</p>
        </div>
      </div>
    </Card>
  );
};

export default FileUploadArea;




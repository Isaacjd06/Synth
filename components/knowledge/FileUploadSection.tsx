"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Upload, File, FileText, FileSpreadsheet, Trash2, 
  CheckCircle, AlertCircle, Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadDate: Date;
  status: 'uploading' | 'processing' | 'complete' | 'error';
  progress: number;
  errorMessage?: string;
}

const acceptedTypes = [
  ".pdf",
  ".txt",
  ".md",
  ".doc",
  ".docx",
  ".csv"
];

export default function FileUploadSection() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load files on mount
  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/knowledge/upload");
      const data = await response.json();
      
      if (data.ok && data.files) {
        setFiles(data.files.map((file: {
          id: string;
          filename: string;
          fileType: string;
          fileSize: number;
          status: string;
          errorMessage?: string;
          createdAt: string;
        }) => ({
          id: file.id,
          name: file.filename,
          type: file.fileType,
          size: file.fileSize,
          uploadDate: new Date(file.createdAt),
          status: file.status as 'uploading' | 'processing' | 'complete' | 'error',
          progress: file.status === 'complete' ? 100 : 0,
          errorMessage: file.errorMessage,
        })));
      }
    } catch (error) {
      console.error("Error loading files:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return <FileText className="w-5 h-5 text-red-400" />;
    if (type.includes('spreadsheet') || type.includes('csv')) return <FileSpreadsheet className="w-5 h-5 text-green-400" />;
    return <File className="w-5 h-5 text-primary" />;
  };

  const getStatusBadge = (status: UploadedFile['status']) => {
    switch (status) {
      case 'uploading':
        return <Badge variant="secondary"><Loader2 className="w-3 h-3 mr-1 animate-spin" />Uploading</Badge>;
      case 'processing':
        return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-500"><Loader2 className="w-3 h-3 mr-1 animate-spin" />Processing</Badge>;
      case 'complete':
        return <Badge variant="secondary" className="bg-green-500/20 text-green-500"><CheckCircle className="w-3 h-3 mr-1" />Complete</Badge>;
      case 'error':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Error</Badge>;
    }
  };

  const handleUpload = async (file: File) => {
    const newFile: UploadedFile = {
      id: crypto.randomUUID(),
      name: file.name,
      type: file.type,
      size: file.size,
      uploadDate: new Date(),
      status: 'uploading',
      progress: 0
    };

    setFiles(prev => [newFile, ...prev]);

    try {
      // Create FormData
      const formData = new FormData();
      formData.append("file", file);

      // Upload file
      const response = await fetch("/api/knowledge/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.ok && data.file) {
        // Update file with server response
        setFiles(prev => prev.map(f => 
          f.id === newFile.id ? {
            ...f,
            id: data.file.id,
            status: data.file.status as 'uploading' | 'processing' | 'complete' | 'error',
            progress: 100
          } : f
        ));
      } else {
        throw new Error(data.error || "Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      setFiles(prev => prev.map(f => 
        f.id === newFile.id ? { 
          ...f, 
          status: 'error',
          errorMessage: error instanceof Error ? error.message : "Upload failed"
        } : f
      ));
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    droppedFiles.forEach(file => handleUpload(file));
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    selectedFiles.forEach(file => handleUpload(file));
    e.target.value = '';
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this file?")) return;
    
    try {
      const response = await fetch(`/api/knowledge/upload?id=${id}`, {
        method: "DELETE",
      });

      const data = await response.json();
      
      if (data.ok) {
        setFiles(prev => prev.filter(f => f.id !== id));
      } else {
        throw new Error(data.error || "Failed to delete file");
      }
    } catch (error) {
      console.error("Delete error:", error);
      // Still remove from UI even if API call fails
      setFiles(prev => prev.filter(f => f.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Upload className="w-5 h-5 text-primary" />
            Knowledge Files
          </CardTitle>
          <CardDescription>
            Upload documents to expand Synth's knowledge. Supported formats: PDF, TXT, Markdown, Word, CSV.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center transition-colors
              ${isDragging 
                ? 'border-primary bg-primary/10' 
                : 'border-border hover:border-primary/50'
              }
            `}
          >
            <Upload className={`w-10 h-10 mx-auto mb-4 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
            <p className="text-foreground mb-2">
              Drag and drop files here, or{' '}
              <label className="text-primary hover:underline cursor-pointer">
                browse
                <input
                  type="file"
                  multiple
                  accept={acceptedTypes.join(',')}
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            </p>
            <p className="text-sm text-muted-foreground">
              {acceptedTypes.join(', ')} files up to 10MB each
            </p>
          </div>

          {/* File List */}
          <div className="space-y-3">
            <AnimatePresence>
              {files.map(file => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="border border-border rounded-lg p-4"
                >
                  <div className="flex items-start gap-3">
                    {getFileIcon(file.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h4 className="font-medium text-foreground truncate">{file.name}</h4>
                        <div className="flex items-center gap-2 shrink-0">
                          {getStatusBadge(file.status)}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(file.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{formatFileSize(file.size)}</span>
                        <span>{file.uploadDate.toLocaleDateString()}</span>
                      </div>

                      {file.status === 'uploading' && (
                        <div className="mt-2">
                          <Progress value={file.progress} className="h-1" />
                          <span className="text-xs text-muted-foreground">{file.progress}%</span>
                        </div>
                      )}

                      {file.status === 'error' && file.errorMessage && (
                        <p className="mt-2 text-xs text-destructive">{file.errorMessage}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {files.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No files uploaded yet. Drag and drop files to get started.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


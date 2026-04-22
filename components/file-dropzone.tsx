"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, File, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface FileDropzoneProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  accept?: Record<string, string[]>;
  maxFiles?: number;
  maxSize?: number;
  multiple?: boolean;
  label?: string;
  description?: string;
}

export function FileDropzone({
  files,
  onFilesChange,
  accept = { "application/pdf": [".pdf"] },
  maxFiles = 10,
  maxSize = 50 * 1024 * 1024, // 50MB
  multiple = true,
  label = "Drop PDF files here",
  description = "or click to browse",
}: FileDropzoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (multiple) {
        onFilesChange([...files, ...acceptedFiles].slice(0, maxFiles));
      } else {
        onFilesChange(acceptedFiles.slice(0, 1));
      }
    },
    [files, onFilesChange, multiple, maxFiles],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxFiles: multiple ? maxFiles - files.length : 1,
    maxSize,
    multiple,
  });

  const removeFile = (index: number) => {
    onFilesChange(files.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          "relative cursor-pointer rounded-xl border-2 border-dashed transition-all duration-200",
          files.length > 0 ? "p-6" : "p-12",
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-muted/50",
        )}
      >
        <input {...getInputProps()} />
        <div
          className={cn(
            "flex items-center justify-center gap-4",
            files.length > 0 ? "flex-row" : "flex-col",
          )}
        >
          <div
            className={cn(
              "flex items-center justify-center rounded-full transition-colors",
              files.length > 0 ? "h-10 w-10" : "h-16 w-16",
              isDragActive ? "bg-primary/10" : "bg-muted",
            )}
          >
            <Upload
              className={cn(
                "transition-colors",
                files.length > 0 ? "h-5 w-5" : "h-8 w-8",
                isDragActive ? "text-primary" : "text-muted-foreground",
              )}
            />
          </div>
          <div className={files.length > 0 ? "text-left" : "text-center"}>
            <p
              className={cn(
                "font-medium text-foreground",
                files.length > 0 ? "text-base" : "text-lg",
              )}
            >
              {files.length > 0 ? "Add more files" : label}
            </p>
            {files.length === 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                {description}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Max {formatFileSize(maxSize)} per file
              {multiple ? `, up to ${maxFiles} files` : ""}
            </p>
          </div>
        </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">
            {files.length} file{files.length !== 1 ? "s" : ""} selected
          </p>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {files.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <File className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => removeFile(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

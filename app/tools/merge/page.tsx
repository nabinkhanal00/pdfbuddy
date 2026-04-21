"use client";

import { useState, useCallback } from "react";
import { PDFDocument } from "pdf-lib";
import { saveAs } from "file-saver";
import { FileStack, Download, Loader2, GripVertical, ArrowUp, ArrowDown } from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ToolLayout } from "@/components/tool-layout";
import { FileDropzone } from "@/components/file-dropzone";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function MergePDFPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const moveFile = useCallback((index: number, direction: "up" | "down") => {
    setFiles((prev) => {
      const newFiles = [...prev];
      const newIndex = direction === "up" ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= newFiles.length) return prev;
      [newFiles[index], newFiles[newIndex]] = [newFiles[newIndex], newFiles[index]];
      return newFiles;
    });
  }, []);

  const mergePDFs = async () => {
    if (files.length < 2) return;

    setIsProcessing(true);
    setProgress(0);

    try {
      const mergedPdf = await PDFDocument.create();

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
        setProgress(((i + 1) / files.length) * 100);
      }

      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([mergedPdfBytes], { type: "application/pdf" });
      saveAs(blob, "merged.pdf");
    } catch (error) {
      console.error("Error merging PDFs:", error);
      alert("An error occurred while merging PDFs. Please try again.");
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <ToolLayout
        title="Merge PDF"
        description="Combine multiple PDF files into a single document. Drag to reorder."
        icon={FileStack}
        iconColor="text-red-600"
        iconBgColor="bg-red-50"
      >
        <div className="space-y-6">
          <FileDropzone
            files={files}
            onFilesChange={setFiles}
            maxFiles={20}
            label="Drop PDF files to merge"
            description="Select multiple files to combine into one PDF"
          />

          {files.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-foreground">File Order</h3>
                <p className="text-sm text-muted-foreground">
                  Drag or use arrows to reorder
                </p>
              </div>
              <div className="space-y-2 rounded-lg border border-border p-4 bg-card">
                {files.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg transition-colors",
                      "bg-muted/50 hover:bg-muted"
                    )}
                  >
                    <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                    <span className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-xs font-medium text-primary">
                      {index + 1}
                    </span>
                    <span className="flex-1 text-sm font-medium text-foreground truncate">
                      {file.name}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => moveFile(index, "up")}
                        disabled={index === 0}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => moveFile(index, "down")}
                        disabled={index === files.length - 1}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {isProcessing && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Merging PDFs...</span>
                    <span className="text-foreground font-medium">{Math.round(progress)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              <Button
                onClick={mergePDFs}
                disabled={files.length < 2 || isProcessing}
                className="w-full"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Merging...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Merge {files.length} PDF{files.length !== 1 ? "s" : ""}
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </ToolLayout>
      <Footer />
    </div>
  );
}

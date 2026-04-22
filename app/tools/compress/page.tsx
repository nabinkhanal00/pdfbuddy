"use client";

import { useState } from "react";
import { Minimize2, Loader2, FileText, TrendingDown } from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ToolLayout } from "@/components/tool-layout";
import { FileDropzone } from "@/components/file-dropzone";
import { ProcessedPdfActions } from "@/components/processed-pdf-actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { usePendingPdfImport } from "@/lib/browser/pdf-handoff";
import { compressPdf } from "@/lib/browser/qpdf";

type CompressionLevel = "low" | "medium" | "high";

export default function CompressPDFPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [compressionLevel, setCompressionLevel] = useState<CompressionLevel>("medium");
  const [result, setResult] = useState<{ original: number; compressed: number } | null>(null);
  const [processedPdf, setProcessedPdf] = useState<{ bytes: Uint8Array; fileName: string } | null>(
    null
  );

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const compressPDF = async () => {
    if (files.length === 0) return;

    setIsProcessing(true);
    setResult(null);

    try {
      const file = files[0];
      const originalSize = file.size;
      const arrayBuffer = await file.arrayBuffer();
      const compressed = await compressPdf(new Uint8Array(arrayBuffer), compressionLevel);

      if (!compressed.outputBytes) {
        throw new Error(compressed.stderr.join("\n") || "Compression failed.");
      }

      const compressedSize = compressed.outputBytes.length;
      setResult({ original: originalSize, compressed: compressedSize });

      const originalName = file.name.replace(/\.pdf$/i, "");
      setProcessedPdf({
        bytes: Uint8Array.from(compressed.outputBytes),
        fileName: `${originalName}-compressed.pdf`,
      });
    } catch (error) {
      console.error("Error compressing PDF:", error);
      alert("An error occurred while compressing the PDF. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  usePendingPdfImport(async (incomingFiles) => {
    setFiles(incomingFiles);
    setResult(null);
    setProcessedPdf(null);
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <ToolLayout
        title="Compress PDF"
        description="Reduce PDF file size while maintaining quality"
        icon={Minimize2}
        iconColor="text-blue-600"
        iconBgColor="bg-blue-50"
      >
        <div className="space-y-6">
          <FileDropzone
            files={files}
            onFilesChange={(f) => {
              setFiles(f);
              setResult(null);
              setProcessedPdf(null);
            }}
            maxFiles={1}
            multiple={false}
            label="Drop a PDF file to compress"
            description="Select a PDF file to reduce its size"
          />

          {files.length > 0 && (
            <div className="space-y-6">
              <div className="p-4 rounded-lg border border-border bg-card">
                <div className="flex items-center gap-3 mb-4">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium text-foreground">{files[0].name}</span>
                  <span className="text-sm text-muted-foreground">
                    ({formatFileSize(files[0].size)})
                  </span>
                </div>

                <div className="space-y-4">
                  <Label className="text-sm font-medium">Compression Level</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { id: "low", label: "Low", desc: "Best quality" },
                      { id: "medium", label: "Medium", desc: "Balanced" },
                      { id: "high", label: "High", desc: "Smallest size" },
                    ].map((level) => (
                      <button
                        key={level.id}
                        onClick={() => {
                          setCompressionLevel(level.id as CompressionLevel);
                          setProcessedPdf(null);
                          setResult(null);
                        }}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          compressionLevel === level.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <span className="block font-medium text-foreground text-sm">
                          {level.label}
                        </span>
                        <span className="block text-xs text-muted-foreground mt-1">
                          {level.desc}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {result && (
                <div className="p-4 rounded-lg border border-green-200 bg-green-50">
                  <div className="flex items-center gap-3 mb-3">
                    <TrendingDown className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-800">Compression Complete</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-green-700">Original Size</p>
                      <p className="font-semibold text-green-900">
                        {formatFileSize(result.original)}
                      </p>
                    </div>
                    <div>
                      <p className="text-green-700">Compressed Size</p>
                      <p className="font-semibold text-green-900">
                        {formatFileSize(result.compressed)}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-green-700 mt-3">
                    {result.compressed <= result.original ? (
                      <>
                        Saved{" "}
                        <span className="font-semibold">
                          {(((result.original - result.compressed) / result.original) * 100).toFixed(1)}%
                        </span>{" "}
                        ({formatFileSize(result.original - result.compressed)})
                      </>
                    ) : (
                      <>
                        This profile produced a larger file by{" "}
                        <span className="font-semibold">
                          {formatFileSize(result.compressed - result.original)}
                        </span>
                        . You can still download it or send it into another step below.
                      </>
                    )}
                  </p>
                </div>
              )}

              <Button
                onClick={compressPDF}
                disabled={isProcessing}
                className="w-full"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Compressing...
                  </>
                ) : (
                  "Compress PDF"
                )}
              </Button>

              {processedPdf && (
                <ProcessedPdfActions
                  currentToolId="compress"
                  fileName={processedPdf.fileName}
                  outputBytes={processedPdf.bytes}
                />
              )}
            </div>
          )}
        </div>
      </ToolLayout>
      <Footer />
    </div>
  );
}

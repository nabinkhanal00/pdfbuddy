"use client";

import { useState } from "react";
import { PDFDocument, degrees } from "pdf-lib";
import { RotateCw, Loader2, FileText, RotateCcw } from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ToolLayout } from "@/components/tool-layout";
import { FileDropzone } from "@/components/file-dropzone";
import { ProcessedPdfActions } from "@/components/processed-pdf-actions";
import { Button } from "@/components/ui/button";
import { usePendingPdfImport } from "@/lib/browser/pdf-handoff";

type RotationAngle = 90 | 180 | 270;

export default function RotatePDFPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rotation, setRotation] = useState<RotationAngle>(90);
  const [totalPages, setTotalPages] = useState(0);
  const [processedPdf, setProcessedPdf] = useState<{ bytes: Uint8Array; fileName: string } | null>(
    null
  );

  const handleFileChange = async (newFiles: File[]) => {
    setFiles(newFiles);
    setProcessedPdf(null);
    if (newFiles.length > 0) {
      try {
        const arrayBuffer = await newFiles[0].arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        setTotalPages(pdf.getPageCount());
      } catch (error) {
        console.error("Error reading PDF:", error);
      }
    } else {
      setTotalPages(0);
    }
  };

  usePendingPdfImport(handleFileChange);

  const rotatePDF = async () => {
    if (files.length === 0) return;

    setIsProcessing(true);

    try {
      const file = files[0];
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);

      const pages = pdf.getPages();
      pages.forEach((page) => {
        const currentRotation = page.getRotation().angle;
        page.setRotation(degrees(currentRotation + rotation));
      });

      const rotatedBytes = new Uint8Array(await pdf.save());
      const originalName = file.name.replace(/\.pdf$/i, "");
      setProcessedPdf({
        bytes: rotatedBytes,
        fileName: `${originalName}-rotated.pdf`,
      });
    } catch (error) {
      console.error("Error rotating PDF:", error);
      alert("An error occurred while rotating the PDF. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <ToolLayout
        title="Rotate PDF"
        description="Rotate all pages of your PDF to the correct orientation"
        icon={RotateCw}
        iconColor="text-cyan-600"
        iconBgColor="bg-cyan-50"
      >
        <div className="space-y-6">
          <FileDropzone
            files={files}
            onFilesChange={handleFileChange}
            maxFiles={1}
            multiple={false}
            label="Drop a PDF file to rotate"
            description="Select a PDF file"
          />

          {files.length > 0 && totalPages > 0 && (
            <div className="space-y-6">
              <div className="p-4 rounded-lg border border-border bg-card">
                <div className="flex items-center gap-3 mb-4">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium text-foreground">{files[0].name}</span>
                  <span className="text-sm text-muted-foreground">
                    ({totalPages} page{totalPages !== 1 ? "s" : ""})
                  </span>
                </div>

                <div className="space-y-4">
                  <p className="text-sm font-medium text-foreground">Rotation Angle</p>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { angle: 90, icon: RotateCw, label: "90° Right" },
                      { angle: 180, icon: RotateCw, label: "180°" },
                      { angle: 270, icon: RotateCcw, label: "90° Left" },
                    ].map((option) => {
                      const Icon = option.icon;
                      return (
                        <button
                          key={option.angle}
                          onClick={() => {
                            setRotation(option.angle as RotationAngle);
                            setProcessedPdf(null);
                          }}
                          className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-all ${
                            rotation === option.angle
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <Icon
                            className={`h-6 w-6 ${
                              rotation === option.angle ? "text-primary" : "text-muted-foreground"
                            }`}
                          />
                          <span className="text-sm font-medium text-foreground">
                            {option.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <Button
                onClick={rotatePDF}
                disabled={isProcessing}
                className="w-full"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Rotating...
                  </>
                ) : (
                  "Apply Rotation"
                )}
              </Button>

              {processedPdf && (
                <ProcessedPdfActions
                  currentToolId="rotate"
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

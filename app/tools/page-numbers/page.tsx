"use client";

import { useState } from "react";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { ListOrdered, Loader2, FileText } from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ToolLayout } from "@/components/tool-layout";
import { FileDropzone } from "@/components/file-dropzone";
import { ProcessedPdfActions } from "@/components/processed-pdf-actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { usePendingPdfImport } from "@/lib/browser/pdf-handoff";

type Position = "bottom-center" | "bottom-left" | "bottom-right" | "top-center" | "top-left" | "top-right";

export default function PageNumbersPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [position, setPosition] = useState<Position>("bottom-center");
  const [startNumber, setStartNumber] = useState(1);
  const [format, setFormat] = useState<"number" | "of">("number");
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

  const addPageNumbers = async () => {
    if (files.length === 0) return;

    setIsProcessing(true);

    try {
      const file = files[0];
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      const pages = pdf.getPages();
      const font = await pdf.embedFont(StandardFonts.Helvetica);

      pages.forEach((page, index) => {
        const pageNum = index + startNumber;
        const text = format === "number" ? `${pageNum}` : `${pageNum} of ${pages.length}`;
        const { width, height } = page.getSize();
        const textWidth = font.widthOfTextAtSize(text, 10);

        let x: number;
        let y: number;

        const margin = 30;

        if (position.includes("left")) {
          x = margin;
        } else if (position.includes("right")) {
          x = width - textWidth - margin;
        } else {
          x = (width - textWidth) / 2;
        }

        if (position.includes("top")) {
          y = height - margin;
        } else {
          y = margin;
        }

        page.drawText(text, {
          x,
          y,
          size: 10,
          font,
          color: rgb(0.3, 0.3, 0.3),
        });
      });

      const pdfBytes = new Uint8Array(await pdf.save());
      const originalName = file.name.replace(/\.pdf$/i, "");
      setProcessedPdf({
        bytes: pdfBytes,
        fileName: `${originalName}-numbered.pdf`,
      });
    } catch (error) {
      console.error("Error adding page numbers:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const positions: { id: Position; label: string }[] = [
    { id: "top-left", label: "Top Left" },
    { id: "top-center", label: "Top Center" },
    { id: "top-right", label: "Top Right" },
    { id: "bottom-left", label: "Bottom Left" },
    { id: "bottom-center", label: "Bottom Center" },
    { id: "bottom-right", label: "Bottom Right" },
  ];

  usePendingPdfImport(handleFileChange);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <ToolLayout
        title="Page Numbers"
        description="Add page numbers to your PDF document"
        icon={ListOrdered}
        iconColor="text-amber-600"
        iconBgColor="bg-amber-50"
      >
        <div className="space-y-6">
          <FileDropzone
            files={files}
            onFilesChange={handleFileChange}
            maxFiles={1}
            multiple={false}
            label="Drop a PDF file"
            description="Select a PDF to add page numbers"
          />

          {files.length > 0 && totalPages > 0 && (
            <div className="space-y-6">
              <div className="p-4 rounded-lg border border-border bg-card">
                <div className="flex items-center gap-3 mb-6">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium text-foreground">{files[0].name}</span>
                  <span className="text-sm text-muted-foreground">
                    ({totalPages} page{totalPages !== 1 ? "s" : ""})
                  </span>
                </div>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Position</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {positions.map((pos) => (
                        <button
                          key={pos.id}
                          onClick={() => {
                            setPosition(pos.id);
                            setProcessedPdf(null);
                          }}
                          className={`p-2 rounded-lg border text-xs font-medium transition-all ${
                            position === pos.id
                              ? "border-primary bg-primary/5 text-primary"
                              : "border-border text-muted-foreground hover:border-primary/50"
                          }`}
                        >
                          {pos.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startNumber" className="text-sm font-medium">
                        Start Number
                      </Label>
                      <Input
                        id="startNumber"
                        type="number"
                        min={1}
                        value={startNumber}
                        onChange={(e) => {
                          setStartNumber(parseInt(e.target.value) || 1);
                          setProcessedPdf(null);
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Format</Label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setFormat("number");
                            setProcessedPdf(null);
                          }}
                          className={`flex-1 p-2 rounded-lg border text-sm transition-all ${
                            format === "number"
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          1, 2, 3
                        </button>
                        <button
                          onClick={() => {
                            setFormat("of");
                            setProcessedPdf(null);
                          }}
                          className={`flex-1 p-2 rounded-lg border text-sm transition-all ${
                            format === "of"
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          1 of 10
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Button onClick={addPageNumbers} disabled={isProcessing} className="w-full" size="lg">
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adding Numbers...
                  </>
                ) : (
                  "Add Page Numbers"
                )}
              </Button>

              {processedPdf && (
                <ProcessedPdfActions
                  currentToolId="page-numbers"
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

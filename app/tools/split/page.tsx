"use client";

import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { saveAs } from "file-saver";
import JSZip from "jszip";
import { Scissors, Download, Loader2, FileText } from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ToolLayout } from "@/components/tool-layout";
import { FileDropzone } from "@/components/file-dropzone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type SplitMode = "range" | "extract" | "every";

export default function SplitPDFPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [splitMode, setSplitMode] = useState<SplitMode>("range");
  const [pageRange, setPageRange] = useState("");
  const [totalPages, setTotalPages] = useState(0);

  const handleFileChange = async (newFiles: File[]) => {
    setFiles(newFiles);
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

  const parsePageRange = (range: string, total: number): number[] => {
    const pages: Set<number> = new Set();
    const parts = range.split(",").map((p) => p.trim());

    for (const part of parts) {
      if (part.includes("-")) {
        const [start, end] = part.split("-").map((n) => parseInt(n.trim()));
        if (!isNaN(start) && !isNaN(end)) {
          for (let i = Math.max(1, start); i <= Math.min(total, end); i++) {
            pages.add(i);
          }
        }
      } else {
        const page = parseInt(part);
        if (!isNaN(page) && page >= 1 && page <= total) {
          pages.add(page);
        }
      }
    }

    return Array.from(pages).sort((a, b) => a - b);
  };

  const splitPDF = async () => {
    if (files.length === 0) return;

    setIsProcessing(true);

    try {
      const file = files[0];
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      const pageCount = pdf.getPageCount();

      if (splitMode === "range" || splitMode === "extract") {
        const pages = pageRange
          ? parsePageRange(pageRange, pageCount)
          : Array.from({ length: pageCount }, (_, i) => i + 1);

        const newPdf = await PDFDocument.create();
        const copiedPages = await newPdf.copyPages(
          pdf,
          pages.map((p) => p - 1)
        );
        copiedPages.forEach((page) => newPdf.addPage(page));

        const pdfBytes = await newPdf.save();
        const blob = new Blob([pdfBytes], { type: "application/pdf" });
        saveAs(blob, `extracted-pages.pdf`);
      } else if (splitMode === "every") {
        const zip = new JSZip();

        for (let i = 0; i < pageCount; i++) {
          const newPdf = await PDFDocument.create();
          const [copiedPage] = await newPdf.copyPages(pdf, [i]);
          newPdf.addPage(copiedPage);
          const pdfBytes = await newPdf.save();
          zip.file(`page-${i + 1}.pdf`, pdfBytes);
        }

        const zipBlob = await zip.generateAsync({ type: "blob" });
        saveAs(zipBlob, "split-pages.zip");
      }
    } catch (error) {
      console.error("Error splitting PDF:", error);
      alert("An error occurred while splitting the PDF. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <ToolLayout
        title="Split PDF"
        description="Extract specific pages or split PDF into individual files"
        icon={Scissors}
        iconColor="text-orange-600"
        iconBgColor="bg-orange-50"
      >
        <div className="space-y-6">
          <FileDropzone
            files={files}
            onFilesChange={handleFileChange}
            maxFiles={1}
            multiple={false}
            label="Drop a PDF file to split"
            description="Select a single PDF file"
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
                  <Label className="text-sm font-medium">Split Mode</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { id: "range", label: "Extract Range", desc: "Get specific pages" },
                      { id: "extract", label: "Custom Pages", desc: "Pick individual pages" },
                      { id: "every", label: "Split All", desc: "One file per page" },
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        onClick={() => setSplitMode(mode.id as SplitMode)}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          splitMode === mode.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <span className="block font-medium text-foreground text-sm">
                          {mode.label}
                        </span>
                        <span className="block text-xs text-muted-foreground mt-1">
                          {mode.desc}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {(splitMode === "range" || splitMode === "extract") && (
                  <div className="mt-4 space-y-2">
                    <Label htmlFor="pageRange" className="text-sm font-medium">
                      Page Range
                    </Label>
                    <Input
                      id="pageRange"
                      placeholder={`e.g., 1-5, 8, 10-12 (1-${totalPages})`}
                      value={pageRange}
                      onChange={(e) => setPageRange(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter page numbers separated by commas, or ranges like 1-5
                    </p>
                  </div>
                )}
              </div>

              <Button
                onClick={splitPDF}
                disabled={isProcessing}
                className="w-full"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    {splitMode === "every" ? "Download ZIP" : "Extract Pages"}
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

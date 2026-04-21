"use client";

import { useState, useEffect } from "react";
import { PDFDocument } from "pdf-lib";
import { saveAs } from "file-saver";
import { Trash2, Download, Loader2, FileText, Check } from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ToolLayout } from "@/components/tool-layout";
import { FileDropzone } from "@/components/file-dropzone";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function RemovePagesPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [pagePreviews, setPagePreviews] = useState<string[]>([]);
  const [pdfjsLib, setPdfjsLib] = useState<typeof import("pdfjs-dist") | null>(null);

  useEffect(() => {
    import("pdfjs-dist").then((pdfjs) => {
      pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;
      setPdfjsLib(pdfjs);
    });
  }, []);

  const handleFileChange = async (newFiles: File[]) => {
    setFiles(newFiles);
    setSelectedPages(new Set());
    setPagePreviews([]);

    if (newFiles.length > 0 && pdfjsLib) {
      try {
        const arrayBuffer = await newFiles[0].arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        setTotalPages(pdf.numPages);

        // Generate previews for first 20 pages
        const previews: string[] = [];
        const maxPreviews = Math.min(pdf.numPages, 20);
        
        for (let i = 1; i <= maxPreviews; i++) {
          const page = await pdf.getPage(i);
          const scale = 0.3;
          const viewport = page.getViewport({ scale });
          
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d")!;
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          
          await page.render({
            canvasContext: context,
            viewport: viewport,
          }).promise;
          
          previews.push(canvas.toDataURL());
        }
        
        setPagePreviews(previews);
      } catch (error) {
        console.error("Error reading PDF:", error);
      }
    } else {
      setTotalPages(0);
    }
  };

  const togglePage = (pageNum: number) => {
    const newSelected = new Set(selectedPages);
    if (newSelected.has(pageNum)) {
      newSelected.delete(pageNum);
    } else {
      newSelected.add(pageNum);
    }
    setSelectedPages(newSelected);
  };

  const removePages = async () => {
    if (files.length === 0 || selectedPages.size === 0) return;
    if (selectedPages.size === totalPages) {
      alert("You cannot remove all pages from the PDF.");
      return;
    }

    setIsProcessing(true);

    try {
      const file = files[0];
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);

      // Get pages to keep (not selected for removal)
      const pagesToKeep = Array.from({ length: totalPages }, (_, i) => i)
        .filter((i) => !selectedPages.has(i + 1));

      const newPdf = await PDFDocument.create();
      const copiedPages = await newPdf.copyPages(pdf, pagesToKeep);
      copiedPages.forEach((page) => newPdf.addPage(page));

      const pdfBytes = await newPdf.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const originalName = file.name.replace(/\.pdf$/i, "");
      saveAs(blob, `${originalName}-modified.pdf`);
    } catch (error) {
      console.error("Error removing pages:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <ToolLayout
        title="Remove Pages"
        description="Delete unwanted pages from your PDF document"
        icon={Trash2}
        iconColor="text-rose-600"
        iconBgColor="bg-rose-50"
      >
        <div className="space-y-6">
          <FileDropzone
            files={files}
            onFilesChange={handleFileChange}
            maxFiles={1}
            multiple={false}
            label="Drop a PDF file"
            description="Select a PDF to remove pages from"
          />

          {files.length > 0 && totalPages > 0 && (
            <div className="space-y-6">
              <div className="p-4 rounded-lg border border-border bg-card">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium text-foreground">{files[0].name}</span>
                    <span className="text-sm text-muted-foreground">
                      ({totalPages} page{totalPages !== 1 ? "s" : ""})
                    </span>
                  </div>
                  {selectedPages.size > 0 && (
                    <span className="text-sm text-rose-600 font-medium">
                      {selectedPages.size} selected for removal
                    </span>
                  )}
                </div>

                <p className="text-sm text-muted-foreground mb-4">
                  Click on pages to select them for removal
                </p>

                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3 max-h-96 overflow-y-auto p-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => togglePage(pageNum)}
                      className={cn(
                        "relative aspect-[3/4] rounded-lg border-2 transition-all overflow-hidden",
                        selectedPages.has(pageNum)
                          ? "border-rose-500 ring-2 ring-rose-200"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      {pagePreviews[pageNum - 1] ? (
                        <img
                          src={pagePreviews[pageNum - 1]}
                          alt={`Page ${pageNum}`}
                          className={cn(
                            "w-full h-full object-cover",
                            selectedPages.has(pageNum) && "opacity-50"
                          )}
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <span className="text-xs text-muted-foreground">{pageNum}</span>
                        </div>
                      )}
                      <span className="absolute bottom-1 left-1 text-xs bg-black/70 text-white px-1.5 py-0.5 rounded">
                        {pageNum}
                      </span>
                      {selectedPages.has(pageNum) && (
                        <div className="absolute inset-0 bg-rose-500/20 flex items-center justify-center">
                          <div className="h-6 w-6 rounded-full bg-rose-500 flex items-center justify-center">
                            <Check className="h-4 w-4 text-white" />
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={removePages}
                disabled={isProcessing || selectedPages.size === 0}
                className="w-full"
                size="lg"
                variant={selectedPages.size > 0 ? "destructive" : "default"}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Removing Pages...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    {selectedPages.size > 0
                      ? `Remove ${selectedPages.size} Page${selectedPages.size !== 1 ? "s" : ""} & Download`
                      : "Select Pages to Remove"}
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

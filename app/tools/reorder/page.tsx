"use client";

import { useState, useEffect } from "react";
import { PDFDocument } from "pdf-lib";
import { saveAs } from "file-saver";
import { ArrowRightLeft, Download, Loader2, FileText, ArrowUp, ArrowDown } from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ToolLayout } from "@/components/tool-layout";
import { FileDropzone } from "@/components/file-dropzone";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PageItem {
  originalIndex: number;
  preview: string;
}

export default function ReorderPagesPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [pdfjsLib, setPdfjsLib] = useState<typeof import("pdfjs-dist") | null>(null);

  useEffect(() => {
    import("pdfjs-dist").then((pdfjs) => {
      pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;
      setPdfjsLib(pdfjs);
    });
  }, []);

  const handleFileChange = async (newFiles: File[]) => {
    setFiles(newFiles);
    setPages([]);

    if (newFiles.length > 0 && pdfjsLib) {
      try {
        const arrayBuffer = await newFiles[0].arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        
        const newPages: PageItem[] = [];
        const maxPages = Math.min(pdf.numPages, 30);
        
        for (let i = 1; i <= maxPages; i++) {
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
          
          newPages.push({
            originalIndex: i - 1,
            preview: canvas.toDataURL(),
          });
        }
        
        // If there are more pages, add placeholders
        for (let i = maxPages; i < pdf.numPages; i++) {
          newPages.push({
            originalIndex: i,
            preview: "",
          });
        }
        
        setPages(newPages);
      } catch (error) {
        console.error("Error reading PDF:", error);
      }
    }
  };

  const movePage = (index: number, direction: "up" | "down") => {
    const newPages = [...pages];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newPages.length) return;
    [newPages[index], newPages[newIndex]] = [newPages[newIndex], newPages[index]];
    setPages(newPages);
  };

  const reorderPDF = async () => {
    if (files.length === 0 || pages.length === 0) return;

    setIsProcessing(true);

    try {
      const file = files[0];
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);

      const newOrder = pages.map((p) => p.originalIndex);
      const newPdf = await PDFDocument.create();
      const copiedPages = await newPdf.copyPages(pdf, newOrder);
      copiedPages.forEach((page) => newPdf.addPage(page));

      const pdfBytes = await newPdf.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const originalName = file.name.replace(/\.pdf$/i, "");
      saveAs(blob, `${originalName}-reordered.pdf`);
    } catch (error) {
      console.error("Error reordering PDF:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <ToolLayout
        title="Reorder Pages"
        description="Rearrange PDF pages in any order you want"
        icon={ArrowRightLeft}
        iconColor="text-fuchsia-600"
        iconBgColor="bg-fuchsia-50"
      >
        <div className="space-y-6">
          <FileDropzone
            files={files}
            onFilesChange={handleFileChange}
            maxFiles={1}
            multiple={false}
            label="Drop a PDF file"
            description="Select a PDF to reorder pages"
          />

          {files.length > 0 && pages.length > 0 && (
            <div className="space-y-6">
              <div className="p-4 rounded-lg border border-border bg-card">
                <div className="flex items-center gap-3 mb-4">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium text-foreground">{files[0].name}</span>
                  <span className="text-sm text-muted-foreground">
                    ({pages.length} page{pages.length !== 1 ? "s" : ""})
                  </span>
                </div>

                <p className="text-sm text-muted-foreground mb-4">
                  Use the arrows to reorder pages
                </p>

                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 max-h-[500px] overflow-y-auto p-1">
                  {pages.map((page, index) => (
                    <div
                      key={`${page.originalIndex}-${index}`}
                      className="relative group"
                    >
                      <div
                        className={cn(
                          "aspect-[3/4] rounded-lg border-2 border-border overflow-hidden bg-muted"
                        )}
                      >
                        {page.preview ? (
                          <img
                            src={page.preview}
                            alt={`Page ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-sm text-muted-foreground">
                              Page {page.originalIndex + 1}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="absolute top-1 left-1 flex h-5 w-5 items-center justify-center rounded bg-primary text-[10px] font-bold text-primary-foreground">
                        {index + 1}
                      </div>
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-1">
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => movePage(index, "up")}
                          disabled={index === 0}
                        >
                          <ArrowUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => movePage(index, "down")}
                          disabled={index === pages.length - 1}
                        >
                          <ArrowDown className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={reorderPDF} disabled={isProcessing} className="w-full" size="lg">
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Reordering...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Save Reordered PDF
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

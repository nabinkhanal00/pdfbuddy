"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { X, ExternalLink, Download, ChevronLeft, ChevronRight, Loader2, ZoomIn, ZoomOut } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getPdfJs } from "@/lib/browser/pdfjs";
import { cn } from "@/lib/utils";

interface PdfPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  outputBytes: Uint8Array;
  fileName: string;
}

export function PdfPreviewModal({
  isOpen,
  onClose,
  outputBytes,
  fileName,
}: PdfPreviewModalProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.2);
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);

  const renderPage = useCallback(async (pageNum: number, pdf: any) => {
    if (!containerRef.current || !pdf) return;

    try {
      const page = await pdf.getPage(pageNum);
      // Increase the base scale to ensure high quality even before device pixel ratio
      const outputScale = window.devicePixelRatio || 1;
      const viewport = page.getViewport({ scale: scale * outputScale });
      
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d")!;
      
      // Set the internal canvas size to the scaled size
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      // Set the display size (CSS) to the intended size
      canvas.style.width = `${viewport.width / outputScale}px`;
      canvas.style.height = `${viewport.height / outputScale}px`;
      canvas.className = "shadow-2xl rounded-sm bg-white mb-8 mx-auto block";

      // Clear container and add canvas
      const container = containerRef.current;
      container.innerHTML = "";
      container.appendChild(canvas);

      await page.render({
        canvasContext: context,
        viewport: viewport,
      }).promise;
    } catch (error) {
      console.error("Error rendering page:", error);
    }
  }, [scale]);

  useEffect(() => {
    if (!isOpen) {
      setPdfDoc(null);
      setNumPages(0);
      setCurrentPage(1);
      return;
    }

    const loadPdf = async () => {
      setIsLoading(true);
      try {
        const pdfjs = await getPdfJs();
        // Slice the bytes to avoid "ArrayBuffer at index 0 is already detached" error
        const bytesCopy = outputBytes.slice();
        const loadingTask = pdfjs.getDocument({ data: bytesCopy });
        const pdf = await loadingTask.promise;
        setPdfDoc(pdf);
        setNumPages(pdf.numPages);
        setCurrentPage(1);
      } catch (error) {
        console.error("PDF Buddy: Error loading PDF for preview:", error);
      } finally {
        setIsLoading(false);
      }
    };

    void loadPdf();
  }, [isOpen, outputBytes]);

  useEffect(() => {
    if (pdfDoc && currentPage) {
      void renderPage(currentPage, pdfDoc);
    }
  }, [pdfDoc, currentPage, renderPage]);

  const changePage = (offset: number) => {
    setCurrentPage((prev) => Math.min(Math.max(1, prev + offset), numPages));
  };

  const handleZoom = (delta: number) => {
    setScale((prev) => Math.min(Math.max(0.5, prev + delta), 3));
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[95vw] sm:max-w-5xl h-[92vh] flex flex-col p-0 overflow-hidden border-border bg-background shadow-2xl">
        <DialogHeader className="p-3 sm:p-4 border-b shrink-0 flex flex-row items-center justify-between space-y-0 bg-card">
          <DialogTitle className="text-sm sm:text-base font-semibold truncate max-w-[40%] text-foreground">
            {fileName}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Preview of the processed PDF file
          </DialogDescription>
          
          <div className="flex items-center gap-1 sm:gap-4 flex-1 justify-center px-2">
            <div className="flex items-center gap-0.5 bg-muted rounded-lg p-0.5">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => changePage(-1)} 
                disabled={currentPage <= 1}
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="px-2 text-xs font-medium min-w-[60px] text-center text-muted-foreground">
                {currentPage} / {numPages}
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => changePage(1)} 
                disabled={currentPage >= numPages}
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="hidden sm:flex items-center gap-0.5 bg-muted rounded-lg p-0.5">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => handleZoom(-0.2)}
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => handleZoom(0.2)}
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="w-10 h-9 shrink-0" />
        </DialogHeader>
        
        <div className="flex-1 w-full bg-muted/50 overflow-auto p-4 sm:p-8 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading preview...</p>
            </div>
          ) : (
            <div ref={containerRef} className="flex flex-col items-center min-h-full pb-8" />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import Image from "next/image";
import { useCallback, useState } from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { PDFDocument } from "pdf-lib";
import {
  ArrowRightLeft,
  Loader2,
  FileText,
  ArrowUp,
  ArrowDown,
  GripVertical,
} from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ToolLayout } from "@/components/tool-layout";
import { FileDropzone } from "@/components/file-dropzone";
import { ProcessedPdfActions } from "@/components/processed-pdf-actions";
import { Button } from "@/components/ui/button";
import { usePendingPdfImport } from "@/lib/browser/pdf-handoff";
import { getPdfJs } from "@/lib/browser/pdfjs";
import { cn } from "@/lib/utils";

interface PageItem {
  id: string;
  originalIndex: number;
  preview: string;
}

interface SortablePageCardProps {
  index: number;
  onMove: (index: number, direction: "up" | "down") => void;
  page: PageItem;
  total: number;
}

function SortablePageCard({ index, onMove, page, total }: SortablePageCardProps) {
  const { attributes, isDragging, listeners, setNodeRef, transform, transition } = useSortable({
    id: page.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn("relative group", isDragging && "z-10")}
    >
      <div className="absolute right-1 top-1 z-10 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          className="rounded-full bg-black/65 p-1 text-white"
          aria-label={`Drag page ${index + 1}`}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </div>
      <div
        className={cn(
          "aspect-[3/4] rounded-lg border-2 border-border overflow-hidden bg-muted",
          isDragging && "shadow-xl"
        )}
      >
        {page.preview ? (
          <div className="relative h-full w-full">
            <Image
              src={page.preview}
              alt={`Page ${index + 1}`}
              fill
              unoptimized
              sizes="(max-width: 768px) 30vw, 12vw"
              className="object-cover"
            />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-sm text-muted-foreground">Page {page.originalIndex + 1}</span>
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
          onClick={() => onMove(index, "up")}
          disabled={index === 0}
        >
          <ArrowUp className="h-3 w-3" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          className="h-7 w-7"
          onClick={() => onMove(index, "down")}
          disabled={index === total - 1}
        >
          <ArrowDown className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

export default function ReorderPagesPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [processedPdf, setProcessedPdf] = useState<{ bytes: Uint8Array; fileName: string } | null>(
    null
  );
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleFileChange = useCallback(async (newFiles: File[]) => {
    setFiles(newFiles);
    setPages([]);
    setProcessedPdf(null);

    if (newFiles.length > 0) {
      try {
        const pdfjsLib = await getPdfJs();
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
            canvas,
            canvasContext: context,
            viewport: viewport,
          }).promise;

          newPages.push({
            id: `page-${i - 1}`,
            originalIndex: i - 1,
            preview: canvas.toDataURL(),
          });
        }

        // If there are more pages, add placeholders
        for (let i = maxPages; i < pdf.numPages; i++) {
          newPages.push({
            id: `page-${i}`,
            originalIndex: i,
            preview: "",
          });
        }

        setPages(newPages);
      } catch (error) {
        console.error("Error reading PDF:", error);
      }
    }
  }, []);

  const movePage = (index: number, direction: "up" | "down") => {
    setPages((previousPages) => {
      const nextIndex = direction === "up" ? index - 1 : index + 1;
      if (nextIndex < 0 || nextIndex >= previousPages.length) {
        return previousPages;
      }

      return arrayMove(previousPages, index, nextIndex);
    });
    setProcessedPdf(null);
  };

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    setPages((previousPages) => {
      const oldIndex = previousPages.findIndex((page) => page.id === active.id);
      const newIndex = previousPages.findIndex((page) => page.id === over.id);

      if (oldIndex < 0 || newIndex < 0) {
        return previousPages;
      }

      return arrayMove(previousPages, oldIndex, newIndex);
    });
    setProcessedPdf(null);
  }, []);

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

      const pdfBytes = new Uint8Array(await newPdf.save());
      const originalName = file.name.replace(/\.pdf$/i, "");
      setProcessedPdf({
        bytes: pdfBytes,
        fileName: `${originalName}-reordered.pdf`,
      });
    } catch (error) {
      console.error("Error reordering PDF:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  usePendingPdfImport(handleFileChange);

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
                  Drag the handle or use the arrows to reorder pages
                </p>

                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={pages.map((page) => page.id)} strategy={rectSortingStrategy}>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 max-h-[500px] overflow-y-auto p-1">
                      {pages.map((page, index) => (
                        <SortablePageCard
                          key={page.id}
                          index={index}
                          onMove={movePage}
                          page={page}
                          total={pages.length}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>

              <Button onClick={reorderPDF} disabled={isProcessing} className="w-full" size="lg">
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Reordering...
                  </>
                ) : (
                  "Apply Page Order"
                )}
              </Button>

              {processedPdf && (
                <ProcessedPdfActions
                  currentToolId="reorder"
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

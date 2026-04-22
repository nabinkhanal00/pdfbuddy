"use client";

import { useState, useCallback } from "react";
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
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { PDFDocument } from "pdf-lib";
import { saveAs } from "file-saver";
import { FileStack, Download, Loader2, GripVertical, ArrowUp, ArrowDown } from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ToolLayout } from "@/components/tool-layout";
import { FileDropzone } from "@/components/file-dropzone";
import { Button } from "@/components/ui/button";
import type { QueuedFile } from "@/lib/browser/file-queue";
import { reconcileQueuedFiles } from "@/lib/browser/file-queue";
import { usePendingPdfImport } from "@/lib/browser/pdf-handoff";
import { cn } from "@/lib/utils";

interface SortableMergeFileRowProps {
  file: QueuedFile;
  index: number;
  onMove: (index: number, direction: "up" | "down") => void;
  total: number;
}

function SortableMergeFileRow({ file, index, onMove, total }: SortableMergeFileRowProps) {
  const { attributes, isDragging, listeners, setNodeRef, transform, transition } = useSortable({
    id: file.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(
        "flex items-center gap-3 rounded-lg bg-muted/50 p-3 transition-colors",
        "hover:bg-muted",
        isDragging && "bg-card shadow-lg ring-1 ring-border"
      )}
    >
      <button
        type="button"
        className="cursor-grab text-muted-foreground active:cursor-grabbing"
        aria-label={`Drag ${file.file.name}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" />
      </button>
      <span className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-xs font-medium text-primary">
        {index + 1}
      </span>
      <span className="flex-1 truncate text-sm font-medium text-foreground">{file.file.name}</span>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onMove(index, "up")}
          disabled={index === 0}
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onMove(index, "down")}
          disabled={index === total - 1}
        >
          <ArrowDown className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function MergePDFPage() {
  const [files, setFiles] = useState<QueuedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

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

  const handleFilesChange = useCallback((nextFiles: File[]) => {
    setFiles((previousFiles) => reconcileQueuedFiles(nextFiles, previousFiles));
  }, []);

  usePendingPdfImport(handleFilesChange);

  const moveFile = useCallback((index: number, direction: "up" | "down") => {
    setFiles((prev) => {
      const newFiles = [...prev];
      const newIndex = direction === "up" ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= newFiles.length) return prev;
      return arrayMove(newFiles, index, newIndex);
    });
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    setFiles((previousFiles) => {
      const oldIndex = previousFiles.findIndex((file) => file.id === active.id);
      const newIndex = previousFiles.findIndex((file) => file.id === over.id);

      if (oldIndex < 0 || newIndex < 0) {
        return previousFiles;
      }

      return arrayMove(previousFiles, oldIndex, newIndex);
    });
  }, []);

  const mergePDFs = async () => {
    if (files.length < 2) return;

    setIsProcessing(true);
    setProgress(0);

    try {
      const mergedPdf = await PDFDocument.create();

      for (let i = 0; i < files.length; i++) {
        const file = files[i].file;
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
            files={files.map((entry) => entry.file)}
            onFilesChange={handleFilesChange}
            maxFiles={20}
            label="Drop PDF files to merge"
            description="Select multiple files to combine into one PDF"
          />

          {files.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-foreground">File Order</h3>
                <p className="text-sm text-muted-foreground">
                  Drag the handle or use the arrows to reorder
                </p>
              </div>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={files.map((file) => file.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2 rounded-lg border border-border bg-card p-4">
                    {files.map((file, index) => (
                      <SortableMergeFileRow
                        key={file.id}
                        file={file}
                        index={index}
                        onMove={moveFile}
                        total={files.length}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

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

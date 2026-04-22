"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { saveAs } from "file-saver";
import { FileImage, Download, Loader2, ArrowUp, ArrowDown, GripVertical } from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ToolLayout } from "@/components/tool-layout";
import { FileDropzone } from "@/components/file-dropzone";
import { ProcessedPdfActions } from "@/components/processed-pdf-actions";
import { Button } from "@/components/ui/button";
import type { QueuedFile } from "@/lib/browser/file-queue";
import { reconcileQueuedFiles } from "@/lib/browser/file-queue";
import { cn } from "@/lib/utils";

interface SortableImageCardProps {
  file: QueuedFile;
  index: number;
  onMove: (index: number, direction: "up" | "down") => void;
  previewUrl?: string;
  total: number;
}

function SortableImageCard({ file, index, onMove, previewUrl, total }: SortableImageCardProps) {
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
      className={cn("relative group rounded-lg border border-border overflow-hidden bg-card", isDragging && "z-10 shadow-xl")}
    >
      <div className="aspect-square bg-muted/50 flex items-center justify-center">
        {previewUrl ? (
          <div className="relative h-full w-full">
            <Image
              src={previewUrl}
              alt={file.file.name}
              fill
              unoptimized
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover"
            />
          </div>
        ) : (
          <div className="w-8 h-8 rounded bg-muted animate-pulse" />
        )}
      </div>
      <button
        type="button"
        className="absolute right-2 top-2 z-10 rounded-full bg-black/65 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
        aria-label={`Drag ${file.file.name}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="absolute inset-0 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100 flex items-center justify-center gap-2">
        <Button
          variant="secondary"
          size="icon"
          className="h-8 w-8"
          onClick={() => onMove(index, "up")}
          disabled={index === 0}
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          className="h-8 w-8"
          onClick={() => onMove(index, "down")}
          disabled={index === total - 1}
        >
          <ArrowDown className="h-4 w-4" />
        </Button>
      </div>
      <div className="absolute top-2 left-2 flex h-6 w-6 items-center justify-center rounded bg-primary text-xs font-medium text-primary-foreground">
        {index + 1}
      </div>
    </div>
  );
}

export default function ImageToPDFPage() {
  const [files, setFiles] = useState<QueuedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processedPdf, setProcessedPdf] = useState<{ bytes: Uint8Array; fileName: string } | null>(
    null
  );
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const previewsRef = useRef<Record<string, string>>({});

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

  useEffect(() => {
    return () => {
      Object.values(previewsRef.current).forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const handleFileChange = useCallback((newFiles: File[]) => {
    setProcessedPdf(null);
    setFiles((previousFiles) => {
      const nextFiles = reconcileQueuedFiles(newFiles, previousFiles);
      const nextIds = new Set(nextFiles.map((file) => file.id));

      setPreviews((previousPreviews) => {
        const nextPreviews = { ...previousPreviews };

        Object.entries(previousPreviews).forEach(([id, url]) => {
          if (!nextIds.has(id)) {
            URL.revokeObjectURL(url);
            delete nextPreviews[id];
          }
        });

        nextFiles.forEach((entry) => {
          if (!nextPreviews[entry.id]) {
            nextPreviews[entry.id] = URL.createObjectURL(entry.file);
          }
        });

        previewsRef.current = nextPreviews;
        return nextPreviews;
      });

      return nextFiles;
    });
  }, []);

  const moveFile = (index: number, direction: "up" | "down") => {
    setFiles((previousFiles) => {
      const nextIndex = direction === "up" ? index - 1 : index + 1;
      if (nextIndex < 0 || nextIndex >= previousFiles.length) {
        return previousFiles;
      }

      return arrayMove(previousFiles, index, nextIndex);
    });
  };

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

  const fileList = useMemo(() => files.map((entry) => entry.file), [files]);

  const convertToPDF = async () => {
    if (files.length === 0) return;

    setIsProcessing(true);
    setProgress(0);
    setProcessedPdf(null);

    try {
      const pdf = await PDFDocument.create();

      for (let i = 0; i < files.length; i++) {
        const file = files[i].file;
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        let image;
        if (file.type === "image/png") {
          image = await pdf.embedPng(uint8Array);
        } else if (file.type === "image/jpeg" || file.type === "image/jpg") {
          image = await pdf.embedJpg(uint8Array);
        } else {
          // For other formats, convert to PNG using canvas
          const blob = new Blob([arrayBuffer], { type: file.type });
          const bitmap = await createImageBitmap(blob);
          const canvas = document.createElement("canvas");
          canvas.width = bitmap.width;
          canvas.height = bitmap.height;
          const ctx = canvas.getContext("2d")!;
          ctx.drawImage(bitmap, 0, 0);
          const pngBlob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((b) => resolve(b!), "image/png");
          });
          const pngBuffer = await pngBlob.arrayBuffer();
          image = await pdf.embedPng(new Uint8Array(pngBuffer));
        }

        const page = pdf.addPage([image.width, image.height]);
        page.drawImage(image, {
          x: 0,
          y: 0,
          width: image.width,
          height: image.height,
        });

        setProgress(((i + 1) / files.length) * 100);
      }

      const pdfBytes = await pdf.save();
      setProcessedPdf({
        bytes: pdfBytes,
        fileName: "images-to-pdf.pdf",
      });
    } catch (error) {
      console.error("Error converting images to PDF:", error);
      alert("An error occurred while converting images. Please try again.");
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <ToolLayout
        title="Image to PDF"
        description="Convert images to a PDF document. Supports JPG, PNG, and more."
        icon={FileImage}
        iconColor="text-emerald-600"
        iconBgColor="bg-emerald-50"
      >
        <div className="space-y-6">
          <FileDropzone
            files={fileList}
            onFilesChange={handleFileChange}
            accept={{
              "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp"],
            }}
            maxFiles={50}
            label="Drop images here"
            description="Supports JPG, PNG, GIF, WebP, BMP"
          />

          {files.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-foreground">
                  {files.length} image{files.length !== 1 ? "s" : ""} selected
                </h3>
                <p className="text-sm text-muted-foreground">Drag the handle or use the arrows to reorder</p>
              </div>

              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={files.map((file) => file.id)} strategy={rectSortingStrategy}>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {files.map((file, index) => (
                      <SortableImageCard
                        key={file.id}
                        file={file}
                        index={index}
                        onMove={moveFile}
                        previewUrl={previews[file.id]}
                        total={files.length}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              {isProcessing && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Creating PDF...</span>
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
                onClick={convertToPDF}
                disabled={isProcessing}
                className="w-full"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Converting...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Create PDF
                  </>
                )}
              </Button>

              {processedPdf && (
                <ProcessedPdfActions
                  currentToolId="image-to-pdf"
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

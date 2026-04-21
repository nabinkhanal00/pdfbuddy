"use client";

import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { saveAs } from "file-saver";
import { FileImage, Download, Loader2, ArrowUp, ArrowDown, GripVertical } from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ToolLayout } from "@/components/tool-layout";
import { FileDropzone } from "@/components/file-dropzone";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ImageToPDFPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previews, setPreviews] = useState<string[]>([]);

  const handleFileChange = (newFiles: File[]) => {
    setFiles(newFiles);
    // Generate previews
    const newPreviews: string[] = [];
    newFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        newPreviews.push(e.target?.result as string);
        if (newPreviews.length === newFiles.length) {
          setPreviews([...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });
    if (newFiles.length === 0) {
      setPreviews([]);
    }
  };

  const moveFile = (index: number, direction: "up" | "down") => {
    const newFiles = [...files];
    const newPreviews = [...previews];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newFiles.length) return;

    [newFiles[index], newFiles[newIndex]] = [newFiles[newIndex], newFiles[index]];
    [newPreviews[index], newPreviews[newIndex]] = [newPreviews[newIndex], newPreviews[index]];

    setFiles(newFiles);
    setPreviews(newPreviews);
  };

  const convertToPDF = async () => {
    if (files.length === 0) return;

    setIsProcessing(true);
    setProgress(0);

    try {
      const pdf = await PDFDocument.create();

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
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
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      saveAs(blob, "images-to-pdf.pdf");
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
            files={files}
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
                <p className="text-sm text-muted-foreground">Drag or use arrows to reorder</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {files.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="relative group rounded-lg border border-border overflow-hidden bg-card"
                  >
                    <div className="aspect-square bg-muted/50 flex items-center justify-center">
                      {previews[index] ? (
                        <img
                          src={previews[index]}
                          alt={file.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded bg-muted animate-pulse" />
                      )}
                    </div>
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => moveFile(index, "up")}
                        disabled={index === 0}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => moveFile(index, "down")}
                        disabled={index === files.length - 1}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="absolute top-2 left-2 flex h-6 w-6 items-center justify-center rounded bg-primary text-xs font-medium text-primary-foreground">
                      {index + 1}
                    </div>
                  </div>
                ))}
              </div>

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
            </div>
          )}
        </div>
      </ToolLayout>
      <Footer />
    </div>
  );
}

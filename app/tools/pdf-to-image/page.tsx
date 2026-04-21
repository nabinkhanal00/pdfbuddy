"use client";

import { useState, useEffect } from "react";
import { saveAs } from "file-saver";
import JSZip from "jszip";
import { Image, Download, Loader2, FileText } from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ToolLayout } from "@/components/tool-layout";
import { FileDropzone } from "@/components/file-dropzone";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type ImageFormat = "png" | "jpeg";

export default function PDFToImagePage() {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [format, setFormat] = useState<ImageFormat>("png");
  const [totalPages, setTotalPages] = useState(0);
  const [pdfjsLib, setPdfjsLib] = useState<typeof import("pdfjs-dist") | null>(null);

  useEffect(() => {
    // Dynamically import pdfjs-dist
    import("pdfjs-dist").then((pdfjs) => {
      pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;
      setPdfjsLib(pdfjs);
    });
  }, []);

  const handleFileChange = async (newFiles: File[]) => {
    setFiles(newFiles);
    if (newFiles.length > 0 && pdfjsLib) {
      try {
        const arrayBuffer = await newFiles[0].arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        setTotalPages(pdf.numPages);
      } catch (error) {
        console.error("Error reading PDF:", error);
      }
    } else {
      setTotalPages(0);
    }
  };

  const convertToImages = async () => {
    if (files.length === 0 || !pdfjsLib) return;

    setIsProcessing(true);
    setProgress(0);

    try {
      const file = files[0];
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const numPages = pdf.numPages;

      const zip = new JSZip();

      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const scale = 2;
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d")!;
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;

        const blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob(
            (b) => resolve(b!),
            format === "png" ? "image/png" : "image/jpeg",
            0.95
          );
        });

        zip.file(`page-${i}.${format}`, blob);
        setProgress((i / numPages) * 100);
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const originalName = file.name.replace(/\.pdf$/i, "");
      saveAs(zipBlob, `${originalName}-images.zip`);
    } catch (error) {
      console.error("Error converting PDF to images:", error);
      alert("An error occurred while converting the PDF. Please try again.");
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <ToolLayout
        title="PDF to Image"
        description="Convert PDF pages to high-quality PNG or JPG images"
        icon={Image}
        iconColor="text-green-600"
        iconBgColor="bg-green-50"
      >
        <div className="space-y-6">
          <FileDropzone
            files={files}
            onFilesChange={handleFileChange}
            maxFiles={1}
            multiple={false}
            label="Drop a PDF file to convert"
            description="Select a PDF file to convert to images"
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
                  <Label className="text-sm font-medium">Image Format</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: "png", label: "PNG", desc: "Lossless, larger files" },
                      { id: "jpeg", label: "JPG", desc: "Smaller files" },
                    ].map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setFormat(f.id as ImageFormat)}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          format === f.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <span className="block font-medium text-foreground text-sm">
                          {f.label}
                        </span>
                        <span className="block text-xs text-muted-foreground mt-1">
                          {f.desc}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {isProcessing && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Converting pages...</span>
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
                onClick={convertToImages}
                disabled={isProcessing || !pdfjsLib}
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
                    Convert to {format.toUpperCase()}
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

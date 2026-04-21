"use client";

import { useState } from "react";
import { PDFDocument, rgb, StandardFonts, degrees } from "pdf-lib";
import { saveAs } from "file-saver";
import { Droplet, Download, Loader2, FileText } from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ToolLayout } from "@/components/tool-layout";
import { FileDropzone } from "@/components/file-dropzone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

type WatermarkPosition = "center" | "diagonal" | "tiled";

export default function WatermarkPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [watermarkText, setWatermarkText] = useState("CONFIDENTIAL");
  const [opacity, setOpacity] = useState(30);
  const [fontSize, setFontSize] = useState(48);
  const [position, setPosition] = useState<WatermarkPosition>("diagonal");

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

  const addWatermark = async () => {
    if (files.length === 0 || !watermarkText.trim()) return;

    setIsProcessing(true);

    try {
      const file = files[0];
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      const font = await pdf.embedFont(StandardFonts.HelveticaBold);
      const pages = pdf.getPages();

      const opacityValue = opacity / 100;

      pages.forEach((page) => {
        const { width, height } = page.getSize();
        const textWidth = font.widthOfTextAtSize(watermarkText, fontSize);

        if (position === "center") {
          page.drawText(watermarkText, {
            x: (width - textWidth) / 2,
            y: height / 2,
            size: fontSize,
            font,
            color: rgb(0.7, 0.7, 0.7),
            opacity: opacityValue,
          });
        } else if (position === "diagonal") {
          page.drawText(watermarkText, {
            x: width / 2 - textWidth / 2,
            y: height / 2,
            size: fontSize,
            font,
            color: rgb(0.7, 0.7, 0.7),
            opacity: opacityValue,
            rotate: degrees(-45),
          });
        } else if (position === "tiled") {
          const spacing = 200;
          for (let y = 0; y < height + spacing; y += spacing) {
            for (let x = -spacing; x < width + spacing; x += spacing) {
              page.drawText(watermarkText, {
                x,
                y,
                size: fontSize * 0.5,
                font,
                color: rgb(0.7, 0.7, 0.7),
                opacity: opacityValue * 0.7,
                rotate: degrees(-45),
              });
            }
          }
        }
      });

      const pdfBytes = await pdf.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const originalName = file.name.replace(/\.pdf$/i, "");
      saveAs(blob, `${originalName}-watermarked.pdf`);
    } catch (error) {
      console.error("Error adding watermark:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <ToolLayout
        title="Watermark PDF"
        description="Add text watermark to your PDF pages"
        icon={Droplet}
        iconColor="text-teal-600"
        iconBgColor="bg-teal-50"
      >
        <div className="space-y-6">
          <FileDropzone
            files={files}
            onFilesChange={handleFileChange}
            maxFiles={1}
            multiple={false}
            label="Drop a PDF file"
            description="Select a PDF to add watermark"
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
                  <div className="space-y-2">
                    <Label htmlFor="watermarkText">Watermark Text</Label>
                    <Input
                      id="watermarkText"
                      value={watermarkText}
                      onChange={(e) => setWatermarkText(e.target.value)}
                      placeholder="Enter watermark text"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label>Position</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: "center", label: "Center" },
                        { id: "diagonal", label: "Diagonal" },
                        { id: "tiled", label: "Tiled" },
                      ].map((p) => (
                        <button
                          key={p.id}
                          onClick={() => setPosition(p.id as WatermarkPosition)}
                          className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                            position === p.id
                              ? "border-primary bg-primary/5 text-primary"
                              : "border-border text-muted-foreground hover:border-primary/50"
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <Label>Opacity</Label>
                      <span className="text-sm text-muted-foreground">{opacity}%</span>
                    </div>
                    <Slider
                      value={[opacity]}
                      onValueChange={(v) => setOpacity(v[0])}
                      min={10}
                      max={100}
                      step={5}
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <Label>Font Size</Label>
                      <span className="text-sm text-muted-foreground">{fontSize}px</span>
                    </div>
                    <Slider
                      value={[fontSize]}
                      onValueChange={(v) => setFontSize(v[0])}
                      min={12}
                      max={120}
                      step={4}
                    />
                  </div>
                </div>
              </div>

              <Button
                onClick={addWatermark}
                disabled={isProcessing || !watermarkText.trim()}
                className="w-full"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adding Watermark...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Add Watermark & Download
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

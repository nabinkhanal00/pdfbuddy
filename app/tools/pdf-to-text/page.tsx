"use client";

import { useState } from "react";
import { saveAs } from "file-saver";
import { FileText, Download, Loader2, Copy, Check } from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ToolLayout } from "@/components/tool-layout";
import { FileDropzone } from "@/components/file-dropzone";
import { Button } from "@/components/ui/button";
import { getPdfJs, getTextItemString } from "@/lib/browser/pdfjs";

export default function PDFToTextPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedText, setExtractedText] = useState("");
  const [copied, setCopied] = useState(false);

  const handleFileChange = (newFiles: File[]) => {
    setFiles(newFiles);
    setExtractedText("");
  };

  const extractText = async () => {
    if (files.length === 0) return;

    setIsProcessing(true);
    setExtractedText("");

    try {
      const pdfjsLib = await getPdfJs();
      const file = files[0];
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let fullText = "";
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(getTextItemString).join(" ");
        fullText += `--- Page ${i} ---\n${pageText}\n\n`;
      }

      setExtractedText(fullText.trim());
    } catch (error) {
      console.error("Error extracting text:", error);
      alert("An error occurred while extracting text. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(extractedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const downloadAsText = () => {
    const blob = new Blob([extractedText], { type: "text/plain;charset=utf-8" });
    const originalName = files[0].name.replace(/\.pdf$/i, "");
    saveAs(blob, `${originalName}.txt`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <ToolLayout
        title="PDF to Text"
        description="Extract text content from PDF files"
        icon={FileText}
        iconColor="text-slate-600"
        iconBgColor="bg-slate-50"
      >
        <div className="space-y-6">
          <FileDropzone
            files={files}
            onFilesChange={handleFileChange}
            maxFiles={1}
            multiple={false}
            label="Drop a PDF file"
            description="Select a PDF to extract text from"
          />

          {files.length > 0 && !extractedText && (
            <Button
              onClick={extractText}
              disabled={isProcessing}
              className="w-full"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Extracting Text...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Extract Text
                </>
              )}
            </Button>
          )}

          {extractedText && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-foreground">Extracted Text</h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyToClipboard}
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadAsText}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download .txt
                  </Button>
                </div>
              </div>
              <div className="rounded-lg border border-border bg-muted/50 p-4 max-h-96 overflow-y-auto">
                <pre className="text-sm text-foreground whitespace-pre-wrap font-mono">
                  {extractedText}
                </pre>
              </div>
            </div>
          )}
        </div>
      </ToolLayout>
      <Footer />
    </div>
  );
}

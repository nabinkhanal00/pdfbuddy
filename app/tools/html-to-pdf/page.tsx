"use client";

import { useState } from "react";
import { FileType, Download, Loader2, Globe, AlertCircle } from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type InputMode = "url" | "html";

export default function HTMLToPDFPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [inputMode, setInputMode] = useState<InputMode>("html");
  const [url, setUrl] = useState("");
  const [htmlContent, setHtmlContent] = useState(`<!DOCTYPE html>
<html>
<head>
  <title>My Document</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      padding: 40px;
      line-height: 1.6;
    }
    h1 { color: #333; }
    p { color: #666; }
  </style>
</head>
<body>
  <h1>Hello World</h1>
  <p>This is a sample HTML document that will be converted to PDF.</p>
  <p>You can edit this HTML to create your own document.</p>
</body>
</html>`);

  const convertToPDF = async () => {
    setIsProcessing(true);

    try {
      if (inputMode === "html") {
        // Use browser's print functionality for HTML to PDF
        const printWindow = window.open("", "_blank");
        if (printWindow) {
          printWindow.document.write(htmlContent);
          printWindow.document.close();
          
          // Wait for content to load then trigger print
          printWindow.onload = () => {
            setTimeout(() => {
              printWindow.print();
              printWindow.close();
            }, 500);
          };
        }
      } else {
        // For URL conversion, open in new tab with print dialog
        alert(
          "URL to PDF conversion requires server-side rendering. " +
          "For now, you can open the URL and use your browser's Print to PDF feature (Ctrl/Cmd + P)."
        );
        if (url) {
          window.open(url, "_blank");
        }
      }
    } catch (error) {
      console.error("Error converting to PDF:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <ToolLayout
        title="HTML to PDF"
        description="Convert HTML content or web pages to PDF"
        icon={FileType}
        iconColor="text-indigo-600"
        iconBgColor="bg-indigo-50"
      >
        <div className="space-y-6">
          <div className="p-4 rounded-lg border border-border bg-card">
            <div className="space-y-4">
              <div className="space-y-3">
                <Label>Input Type</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setInputMode("html")}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      inputMode === "html"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <span className="block font-medium text-foreground text-sm">HTML Code</span>
                    <span className="block text-xs text-muted-foreground mt-1">
                      Paste or write HTML
                    </span>
                  </button>
                  <button
                    onClick={() => setInputMode("url")}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      inputMode === "url"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <span className="block font-medium text-foreground text-sm">Web URL</span>
                    <span className="block text-xs text-muted-foreground mt-1">
                      Enter a website URL
                    </span>
                  </button>
                </div>
              </div>

              {inputMode === "url" ? (
                <div className="space-y-2">
                  <Label htmlFor="url">Website URL</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="url"
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://example.com"
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                    <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-800">
                      URL to PDF conversion will open the page in a new tab. 
                      Use your browser&apos;s Print function (Ctrl/Cmd + P) and select &quot;Save as PDF&quot;.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="html">HTML Content</Label>
                  <Textarea
                    id="html"
                    value={htmlContent}
                    onChange={(e) => setHtmlContent(e.target.value)}
                    placeholder="Enter your HTML here..."
                    className="font-mono text-sm min-h-[300px]"
                  />
                </div>
              )}
            </div>
          </div>

          <Button
            onClick={convertToPDF}
            disabled={isProcessing || (inputMode === "url" && !url) || (inputMode === "html" && !htmlContent)}
            className="w-full"
            size="lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                {inputMode === "url" ? "Open & Print to PDF" : "Convert to PDF"}
              </>
            )}
          </Button>
        </div>
      </ToolLayout>
      <Footer />
    </div>
  );
}

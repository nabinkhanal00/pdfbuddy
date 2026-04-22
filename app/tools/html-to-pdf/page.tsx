"use client";

import { useState } from "react";
import {
  AlertCircle,
  Download,
  FileType,
  Globe,
  Loader2,
  Server,
} from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ToolLayout } from "@/components/tool-layout";
import { ProcessedPdfActions } from "@/components/processed-pdf-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type InputMode = "url" | "html";

export default function HTMLToPDFPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [inputMode, setInputMode] = useState<InputMode>("html");
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [processedPdf, setProcessedPdf] = useState<{
    bytes: Uint8Array;
    fileName: string;
  } | null>(null);
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
    setError(null);

    try {
      const response = await fetch("/api/html-to-pdf", {
        body: JSON.stringify(
          inputMode === "html"
            ? {
                html: htmlContent,
                mode: "html",
              }
            : {
                mode: "url",
                url,
              },
        ),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(payload?.error || "Conversion failed.");
      }

      const blob = await response.blob();
      const filename =
        inputMode === "url"
          ? (() => {
              try {
                return `${new URL(url).hostname.replace(/[^a-z0-9-]+/gi, "-").toLowerCase() || "webpage"}.pdf`;
              } catch {
                return "webpage.pdf";
              }
            })()
          : "document.pdf";

      const arrayBuffer = await blob.arrayBuffer();
      setProcessedPdf({
        bytes: new Uint8Array(arrayBuffer),
        fileName: filename,
      });
    } catch (error) {
      console.error("Error converting to PDF:", error);
      setError(
        error instanceof Error
          ? error.message
          : "An error occurred while converting the document.",
      );
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
          <div className="flex items-start gap-3 rounded-2xl border border-border bg-card px-4 py-4">
            <Server className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />
            <div className="space-y-1 text-sm">
              <p className="font-medium text-foreground">
                Rendered with a server-side browser
              </p>
              <p className="text-muted-foreground">
                HTML and URL inputs are captured on the server, then returned as
                a downloadable PDF. Other file-based tools in this app stay
                browser-first.
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <div className="space-y-4">
              <div className="space-y-3">
                <Label>Input Type</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setInputMode("html")}
                    className={`rounded-lg border p-3 text-left transition-all ${
                      inputMode === "html"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <span className="block text-sm font-medium text-foreground">
                      HTML Code
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      Paste or write HTML
                    </span>
                  </button>
                  <button
                    onClick={() => setInputMode("url")}
                    className={`rounded-lg border p-3 text-left transition-all ${
                      inputMode === "url"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <span className="block text-sm font-medium text-foreground">
                      Web URL
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      Enter a website URL
                    </span>
                  </button>
                </div>
              </div>

              {inputMode === "url" ? (
                <div className="space-y-2">
                  <Label htmlFor="url">Website URL</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="url"
                      type="url"
                      value={url}
                      onChange={(event) => setUrl(event.target.value)}
                      placeholder="https://example.com"
                      className="pl-10"
                    />
                  </div>
                  <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                    <p className="text-sm text-amber-800">
                      Some sites block automated capture, require login, or keep
                      streaming network requests open. Reachable public pages
                      work best.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="html">HTML Content</Label>
                  <Textarea
                    id="html"
                    value={htmlContent}
                    onChange={(event) => setHtmlContent(event.target.value)}
                    placeholder="Enter your HTML here..."
                    className="min-h-[300px] font-mono text-sm"
                  />
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/25 bg-destructive/5 p-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <Button
            onClick={convertToPDF}
            disabled={
              isProcessing ||
              (inputMode === "url" && !url.trim()) ||
              (inputMode === "html" && !htmlContent.trim())
            }
            className="w-full"
            size="lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Convert
              </>
            )}
          </Button>

          {processedPdf && (
            <ProcessedPdfActions
              currentToolId="html-to-pdf"
              fileName={processedPdf.fileName}
              outputBytes={processedPdf.bytes}
            />
          )}
        </div>
      </ToolLayout>
      <Footer />
    </div>
  );
}

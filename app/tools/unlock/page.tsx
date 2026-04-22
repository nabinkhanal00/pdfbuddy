"use client";

import { useState } from "react";
import {
  Unlock,
  Loader2,
  FileText,
  Eye,
  EyeOff,
  CheckCircle,
} from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ToolLayout } from "@/components/tool-layout";
import { FileDropzone } from "@/components/file-dropzone";
import { ProcessedPdfActions } from "@/components/processed-pdf-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePendingPdfImport } from "@/lib/browser/pdf-handoff";
import { inspectPdfEncryption, unlockPdf } from "@/lib/browser/qpdf";

export default function UnlockPDFPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isEncrypted, setIsEncrypted] = useState<boolean | null>(null);
  const [unlockAttempted, setUnlockAttempted] = useState(false);
  const [unlockSuccess, setUnlockSuccess] = useState(false);
  const [processedPdf, setProcessedPdf] = useState<{
    bytes: Uint8Array;
    fileName: string;
  } | null>(null);

  const handleFileChange = async (newFiles: File[]) => {
    setFiles(newFiles);
    setIsEncrypted(null);
    setUnlockAttempted(false);
    setUnlockSuccess(false);
    setPassword("");
    setProcessedPdf(null);

    if (newFiles.length > 0) {
      try {
        const arrayBuffer = new Uint8Array(await newFiles[0].arrayBuffer());
        const state = await inspectPdfEncryption(arrayBuffer);
        setIsEncrypted(state.isEncrypted);
      } catch (error) {
        console.error("Error reading PDF:", error);
      }
    }
  };

  const unlockPDF = async () => {
    if (files.length === 0) return;

    setIsProcessing(true);
    setUnlockAttempted(true);

    try {
      const file = files[0];
      const arrayBuffer = new Uint8Array(await file.arrayBuffer());
      const unlocked = await unlockPdf(arrayBuffer, password);

      if (!unlocked.passwordAccepted || !unlocked.outputBytes) {
        setUnlockSuccess(false);
        alert(
          "Could not unlock the PDF. Please check the password and try again.",
        );
        return;
      }

      const originalName = file.name.replace(/\.pdf$/i, "");
      setProcessedPdf({
        bytes: Uint8Array.from(unlocked.outputBytes),
        fileName: `${originalName}-unlocked.pdf`,
      });

      setUnlockSuccess(true);
    } catch (error) {
      console.error("Error unlocking PDF:", error);
      setUnlockSuccess(false);
      alert(
        "Could not unlock the PDF. Please check the password and try again.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  usePendingPdfImport(handleFileChange);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <ToolLayout
        title="Unlock PDF"
        description="Remove password protection from PDF files"
        icon={Unlock}
        iconColor="text-pink-600"
        iconBgColor="bg-pink-50"
      >
        <div className="space-y-6">
          <FileDropzone
            files={files}
            onFilesChange={handleFileChange}
            maxFiles={1}
            multiple={false}
            label="Drop a protected PDF file"
            description="Select a password-protected PDF"
          />

          {files.length > 0 && (
            <div className="space-y-6">
              <div className="p-4 rounded-lg border border-border bg-card">
                <div className="flex items-center gap-3 mb-4">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium text-foreground">
                    {files[0].name}
                  </span>
                </div>

                {isEncrypted === false && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <p className="text-sm text-green-800">
                      This PDF is not password protected. No unlocking needed.
                    </p>
                  </div>
                )}

                {isEncrypted === true && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                      <Unlock className="h-5 w-5 text-amber-600" />
                      <p className="text-sm text-amber-800">
                        This PDF appears to be password protected.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Password (if known)</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            setProcessedPdf(null);
                          }}
                          placeholder="Enter PDF password"
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Leave empty to try unlocking without a password
                      </p>
                    </div>

                    {unlockAttempted && unlockSuccess && (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <p className="text-sm text-green-800">
                          PDF unlocked successfully!
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {(isEncrypted === true || isEncrypted === null) && (
                <Button
                  onClick={unlockPDF}
                  disabled={isProcessing}
                  className="w-full"
                  size="lg"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Unlocking...
                    </>
                  ) : (
                    "Unlock PDF"
                  )}
                </Button>
              )}

              {processedPdf && (
                <ProcessedPdfActions
                  currentToolId="unlock"
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

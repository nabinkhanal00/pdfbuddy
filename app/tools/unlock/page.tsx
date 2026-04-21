"use client";

import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { saveAs } from "file-saver";
import { Unlock, Download, Loader2, FileText, Eye, EyeOff, CheckCircle, XCircle } from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ToolLayout } from "@/components/tool-layout";
import { FileDropzone } from "@/components/file-dropzone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function UnlockPDFPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isEncrypted, setIsEncrypted] = useState<boolean | null>(null);
  const [unlockAttempted, setUnlockAttempted] = useState(false);
  const [unlockSuccess, setUnlockSuccess] = useState(false);

  const handleFileChange = async (newFiles: File[]) => {
    setFiles(newFiles);
    setIsEncrypted(null);
    setUnlockAttempted(false);
    setUnlockSuccess(false);
    setPassword("");

    if (newFiles.length > 0) {
      try {
        const arrayBuffer = await newFiles[0].arrayBuffer();
        try {
          await PDFDocument.load(arrayBuffer);
          setIsEncrypted(false);
        } catch {
          // If loading fails, it might be encrypted
          setIsEncrypted(true);
        }
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
      const arrayBuffer = await file.arrayBuffer();
      
      // Try to load with password
      const pdf = await PDFDocument.load(arrayBuffer, {
        password: password || undefined,
        ignoreEncryption: true,
      });

      // Create a new unencrypted PDF
      const newPdf = await PDFDocument.create();
      const pages = await newPdf.copyPages(pdf, pdf.getPageIndices());
      pages.forEach((page) => newPdf.addPage(page));

      const pdfBytes = await newPdf.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const originalName = file.name.replace(/\.pdf$/i, "");
      saveAs(blob, `${originalName}-unlocked.pdf`);
      
      setUnlockSuccess(true);
    } catch (error) {
      console.error("Error unlocking PDF:", error);
      setUnlockSuccess(false);
      alert(
        "Could not unlock the PDF. Please check the password and try again. " +
        "Note: Some PDFs with strong encryption may not be unlockable."
      );
    } finally {
      setIsProcessing(false);
    }
  };

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
                  <span className="font-medium text-foreground">{files[0].name}</span>
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
                          onChange={(e) => setPassword(e.target.value)}
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
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Unlock & Download
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </div>
      </ToolLayout>
      <Footer />
    </div>
  );
}

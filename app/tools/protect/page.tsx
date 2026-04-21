"use client";

import { useState } from "react";
import { saveAs } from "file-saver";
import { Lock, Download, Loader2, FileText, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ToolLayout } from "@/components/tool-layout";
import { FileDropzone } from "@/components/file-dropzone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { protectPdf } from "@/lib/browser/qpdf";

export default function ProtectPDFPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [totalPages, setTotalPages] = useState(0);

  const handleFileChange = async (newFiles: File[]) => {
    setFiles(newFiles);
    if (newFiles.length > 0) {
      try {
        const { PDFDocument } = await import("pdf-lib");
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

  const protectPDF = async () => {
    if (files.length === 0 || !password || password !== confirmPassword) return;

    setIsProcessing(true);

    try {
      const file = files[0];
      const arrayBuffer = await file.arrayBuffer();
      const protectedPdf = await protectPdf(new Uint8Array(arrayBuffer), password);

      if (!protectedPdf.outputBytes) {
        throw new Error(protectedPdf.stderr.join("\n") || "Protection failed.");
      }

      const blob = new Blob([protectedPdf.outputBytes], { type: "application/pdf" });
      const originalName = file.name.replace(/\.pdf$/i, "");
      saveAs(blob, `${originalName}-protected.pdf`);
    } catch (error) {
      console.error("Error protecting PDF:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const passwordsMatch = password === confirmPassword;
  const isValid = password.length >= 4 && passwordsMatch;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <ToolLayout
        title="Protect PDF"
        description="Add password protection to your PDF document"
        icon={Lock}
        iconColor="text-purple-600"
        iconBgColor="bg-purple-50"
      >
        <div className="space-y-6">
          <FileDropzone
            files={files}
            onFilesChange={handleFileChange}
            maxFiles={1}
            multiple={false}
            label="Drop a PDF file"
            description="Select a PDF to protect"
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

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password (min 4 characters)"
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
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                    />
                    {confirmPassword && !passwordsMatch && (
                      <p className="text-sm text-destructive">Passwords do not match</p>
                    )}
                  </div>

                  <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                    <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-amber-800">Remember your password</p>
                      <p className="text-amber-700 mt-1">
                        If you forget the password, the protected document cannot be opened.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Button
                onClick={protectPDF}
                disabled={isProcessing || !isValid}
                className="w-full"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Protecting...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Protect & Download
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

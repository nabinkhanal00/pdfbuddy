"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { saveAs } from "file-saver";
import { ArrowRight, Download, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { pdfHandoffTargets } from "@/lib/pdf-tools";
import { savePendingPdfHandoff } from "@/lib/browser/pdf-handoff";
import { cn } from "@/lib/utils";

interface ProcessedPdfActionsProps {
  allowedToolIds?: string[];
  currentToolId?: string;
  fileName: string;
  outputBytes: Uint8Array;
  mimeType?: string;
  hideProcessFurther?: boolean;
}

export function ProcessedPdfActions({
  allowedToolIds,
  currentToolId,
  fileName,
  outputBytes,
  mimeType = "application/pdf",
  hideProcessFurther = false,
}: ProcessedPdfActionsProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [handoffError, setHandoffError] = useState<string | null>(null);
  const [isRouting, setIsRouting] = useState(false);

  const availableTools = useMemo(() => {
    return pdfHandoffTargets.filter((tool) => {
      if (tool.id === currentToolId) {
        return false;
      }

      if (!allowedToolIds) {
        return true;
      }

      return allowedToolIds.includes(tool.id);
    });
  }, [allowedToolIds, currentToolId]);

  const downloadPdf = () => {
    const blob = new Blob([outputBytes], { type: mimeType });
    saveAs(blob, fileName);
  };

  const processFurther = async (href: string) => {
    setIsRouting(true);
    setHandoffError(null);

    try {
      await savePendingPdfHandoff({
        bytes: outputBytes,
        fileName,
      });

      setDialogOpen(false);
      router.push(`${href}?handoff=1`);
    } catch (error) {
      console.error("Error saving processed PDF handoff:", error);
      setHandoffError(
        error instanceof Error
          ? error.message
          : "Could not pass the processed PDF into the next tool.",
      );
      setIsRouting(false);
    }
  };

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
      <div className="flex items-start gap-3">
        <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
        <div className="space-y-4">
          <div className="space-y-1">
            <p className="font-medium text-emerald-900">
              {mimeType === "application/pdf"
                ? "Processed PDF ready"
                : "Processing complete"}
            </p>
            <p className="text-sm text-emerald-800">
              {mimeType === "application/pdf"
                ? "Download it now or send it straight into another PDF tool without uploading again."
                : "Your file is ready for download."}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button onClick={downloadPdf} className="sm:flex-1">
              <Download className="mr-2 h-4 w-4" />
              {mimeType.includes("zip") ? "Download ZIP" : "Download File"}
            </Button>

            {!hideProcessFurther &&
              mimeType === "application/pdf" &&
              availableTools.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(true)}
                  className="border-emerald-300 bg-white text-emerald-900 hover:bg-emerald-100 sm:flex-1"
                >
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Process Further
                </Button>
              )}
          </div>

          {handoffError && (
            <p className="text-sm text-destructive">{handoffError}</p>
          )}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Choose the next PDF step</DialogTitle>
            <DialogDescription>
              Your processed PDF will open directly in the next tool.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3">
            {availableTools.map((tool) => {
              const Icon = tool.icon;
              const iconBackground =
                tool.bgColor
                  .split(" ")
                  .find((className) => className.startsWith("bg-")) ??
                "bg-muted";

              return (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => void processFurther(tool.href)}
                  disabled={isRouting}
                  className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/40 hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <div className={cn("rounded-lg p-2", iconBackground)}>
                    <Icon className={`h-5 w-5 ${tool.color}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">{tool.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {tool.description}
                    </p>
                  </div>
                  {isRouting && (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

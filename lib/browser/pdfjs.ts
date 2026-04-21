"use client";

type PdfJsModule = typeof import("pdfjs-dist");

let pdfJsPromise: Promise<PdfJsModule> | null = null;

export async function getPdfJs() {
  if (!pdfJsPromise) {
    pdfJsPromise = import("pdfjs-dist").then((pdfjs) => {
      pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      return pdfjs;
    });
  }

  return pdfJsPromise;
}

export function getTextItemString(item: unknown) {
  if (
    item &&
    typeof item === "object" &&
    "str" in item &&
    typeof (item as { str?: unknown }).str === "string"
  ) {
    return (item as { str: string }).str;
  }

  return "";
}

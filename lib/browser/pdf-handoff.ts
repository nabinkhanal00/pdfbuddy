"use client";

import { useEffect, useRef, useState } from "react";

const DB_NAME = "pdf-buddy";
const STORE_NAME = "pending-pdf-handoffs";
const PENDING_PDF_KEY = "pending-pdf";

interface PendingPdfRecord {
  bytes: ArrayBuffer;
  createdAt: number;
  fileName: string;
  id: string;
  mimeType: string;
}

export interface PendingPdfHandoff {
  bytes: Uint8Array;
  createdAt: number;
  fileName: string;
  mimeType: string;
}

function getIndexedDb() {
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    throw new Error(
      "This browser does not support the local storage needed for processing handoffs.",
    );
  }

  return window.indexedDB;
}

function openHandoffDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = getIndexedDb().open(DB_NAME, 1);

    request.onerror = () => {
      reject(
        request.error ??
          new Error("Could not open the browser handoff database."),
      );
    };

    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
) {
  const database = await openHandoffDatabase();

  return new Promise<T>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode);
    const store = transaction.objectStore(STORE_NAME);
    const request = run(store);
    let requestResult: T;

    request.onerror = () => {
      reject(
        request.error ??
          new Error("Could not access the browser handoff store."),
      );
    };

    request.onsuccess = () => {
      requestResult = request.result;
    };

    transaction.oncomplete = () => {
      database.close();
      resolve(requestResult);
    };

    transaction.onerror = () => {
      reject(
        transaction.error ??
          new Error("Could not complete the browser handoff transaction."),
      );
      database.close();
    };
  });
}

export async function savePendingPdfHandoff(input: {
  bytes: Uint8Array;
  fileName: string;
  mimeType?: string;
}) {
  const record: PendingPdfRecord = {
    bytes: input.bytes.slice().buffer,
    createdAt: Date.now(),
    fileName: input.fileName,
    id: PENDING_PDF_KEY,
    mimeType: input.mimeType ?? "application/pdf",
  };

  await withStore("readwrite", (store) => store.put(record));
}

export async function clearPendingPdfHandoff() {
  await withStore("readwrite", (store) => store.delete(PENDING_PDF_KEY));
}

export async function getPendingPdfHandoff(): Promise<PendingPdfHandoff | null> {
  const record = await withStore<PendingPdfRecord | undefined>(
    "readonly",
    (store) => store.get(PENDING_PDF_KEY),
  );

  if (!record) {
    return null;
  }

  return {
    bytes: new Uint8Array(record.bytes),
    createdAt: record.createdAt,
    fileName: record.fileName,
    mimeType: record.mimeType,
  };
}

export async function consumePendingPdfHandoff(): Promise<PendingPdfHandoff | null> {
  const record = await getPendingPdfHandoff();
  if (record) {
    await clearPendingPdfHandoff();
  }
  return record;
}

export function usePendingPdfImport(
  onFilesReady: (files: File[]) => void | Promise<void>,
) {
  const hasAttemptedRef = useRef(false);
  const onFilesReadyRef = useRef(onFilesReady);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    onFilesReadyRef.current = onFilesReady;
  }, [onFilesReady]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (typeof window === "undefined" || params.get("handoff") !== "1") {
      return;
    }

    let isCancelled = false;

    const importPendingPdf = async () => {
      if (hasAttemptedRef.current) return;
      setIsImporting(true);

      try {
        console.log(
          "PDF Buddy: Attempting to import pending PDF from handoff...",
        );
        const pendingPdf = await getPendingPdfHandoff();

        if (!pendingPdf) {
          console.warn("PDF Buddy: No pending PDF found in browser storage.");
          return;
        }

        if (isCancelled) {
          console.log("PDF Buddy: Import cancelled due to remount.");
          return;
        }

        // Mark as attempted ONLY after we've successfully retrieved the data
        // and verified we aren't cancelled.
        hasAttemptedRef.current = true;

        console.log(
          `PDF Buddy: Importing "${pendingPdf.fileName}" (${pendingPdf.bytes.length} bytes)`,
        );

        const importedFile = new File([pendingPdf.bytes], pendingPdf.fileName, {
          type: pendingPdf.mimeType,
        });

        await onFilesReadyRef.current([importedFile]);

        // Only clear AFTER successful handoff to the component
        await clearPendingPdfHandoff();
        console.log("PDF Buddy: Handoff complete and storage cleared.");
      } catch (error) {
        console.error("PDF Buddy: Error importing pending PDF handoff:", error);
      } finally {
        if (!isCancelled) {
          setIsImporting(false);
          // Clean up the URL
          const newUrl = window.location.pathname;
          window.history.replaceState({}, "", newUrl);
        }
      }
    };

    void importPendingPdf();

    return () => {
      isCancelled = true;
    };
  }, []);

  return { isImporting };
}

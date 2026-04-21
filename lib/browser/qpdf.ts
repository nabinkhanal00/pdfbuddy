"use client";

type CompressionLevel = "low" | "medium" | "high";

interface QpdfRunResult {
  outputBytes?: Uint8Array;
  stderr: string[];
  status: number;
}

interface PdfEncryptionState {
  canOpenWithoutPassword: boolean;
  isEncrypted: boolean;
  requiresPassword: boolean;
}

interface QpdfInstance {
  FS: {
    readFile: (path: string) => Uint8Array;
    unlink?: (path: string) => void;
    writeFile: (path: string, data: Uint8Array) => void;
  };
  callMain: (args: string[]) => number;
}

type QpdfFactory = (moduleArg?: { locateFile?: (path: string) => string }) => Promise<QpdfInstance>;

declare global {
  interface Window {
    Module?: QpdfFactory;
  }
}

let qpdfFactoryPromise: Promise<QpdfFactory> | null = null;
let qpdfPromise: Promise<QpdfInstance> | null = null;
let currentQpdfOutput: string[] | null = null;

function loadQpdfFactory() {
  if (typeof window === "undefined") {
    throw new Error("QPDF can only be loaded in the browser.");
  }

  if (window.Module) {
    return Promise.resolve(window.Module);
  }

  if (!qpdfFactoryPromise) {
    qpdfFactoryPromise = new Promise<QpdfFactory>((resolve, reject) => {
      const existingScript = document.querySelector<HTMLScriptElement>('script[data-qpdf-loader="true"]');

      const handleLoad = () => {
        if (window.Module) {
          resolve(window.Module);
          return;
        }

        reject(new Error("QPDF script loaded, but no factory was exposed on window.Module."));
      };

      const handleError = () => {
        reject(new Error("Failed to load the local QPDF runtime."));
      };

      if (existingScript) {
        existingScript.addEventListener("load", handleLoad, { once: true });
        existingScript.addEventListener("error", handleError, { once: true });
        return;
      }

      const script = document.createElement("script");
      script.async = true;
      script.dataset.qpdfLoader = "true";
      script.src = "/qpdf.js";
      script.addEventListener("load", handleLoad, { once: true });
      script.addEventListener("error", handleError, { once: true });
      document.body.appendChild(script);
    });
  }

  return qpdfFactoryPromise;
}

async function getQpdf() {
  if (!qpdfPromise) {
    qpdfPromise = loadQpdfFactory().then(async (createQpdf) => {
      const originalConsoleLog = console.log;
      const originalConsoleError = console.error;
      const captureOutput = (...args: unknown[]) => {
        currentQpdfOutput?.push(args.map((value) => String(value)).join(" "));
      };

      console.log = captureOutput;
      console.error = captureOutput;

      try {
        return await createQpdf({
          locateFile: () => "/qpdf.wasm",
        });
      } finally {
        console.log = originalConsoleLog;
        console.error = originalConsoleError;
      }
    });
  }

  return qpdfPromise;
}

async function runQpdf(
  inputBytes: Uint8Array,
  buildArgs: (paths: { input: string; output: string }) => string[],
  options: {
    expectsOutput?: boolean;
  } = {}
) {
  const qpdf = await getQpdf();
  const fs = qpdf.FS;

  const jobId = crypto.randomUUID().replace(/-/g, "");
  const inputPath = `/${jobId}-input.pdf`;
  const outputPath = `/${jobId}-output.pdf`;

  currentQpdfOutput = [];
  const status = (() => {
    fs.writeFile(inputPath, inputBytes);
    return qpdf.callMain(buildArgs({ input: inputPath, output: outputPath }));
  })();
  const stderr = currentQpdfOutput;
  currentQpdfOutput = null;

  let outputBytes: Uint8Array | undefined;

  if ((options.expectsOutput ?? true) && (status === 0 || status === 3)) {
    try {
      outputBytes = fs.readFile(outputPath);
    } catch {
      outputBytes = undefined;
    }
  }

  try {
    fs.unlink?.(inputPath);
    fs.unlink?.(outputPath);
  } catch {
    // Ignore cleanup errors in the in-memory FS.
  }

  return {
    outputBytes,
    stderr,
    status,
  } satisfies QpdfRunResult;
}

function createOwnerPassword() {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function hasInvalidPasswordError(stderr: string[]) {
  return stderr.some((line) => /invalid password/i.test(line));
}

function isNotEncryptedMessage(stderr: string[]) {
  return stderr.some((line) => /file is not encrypted/i.test(line));
}

export async function inspectPdfEncryption(inputBytes: Uint8Array) {
  const inspection = await runQpdf(inputBytes, ({ input }) => [input, "--show-encryption"], {
    expectsOutput: false,
  });

  if (isNotEncryptedMessage(inspection.stderr)) {
    return {
      canOpenWithoutPassword: false,
      isEncrypted: false,
      requiresPassword: false,
    } satisfies PdfEncryptionState;
  }

  const invalidPassword = hasInvalidPasswordError(inspection.stderr);

  return {
    canOpenWithoutPassword: inspection.status === 0 && !invalidPassword,
    isEncrypted: inspection.status === 0 || invalidPassword,
    requiresPassword: invalidPassword,
  } satisfies PdfEncryptionState;
}

export async function protectPdf(inputBytes: Uint8Array, password: string) {
  const ownerPassword = createOwnerPassword();

  return runQpdf(inputBytes, ({ input, output }) => [
    input,
    "--encrypt",
    password,
    ownerPassword,
    "256",
    "--",
    output,
  ]);
}

export async function unlockPdf(inputBytes: Uint8Array, password: string) {
  const validation = await runQpdf(
    inputBytes,
    ({ input }) =>
      password
        ? [input, `--password=${password}`, "--show-encryption"]
        : [input, "--show-encryption"],
    {
      expectsOutput: false,
    }
  );

  const hasValidPassword =
    validation.status === 0 &&
    !hasInvalidPasswordError(validation.stderr) &&
    !isNotEncryptedMessage(validation.stderr);

  if (!hasValidPassword) {
    return {
      ...validation,
      outputBytes: undefined,
      passwordAccepted: false,
    };
  }

  const unlocked = await runQpdf(inputBytes, ({ input, output }) => [
    input,
    `--password=${password}`,
    "--decrypt",
    output,
  ]);

  return {
    ...unlocked,
    passwordAccepted: true,
  };
}

function getCompressionArgs(level: CompressionLevel) {
  if (level === "low") {
    return ["--compress-streams=y"];
  }

  if (level === "medium") {
    return [
      "--compress-streams=y",
      "--object-streams=generate",
      "--recompress-flate",
      "--decode-level=generalized",
      "--compression-level=9",
    ];
  }

  return [
    "--compress-streams=y",
    "--object-streams=generate",
    "--recompress-flate",
    "--decode-level=generalized",
    "--compression-level=9",
    "--optimize-images",
  ];
}

export async function compressPdf(inputBytes: Uint8Array, level: CompressionLevel) {
  return runQpdf(inputBytes, ({ input, output }) => [input, ...getCompressionArgs(level), output]);
}

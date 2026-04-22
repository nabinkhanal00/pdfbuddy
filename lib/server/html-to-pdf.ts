import { existsSync } from "node:fs";

const PDF_VIEWPORT = {
  deviceScaleFactor: 1,
  hasTouch: false,
  height: 960,
  isLandscape: false,
  isMobile: false,
  width: 1280,
};

const PDF_OPTIONS = {
  format: "A4" as const,
  margin: {
    bottom: "12mm",
    left: "12mm",
    right: "12mm",
    top: "12mm",
  },
  preferCSSPageSize: true,
  printBackground: true,
};

const LOCAL_BROWSER_HINTS = [
  process.env.PUPPETEER_EXECUTABLE_PATH,
  process.env.CHROME_EXECUTABLE_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium-browser",
  "/usr/bin/chromium",
].filter((value): value is string => Boolean(value));

function shouldUseServerlessBrowser() {
  return Boolean(
    process.env.VERCEL ||
    process.env.AWS_REGION ||
    process.env.AWS_EXECUTION_ENV,
  );
}

async function launchLocalBrowser() {
  const puppeteer = await import("puppeteer");

  let executablePath = LOCAL_BROWSER_HINTS.find((candidate) =>
    existsSync(candidate),
  );

  if (!executablePath) {
    try {
      const detectedPath = puppeteer.executablePath();

      if (detectedPath && existsSync(detectedPath)) {
        executablePath = detectedPath;
      }
    } catch {
      executablePath = undefined;
    }
  }

  return puppeteer.launch({
    ...(executablePath ? { executablePath } : {}),
    headless: true,
  });
}

async function launchServerlessBrowser(requestOrigin: string) {
  const [{ default: chromium }, puppeteer] = await Promise.all([
    import("@sparticuz/chromium-min"),
    import("puppeteer-core"),
  ]);

  chromium.setGraphicsMode = false;

  const executablePath = await chromium.executablePath(
    `${requestOrigin}/chromium-pack.tar`,
  );

  return puppeteer.launch({
    args: puppeteer.defaultArgs({
      args: chromium.args,
      headless: "shell",
    }),
    defaultViewport: PDF_VIEWPORT,
    executablePath,
    headless: "shell",
  });
}

async function launchPdfBrowser(requestOrigin: string) {
  if (shouldUseServerlessBrowser()) {
    return launchServerlessBrowser(requestOrigin);
  }

  return launchLocalBrowser();
}

export async function renderPdfDocument(input: {
  html?: string;
  requestOrigin: string;
  url?: string;
}) {
  const browser = await launchPdfBrowser(input.requestOrigin);

  try {
    const page = await browser.newPage();

    page.setDefaultNavigationTimeout(30_000);
    await page.setViewport(PDF_VIEWPORT);

    if (input.url) {
      await page.goto(input.url, {
        timeout: 30_000,
        waitUntil: "networkidle0",
      });
    } else if (input.html) {
      await page.setContent(input.html, {
        timeout: 30_000,
        waitUntil: "networkidle0",
      });
    } else {
      throw new Error("No HTML or URL input was provided.");
    }

    await page.emulateMediaType("screen");

    const pdf = await page.pdf(PDF_OPTIONS);

    return pdf;
  } finally {
    await browser.close();
  }
}

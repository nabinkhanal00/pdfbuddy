import { NextRequest, NextResponse } from "next/server";
import { renderPdfDocument } from "@/lib/server/html-to-pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RequestPayload =
  | {
      html: string;
      mode: "html";
    }
  | {
      mode: "url";
      url: string;
    };

function jsonError(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}

function sanitizeFilenamePart(value: string) {
  return value.replace(/[^a-z0-9-]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase();
}

export async function POST(request: NextRequest) {
  let payload: RequestPayload;

  try {
    payload = (await request.json()) as RequestPayload;
  } catch {
    return jsonError("The request body must be valid JSON.", 400);
  }

  if (payload.mode === "html") {
    if (!payload.html?.trim()) {
      return jsonError("HTML content is required.", 400);
    }
  } else if (payload.mode === "url") {
    if (!payload.url?.trim()) {
      return jsonError("A URL is required.", 400);
    }

    try {
      const parsedUrl = new URL(payload.url);

      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        return jsonError("Only http and https URLs are supported.", 400);
      }
    } catch {
      return jsonError("The provided URL is invalid.", 400);
    }
  } else {
    return jsonError("Unsupported conversion mode.", 400);
  }

  try {
    const pdf = await renderPdfDocument({
      html: payload.mode === "html" ? payload.html : undefined,
      requestOrigin: new URL(request.url).origin,
      url: payload.mode === "url" ? payload.url : undefined,
    });

    const filename =
      payload.mode === "url"
        ? `${sanitizeFilenamePart(new URL(payload.url).hostname || "webpage") || "webpage"}.pdf`
        : "document.pdf";

    return new NextResponse(pdf, {
      headers: {
        "Cache-Control": "no-store",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Type": "application/pdf",
      },
      status: 200,
    });
  } catch (error) {
    console.error("Failed to generate PDF:", error);

    return jsonError(
      "Could not generate the PDF. Check the source content or try again in a moment.",
      500
    );
  }
}

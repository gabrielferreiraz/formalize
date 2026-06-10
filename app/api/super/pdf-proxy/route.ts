import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const urlParam = req.nextUrl.searchParams.get("url");
  if (!urlParam) {
    return NextResponse.json({ error: "url é obrigatório" }, { status: 400 });
  }

  // SSRF protection: only allow HTTPS requests to known R2 domains
  let parsed: URL;
  try {
    parsed = new URL(urlParam);
  } catch {
    return NextResponse.json({ error: "URL inválida" }, { status: 400 });
  }

  const allowed =
    parsed.protocol === "https:" &&
    (parsed.hostname.endsWith(".r2.dev") ||
      parsed.hostname.endsWith(".r2.cloudflarestorage.com") ||
      parsed.hostname === (process.env.R2_PUBLIC_URL
        ? new URL(process.env.R2_PUBLIC_URL).hostname
        : "__none__"));

  if (!allowed) {
    return NextResponse.json({ error: "URL não permitida" }, { status: 403 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    // Forward Range header so pdfjs can use partial content (loads only the pages it needs)
    const rangeHeader = req.headers.get("range");
    const upstreamHeaders: HeadersInit = {};
    if (rangeHeader) upstreamHeaders["Range"] = rangeHeader;

    const res = await fetch(parsed.toString(), {
      signal: controller.signal,
      headers: upstreamHeaders,
    });
    clearTimeout(timeout);

    if (!res.ok && res.status !== 206) {
      return NextResponse.json({ error: "Falha ao buscar PDF" }, { status: 502 });
    }

    const responseHeaders: Record<string, string> = {
      "Content-Type": "application/pdf",
      "Content-Disposition": "inline",
      "Accept-Ranges": "bytes",
      "Cache-Control": "private, max-age=300, stale-while-revalidate=60",
    };

    // Forward size headers so pdfjs knows file length for range arithmetic
    const contentLength = res.headers.get("content-length");
    if (contentLength) responseHeaders["Content-Length"] = contentLength;
    const contentRange = res.headers.get("content-range");
    if (contentRange) responseHeaders["Content-Range"] = contentRange;

    // Stream body directly — no buffering, pdfjs starts rendering immediately
    return new NextResponse(res.body, {
      status: res.status,
      headers: responseHeaders,
    });
  } catch {
    clearTimeout(timeout);
    return NextResponse.json({ error: "Falha ao buscar PDF" }, { status: 502 });
  }
}

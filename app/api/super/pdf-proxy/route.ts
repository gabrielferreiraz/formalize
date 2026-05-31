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
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const res = await fetch(parsed.toString(), { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) {
      return NextResponse.json({ error: "Falha ao buscar PDF" }, { status: 502 });
    }
    const buffer = await res.arrayBuffer();
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline",
      },
    });
  } catch {
    clearTimeout(timeout);
    return NextResponse.json({ error: "Falha ao buscar PDF" }, { status: 502 });
  }
}

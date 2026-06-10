import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const apiUrl = process.env.WHATSAPP_API_URL;
  const instanceId = process.env.WHATSAPP_INSTANCE_USER_ID;
  const apiKey = process.env.WHATSAPP_API_KEY;

  if (!apiUrl || !instanceId) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const headers: Record<string, string> = {};
  if (apiKey) headers["apikey"] = apiKey;

  const getQR = async (): Promise<string | null> => {
    try {
      const res = await fetch(`${apiUrl}/instance/qr/${instanceId}`, { headers });
      if (!res.ok) return null;
      const json = await res.json() as { qrCode?: string };
      return json.qrCode ?? null;
    } catch {
      return null;
    }
  };

  // First attempt — may already have a QR ready
  const qr1 = await getQR();
  if (qr1) return NextResponse.json({ base64: qr1 });

  // Session may not exist — create it
  try {
    await fetch(`${apiUrl}/instance/create/${instanceId}`, { method: "GET", headers });
  } catch {
    // ignore create errors, proceed to poll
  }

  // Poll for QR — up to 3 attempts with 2s gap (6s total max, was 5s flat wait)
  for (let i = 0; i < 3; i++) {
    await new Promise(r => setTimeout(r, 2_000));
    const qr = await getQR();
    if (qr) return NextResponse.json({ base64: qr });
  }

  return NextResponse.json({ error: "qr_not_available" });
}

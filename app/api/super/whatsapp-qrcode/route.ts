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

  const reqHeaders: Record<string, string> = {};
  if (apiKey) reqHeaders["apikey"] = apiKey;

  const getQR = async (): Promise<string | null> => {
    try {
      const res = await fetch(`${apiUrl}/instance/qr/${instanceId}`, { headers: reqHeaders });
      if (!res.ok) return null;
      const json = await res.json() as { qrCode?: string };
      return json.qrCode ?? null;
    } catch {
      return null;
    }
  };

  // First attempt
  const qr1 = await getQR();
  if (qr1) return NextResponse.json({ base64: qr1 });

  // Session may not exist — create it
  try {
    const createRes = await fetch(`${apiUrl}/instance/create/${instanceId}`, {
      method: "GET",
      headers: reqHeaders,
    });
    console.log(`[whatsapp-qrcode] GET /instance/create → ${createRes.status}`);
  } catch (err) {
    console.error("[whatsapp-qrcode] create error:", err);
  }

  // Wait for QR to be generated after client.initialize()
  await new Promise(r => setTimeout(r, 5_000));

  const qr2 = await getQR();
  if (qr2) return NextResponse.json({ base64: qr2 });

  return NextResponse.json({ error: "qr_not_available" });
}

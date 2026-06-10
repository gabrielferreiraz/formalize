import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST() {
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

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiKey) headers["apikey"] = apiKey;

  try {
    const res = await fetch(`${apiUrl}/instance/logout/${instanceId}`, {
      method: "POST",
      headers,
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "logout_failed", apiStatus: res.status },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }
}

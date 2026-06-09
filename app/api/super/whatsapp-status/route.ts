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

  try {
    const res = await fetch(
      `${apiUrl}/instance/status/${instanceId}`,
      { method: "GET", headers: reqHeaders }
    );

    if (!res.ok) {
      // 404 = session not found in activeClients (needs /instance/create)
      return NextResponse.json({ state: "close", apiStatus: res.status });
    }

    const json = await res.json() as {
      status?: string;
      state?: string | null;
      authenticated?: boolean;
      lastError?: string | null;
      userId?: string;
    };

    let state: "open" | "close" | "connecting" = "close";
    if (json.status === "ready" || json.state === "CONNECTED") {
      state = "open";
    } else if (json.state == null && !json.lastError) {
      state = "connecting";
    }

    return NextResponse.json({
      state,
      instance: { instanceName: json.userId ?? instanceId, state },
    });
  } catch (err) {
    return NextResponse.json({ state: "close", error: String(err) });
  }
}

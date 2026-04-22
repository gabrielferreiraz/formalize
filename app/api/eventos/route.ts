import { NextResponse } from "next/server";

/** Histórico de eventos é local (localStorage); rota evita 500 por pedidos legados/SW. */
export async function GET() {
  return NextResponse.json([]);
}

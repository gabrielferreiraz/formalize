import { NextResponse } from "next/server";
import { CONTRATO_TEMPLATES, ORCAMENTO_TEMPLATES } from "@/lib/templates/registry";

export async function GET() {
  return NextResponse.json({
    orcamento: ORCAMENTO_TEMPLATES,
    contrato: CONTRATO_TEMPLATES,
  });
}

import { NextRequest, NextResponse } from "next/server";

import { buildCtr001 } from "@/lib/templates/contrato/ctr-001-classic";
import { buildCtr002 } from "@/lib/templates/contrato/ctr-002-light";
import { buildCtr003 } from "@/lib/templates/contrato/ctr-003-premium";
import { buildCtr004 } from "@/lib/templates/contrato/ctr-004-formal";
import { buildCtr005 } from "@/lib/templates/contrato/ctr-005-dark-gold";
import { buildCtr006 } from "@/lib/templates/contrato/ctr-006-dark-modern";

import { buildOrc001 } from "@/lib/templates/orcamento/orc-001-classic";
import { buildOrc002 } from "@/lib/templates/orcamento/orc-002-light";
import { buildOrc003 } from "@/lib/templates/orcamento/orc-003-executive";
import { buildOrc004 } from "@/lib/templates/orcamento/orc-004-prestige";
import { buildOrc005 } from "@/lib/templates/orcamento/orc-005-dark";
import { buildOrc006 } from "@/lib/templates/orcamento/orc-006-premium";
import { buildOrc007 } from "@/lib/templates/orcamento/orc-007-transport";

const contractTemplates: Record<string, Function> = {
  "ctr-001": buildCtr001,
  "ctr-002": buildCtr002,
  "ctr-003": buildCtr003,
  "ctr-004": buildCtr004,
  "ctr-005": buildCtr005,
  "ctr-006": buildCtr006,
};

const budgetTemplates: Record<string, Function> = {
  "orc-001": buildOrc001,
  "orc-002": buildOrc002,
  "orc-003": buildOrc003,
  "orc-004": buildOrc004,
  "orc-005": buildOrc005,
  "orc-006": buildOrc006,
  "orc-007": buildOrc007,
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tipo = searchParams.get("tipo");
  const templateId = searchParams.get("template");

  if (!tipo || !templateId) {
    return NextResponse.json({ error: "Tipo e template são obrigatórios" }, { status: 400 });
  }

  let templateFunc: Function | undefined;

  if (tipo === "contrato") {
    templateFunc = contractTemplates[templateId];
  } else if (tipo === "orcamento") {
    templateFunc = budgetTemplates[templateId];
  } else {
    return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
  }

  if (!templateFunc) {
    return NextResponse.json({ error: "Template não encontrado" }, { status: 404 });
  }

  return NextResponse.json({ template: templateFunc.toString() });
}

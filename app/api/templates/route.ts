import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CONTRATO_TEMPLATES, ORCAMENTO_TEMPLATES } from "@/lib/templates/registry";

export async function GET() {
  // Aplica overrides de nome/descrição e filtro isActive do DB
  const configs = await prisma.systemTemplate.findMany({
    select: { slug: true, name: true, description: true, isActive: true, sortOrder: true },
  }).catch(() => []);

  const cfgMap = Object.fromEntries(configs.map(c => [c.slug, c]));

  function applyConfig<T extends { id: string; name: string; description: string }>(list: T[]) {
    return list
      .filter(t => cfgMap[t.id]?.isActive !== false)
      .map(t => {
        const cfg = cfgMap[t.id];
        return cfg ? { ...t, name: cfg.name || t.name, description: cfg.description || t.description } : t;
      })
      .sort((a, b) => {
        const sa = cfgMap[a.id]?.sortOrder ?? 0;
        const sb = cfgMap[b.id]?.sortOrder ?? 0;
        return sa - sb;
      });
  }

  return NextResponse.json({
    orcamento: applyConfig(ORCAMENTO_TEMPLATES),
    contrato:  applyConfig(CONTRATO_TEMPLATES),
  });
}

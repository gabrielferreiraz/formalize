import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ORCAMENTO_TEMPLATES, CONTRATO_TEMPLATES } from "@/lib/templates/registry";

const ALL_TEMPLATES = [...ORCAMENTO_TEMPLATES, ...CONTRATO_TEMPLATES];

export async function GET() {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "SUPER_ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const configs = await prisma.systemTemplate.findMany();
  const cfgMap = Object.fromEntries(configs.map(c => [c.slug, c]));

  const result = ALL_TEMPLATES.map((t, idx) => {
    const cfg = cfgMap[t.id];
    return {
      slug:        t.id,
      type:        t.type,
      name:        cfg?.name        ?? t.name,
      description: cfg?.description ?? t.description,
      style:       t.style,
      previewBg:   t.previewBg,
      previewAccent: t.previewAccent,
      isActive:    cfg?.isActive    ?? true,
      hasCustomHtml: !!cfg?.customHtml,
      sortOrder:   cfg?.sortOrder   ?? idx,
      dbId:        cfg?.id          ?? null,
    };
  }).sort((a, b) => a.sortOrder - b.sortOrder);

  return NextResponse.json(result);
}

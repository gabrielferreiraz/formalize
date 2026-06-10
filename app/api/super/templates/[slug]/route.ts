import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ORCAMENTO_TEMPLATES, CONTRATO_TEMPLATES } from "@/lib/templates/registry";
import { invalidateCustomHtmlCache } from "@/lib/templates";

const ALL_SLUGS = new Set([
  ...ORCAMENTO_TEMPLATES.map(t => t.id),
  ...CONTRATO_TEMPLATES.map(t => t.id),
]);

type Ctx = { params: { slug: string } };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "SUPER_ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { slug } = params;
  if (!ALL_SLUGS.has(slug))
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const rec = await prisma.systemTemplate.findUnique({ where: { slug } });
  return NextResponse.json({ customHtml: rec?.customHtml ?? null });
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "SUPER_ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { slug } = params;
  if (!ALL_SLUGS.has(slug))
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const allTemplates = [...ORCAMENTO_TEMPLATES, ...CONTRATO_TEMPLATES];
  const base = allTemplates.find(t => t.id === slug)!;

  const data: Record<string, unknown> = {
    slug,
    type: base.type,
  };
  if (typeof body.name        === "string") data.name        = body.name.trim() || base.name;
  if (typeof body.description === "string") data.description = body.description.trim();
  if (typeof body.isActive    === "boolean") data.isActive   = body.isActive;
  if (typeof body.customHtml  === "string") data.customHtml  = body.customHtml || null;
  if (body.customHtml === null)             data.customHtml  = null;
  if (typeof body.sortOrder   === "number") data.sortOrder   = body.sortOrder;

  await prisma.systemTemplate.upsert({
    where:  { slug },
    update: data,
    create: { name: base.name, description: base.description, ...data } as any,
  });

  invalidateCustomHtmlCache(slug);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "SUPER_ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { slug } = params;
  await prisma.systemTemplate.deleteMany({ where: { slug } });
  invalidateCustomHtmlCache(slug);
  return NextResponse.json({ ok: true });
}

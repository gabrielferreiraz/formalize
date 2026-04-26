import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendToGotenberg, mergePdfs } from "@/lib/gotenberg";
import { uploadToR2, getPublicUrl } from "@/lib/r2";
import { buildTemplate } from "@/lib/templates";
import { fetchWithCache } from "@/lib/cache";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user.artistId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { type: "orcamento" | "contrato"; data: Record<string, unknown> };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const { type, data } = body;

  if (!type || !["orcamento", "contrato"].includes(type)) {
    return NextResponse.json({ error: "type inválido" }, { status: 400 });
  }

  if (!data || typeof data !== "object") {
    return NextResponse.json({ error: "data obrigatório" }, { status: 400 });
  }

  const artistId = session.user.artistId;

  const artist = await prisma.artist.findUnique({
    where: { id: artistId },
    select: {
      name: true,
      legalName: true,
      cnpj: true,
      logoUrl: true,
      backgroundUrl: true,
      primaryColor: true,
      secondaryColor: true,
      whatsapp: true,
      instagram: true,
      spotify: true,
      x: true,
      youtube: true,
      website: true,
      pixKey: true,
      bankInfo: true,
      address: true,
      instruments: true,
      basePdfUrl: true,
      baseContractPdfUrl: true,
      paperWidth: true,
      paperHeight: true,
      contractPaperWidth: true,
      contractPaperHeight: true,
      orcamentoFontScale: true,
      contratoFontScale: true,
      orcamentoLogoScale: true,
      contratoLogoScale: true,
      orcamentoTemplate: true,
      contratoTemplate: true,
      usarBasePdfOrcamento: true,
      usarBasePdfContrato: true,
    },
  });

  if (!artist) {
    return NextResponse.json({ error: "Artista não encontrado" }, { status: 404 });
  }

  try {
    const isContrato = type === "contrato";
    const basePdfUrl = isContrato ? artist.baseContractPdfUrl : artist.basePdfUrl;
    const effectivePaperWidth = isContrato
      ? (artist.contractPaperWidth ?? "21.0")
      : (artist.paperWidth ?? "21.0");
    const effectivePaperHeight = isContrato
      ? (artist.contractPaperHeight ?? "29.7")
      : (artist.paperHeight ?? "29.7");
    const pageSize = { width: effectivePaperWidth, height: effectivePaperHeight };

    // Busca todos os assets em paralelo (basePdf + logo + background)
    const [basePdfResult, logoResult, backgroundResult] = await Promise.all([
      basePdfUrl ? fetchWithCache(basePdfUrl) : Promise.resolve(null),
      artist.logoUrl ? fetchWithCache(artist.logoUrl) : Promise.resolve(null),
      artist.backgroundUrl ? fetchWithCache(artist.backgroundUrl) : Promise.resolve(null),
    ]);

    const preloaded = {
      logo: logoResult ? { base64: logoResult.buffer.toString("base64"), mime: logoResult.mime } : null,
      background: backgroundResult ? { base64: backgroundResult.buffer.toString("base64"), mime: backgroundResult.mime } : null,
    };

    // Se houver fontScale ou logoScale no body.data, sobrescreve o do artista para a geração
    const artistWithOverride = {
      ...artist,
      orcamentoFontScale: type === "orcamento" ? ((data.fontScale as number) ?? artist.orcamentoFontScale) : artist.orcamentoFontScale,
      contratoFontScale: type === "contrato" ? ((data.fontScale as number) ?? artist.contratoFontScale) : artist.contratoFontScale,
      orcamentoLogoScale: type === "orcamento" ? ((data.logoScale as number) ?? artist.orcamentoLogoScale) : artist.orcamentoLogoScale,
      contratoLogoScale: type === "contrato" ? ((data.logoScale as number) ?? artist.contratoLogoScale) : artist.contratoLogoScale,
    };

    // Gera HTML e converte via Gotenberg
    const html = await buildTemplate(type, artistWithOverride, data, pageSize, preloaded);
    const dynamicPdf = await sendToGotenberg(html, {
      paperWidth: effectivePaperWidth,
      paperHeight: effectivePaperHeight,
    });

    // Mescla com PDF base se houver permissão e arquivo
    let pdfBuffer: Buffer;
    const usarBase = type === 'orcamento' ? artist.usarBasePdfOrcamento : artist.usarBasePdfContrato;

    if (usarBase && basePdfResult) {
      const A4 = { width: 595.28, height: 841.89 };
      pdfBuffer = isContrato
        ? await mergePdfs([dynamicPdf, basePdfResult.buffer], A4)
        : await mergePdfs([basePdfResult.buffer, dynamicPdf]);
    } else {
      pdfBuffer = dynamicPdf;
    }

    // Computa key/URL antes do upload para paralelizar com DB save
    const d = data as Record<string, string>;
    const slugify = (s: string) =>
      (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim().replace(/\s+/g, " ");
    const nomeArquivo = `${isContrato ? "CONTRATO" : "ORCAMENTO"} - ${slugify(d.contratante || d.contratanteNome || "")} ${slugify(d.evento || "")} - ${(d.data || "").split("-").reverse().join("-")}.pdf`;
    const key = `documents/${artistId}/${nomeArquivo}`;
    const pdfUrl = getPublicUrl(key);

    const docType = isContrato ? "CONTRACT" : "BUDGET";
    const title = `${isContrato ? "Contrato" : "Orçamento"} — ${d.contratante || d.contratanteNome || ""}`.trim();

    // Upload R2 + DB save em paralelo
    const [, document] = await Promise.all([
      uploadToR2(key, pdfBuffer, "application/pdf"),
      prisma.document.create({
        data: { artistId, type: docType, title, pdfUrl, data: data as object },
      }),
    ]);

    return NextResponse.json({ pdfUrl, documentId: document.id });
  } catch (err) {
    console.error("[generate]", err);
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

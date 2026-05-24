import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendToGotenberg, mergePdfs } from "@/lib/gotenberg";
import { uploadToR2, getPublicUrl, getKeyFromUrl, deleteFromR2 } from "@/lib/r2";
import { buildTemplate } from "@/lib/templates";
import { fetchWithCache } from "@/lib/cache";
import { requestLogger, getRequestId } from "@/lib/logger";

export async function POST(req: NextRequest) {
  const requestId = getRequestId(req);
  const session = await getServerSession(authOptions);

  if (!session?.user.artistId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const artistId = session.user.artistId;
  const log = requestLogger({ requestId, artistId, action: "pdf.generate" });

  let body: { type: "orcamento" | "contrato"; data: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    log.warn("invalid JSON body");
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const { type, data } = body;

  if (!type || !["orcamento", "contrato"].includes(type)) {
    log.warn({ receivedType: type }, "invalid document type");
    return NextResponse.json({ error: "type inválido" }, { status: 400 });
  }

  if (!data || typeof data !== "object") {
    log.warn("missing or invalid data field");
    return NextResponse.json({ error: "data obrigatório" }, { status: 400 });
  }

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
    log.warn("artist not found in database");
    return NextResponse.json({ error: "Artista não encontrado" }, { status: 404 });
  }

  const t0 = Date.now();
  const isContrato = type === "contrato";
  const template = isContrato ? (artist.contratoTemplate ?? "ctr-001") : (artist.orcamentoTemplate ?? "orc-001");

  log.info({ type, template }, "pdf generation started");

  try {
    const basePdfUrl = isContrato ? artist.baseContractPdfUrl : artist.basePdfUrl;
    const effectivePaperWidth = isContrato
      ? (artist.contractPaperWidth ?? "21.0")
      : (artist.paperWidth ?? "21.0");
    const effectivePaperHeight = isContrato
      ? (artist.contractPaperHeight ?? "29.7")
      : (artist.paperHeight ?? "29.7");
    const pageSize = { width: effectivePaperWidth, height: effectivePaperHeight };

    // Busca todos os assets em paralelo (basePdf + logo + background)
    log.debug({ hasBasePdf: !!basePdfUrl, hasLogo: !!artist.logoUrl }, "fetching assets");
    const [basePdfResult, logoResult, backgroundResult] = await Promise.all([
      basePdfUrl ? fetchWithCache(basePdfUrl) : Promise.resolve(null),
      artist.logoUrl ? fetchWithCache(artist.logoUrl) : Promise.resolve(null),
      artist.backgroundUrl ? fetchWithCache(artist.backgroundUrl) : Promise.resolve(null),
    ]);

    const preloaded = {
      logo: logoResult ? { base64: logoResult.buffer.toString("base64"), mime: logoResult.mime } : null,
      background: backgroundResult ? { base64: backgroundResult.buffer.toString("base64"), mime: backgroundResult.mime } : null,
    };

    const artistWithOverride = {
      ...artist,
      orcamentoFontScale: type === "orcamento" ? ((data.fontScale as number) ?? artist.orcamentoFontScale) : artist.orcamentoFontScale,
      contratoFontScale: type === "contrato" ? ((data.fontScale as number) ?? artist.contratoFontScale) : artist.contratoFontScale,
      orcamentoLogoScale: type === "orcamento" ? ((data.logoScale as number) ?? artist.orcamentoLogoScale) : artist.orcamentoLogoScale,
      contratoLogoScale: type === "contrato" ? ((data.logoScale as number) ?? artist.contratoLogoScale) : artist.contratoLogoScale,
    };

    log.debug({ template }, "building HTML template");
    const html = await buildTemplate(type, artistWithOverride, data, pageSize, preloaded);

    const tGotenberg = Date.now();
    log.debug({ paperWidth: effectivePaperWidth, paperHeight: effectivePaperHeight }, "sending to Gotenberg");

    let dynamicPdf: Buffer;
    try {
      dynamicPdf = await sendToGotenberg(html, {
        paperWidth: effectivePaperWidth,
        paperHeight: effectivePaperHeight,
      });
    } catch (err) {
      log.error({ err, durationMs: Date.now() - tGotenberg }, "Gotenberg conversion failed");
      throw err;
    }

    log.info({ durationMs: Date.now() - tGotenberg }, "Gotenberg conversion completed");

    // Mescla com PDF base se houver permissão e arquivo
    let pdfBuffer: Buffer;
    const usarBase = type === "orcamento" ? artist.usarBasePdfOrcamento : artist.usarBasePdfContrato;

    if (usarBase && basePdfResult) {
      log.debug("merging with base PDF");
      const A4 = { width: 595.28, height: 841.89 };
      pdfBuffer = isContrato
        ? await mergePdfs([dynamicPdf, basePdfResult.buffer], A4)
        : await mergePdfs([basePdfResult.buffer, dynamicPdf]);
    } else {
      pdfBuffer = dynamicPdf;
    }

    const d = data as Record<string, string>;
    const slugify = (s: string) =>
      (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().trim().replace(/\s+/g, " ");
    const nomeArquivo = `${isContrato ? "CONTRATO" : "ORCAMENTO"} - ${slugify(d.contratante || d.contratanteNome || "")} ${slugify(d.evento || "")} - ${(d.data || "").split("-").reverse().join("-")}.pdf`;
    const key = `documents/${artistId}/${nomeArquivo}`;
    const pdfUrl = getPublicUrl(key);

    const docType = isContrato ? "CONTRACT" : "BUDGET";
    const title = `${isContrato ? "Contrato" : "Orçamento"} — ${d.contratante || d.contratanteNome || ""}`.trim();

    const tUpload = Date.now();
    log.debug({ key, docType }, "uploading to R2 and saving to database");

    let document: { id: string };
    try {
      [, document] = await Promise.all([
        uploadToR2(key, pdfBuffer, "application/pdf"),
        prisma.document.create({
          data: { artistId, type: docType, title, pdfUrl, data: data as object },
        }),
      ]);
    } catch (err) {
      log.error({ err, key, docType, durationMs: Date.now() - tUpload }, "R2 upload or database save failed");
      throw err;
    }

    log.info({
      documentId: document.id,
      docType,
      uploadDurationMs: Date.now() - tUpload,
      totalDurationMs: Date.now() - t0,
    }, "pdf generation completed");

    // Rotatividade de PDFs no R2: BUDGET=10, CONTRACT=5 — fire and forget
    const PDF_LIMITS: Record<string, number> = { BUDGET: 10, CONTRACT: 5 };
    const pdfLimit = PDF_LIMITS[docType];
    prisma.document
      .findMany({
        where: { artistId, type: docType, pdfUrl: { not: null } },
        orderBy: { createdAt: "asc" },
        select: { id: true, pdfUrl: true },
      })
      .then(async (docsWithPdf) => {
        const excess = docsWithPdf.length - pdfLimit;
        if (excess <= 0) return;
        const toClean = docsWithPdf.slice(0, excess);
        log.debug({ count: toClean.length, docType }, "rotating old PDFs from R2");
        await Promise.all([
          ...toClean.map((doc) =>
            deleteFromR2(getKeyFromUrl(doc.pdfUrl!)).catch((err) =>
              log.error({ err, pdfUrl: doc.pdfUrl }, "R2 rotation delete failed")
            )
          ),
          prisma.document.updateMany({
            where: { id: { in: toClean.map((d) => d.id) } },
            data: { pdfUrl: null },
          }),
        ]);
      })
      .catch((err) => log.error({ err, docType }, "pdf rotation background job failed"));

    return NextResponse.json({ pdfUrl, documentId: document.id });
  } catch (err) {
    log.error({
      err,
      type,
      template,
      durationMs: Date.now() - t0,
    }, "pdf generation failed");
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

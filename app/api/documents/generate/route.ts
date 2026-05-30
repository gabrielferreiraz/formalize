import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendToGotenberg, mergePdfs } from "@/lib/gotenberg";
import { uploadToR2, getPublicUrl, getKeyFromUrl, deleteFromR2 } from "@/lib/r2";
import { buildTemplate } from "@/lib/templates";
import { getPresetClausulas } from "@/lib/contrato-clausulas";
import { fetchWithCache } from "@/lib/cache";
import { requestLogger, getRequestId } from "@/lib/logger";
import { applyFieldsToBasePdf, buildOverlayVars, type FieldPlacement } from "@/lib/pdf-overlay";

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

  // Check if artist selected a custom PDF template (overlay flow)
  let pdfMapping: { pdfUrl: string; fields: unknown; pageCount: number } | null = null;
  if (template.startsWith("pdf:")) {
    const mappingId = template.slice(4);
    const found = await prisma.pdfTemplateMapping.findFirst({
      where: { id: mappingId, artistId },
      select: { pdfUrl: true, fields: true, pageCount: true, isActive: true },
    });
    if (found?.isActive) pdfMapping = found;
  }

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

    // Resolve clausulas for clause-based contract rendering
    let buildData = data;
    if (isContrato) {
      const templateId = data.clausulasTemplateId as string | undefined;
      const preset = data.clausulasPreset as string | undefined;
      if (templateId) {
        const cTemplate = await prisma.contratoTemplate.findFirst({
          where: { id: templateId, artistId },
          select: { clausulas: true, titulo: true },
        });
        if (cTemplate && Array.isArray(cTemplate.clausulas)) {
          buildData = { ...data, _clausulas: cTemplate.clausulas, _clausulasTitulo: cTemplate.titulo };
        }
      } else if (preset && ["banda", "solo", "dj", "generico"].includes(preset)) {
        buildData = { ...data, _clausulas: getPresetClausulas(preset as any) };
      }
    }

    let pdfBuffer: Buffer;

    if (pdfMapping) {
      // ── Overlay flow: stamp text onto artist's custom PDF ──
      log.info("using custom PDF template mapping (overlay flow)");
      const vars = buildOverlayVars(artistWithOverride as any, buildData as Record<string, any>);
      const baseRes = await fetch(pdfMapping.pdfUrl);
      if (!baseRes.ok) throw new Error("Falha ao baixar PDF base do template");
      const baseBuffer = Buffer.from(await baseRes.arrayBuffer());
      const overlaid = await applyFieldsToBasePdf(
        baseBuffer,
        vars,
        (pdfMapping.fields as unknown as FieldPlacement[]) ?? []
      );
      pdfBuffer = Buffer.from(overlaid);
    } else {
      // ── Standard flow: HTML → Gotenberg → optional base PDF merge ──
      log.debug({ template }, "building HTML template");
      const html = await buildTemplate(type, artistWithOverride, buildData, pageSize, preloaded);

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
    }

    const d = data as Record<string, string>;
    const docType = isContrato ? "CONTRACT" : "BUDGET";
    const title = `${isContrato ? "Contrato" : "Orçamento"} — ${d.contratante || d.contratanteNome || ""}`.trim();

    const tUpload = Date.now();

    // Step 1: Create DB record first to obtain a stable unique ID.
    // This prevents filename collisions in R2 and gives us a rollback target.
    let docRecord: { id: string };
    try {
      docRecord = await prisma.document.create({
        data: { artistId, type: docType, title, data: data as object },
        select: { id: true },
      });
    } catch (err) {
      log.error({ err, docType, durationMs: Date.now() - tUpload }, "database record creation failed");
      throw err;
    }

    // Step 2: Key uses document ID — collision-free regardless of content.
    const key = `documents/${artistId}/${docRecord.id}.pdf`;
    const pdfUrl = getPublicUrl(key);

    log.debug({ key, docType, docId: docRecord.id }, "uploading PDF to R2");

    // Step 3: Upload to R2. On failure, roll back the DB record so no orphan exists.
    try {
      await uploadToR2(key, pdfBuffer, "application/pdf");
    } catch (err) {
      log.error({ err, key, docType, durationMs: Date.now() - tUpload }, "R2 upload failed — rolling back DB record");
      await prisma.document.delete({ where: { id: docRecord.id } }).catch((deleteErr) =>
        log.error({ deleteErr, docId: docRecord.id }, "failed to rollback DB record after R2 failure")
      );
      throw err;
    }

    // Step 4: Persist the confirmed pdfUrl into the record.
    await prisma.document.update({
      where: { id: docRecord.id },
      data: { pdfUrl },
    });

    const document = docRecord;

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

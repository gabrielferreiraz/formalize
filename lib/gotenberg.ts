const GOTENBERG_URL =
  process.env.GOTENBERG_URL ??
  "https://reobote-gotenberg-api-pdf.to0i0r.easypanel.host";

/**
 * Envia HTML para o Gotenberg e retorna o PDF como Buffer.
 */
export async function sendToGotenberg(
  html: string,
  options?: { paperWidth?: string; paperHeight?: string },
): Promise<Buffer> {
  const form = new FormData();
  form.append("files", new Blob([html], { type: "text/html" }), "index.html");
  form.append("paperWidth", options?.paperWidth ?? "21.0");
  form.append("paperHeight", options?.paperHeight ?? "29.7");
  form.append("marginTop", "0.0");
  form.append("marginBottom", "0.0");
  form.append("marginLeft", "0.0");
  form.append("marginRight", "0.0");
  form.append("scale", "1.0");
  form.append("printBackground", "true");
  form.append("preferCssPageSize", "true");

  const res = await fetch(
    `${GOTENBERG_URL}/forms/chromium/convert/html`,
    { method: "POST", body: form },
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Gotenberg error ${res.status}: ${text}`);
  }

  return Buffer.from(await res.arrayBuffer());
}

import { PDFDocument } from "pdf-lib";

/**
 * Concatena múltiplos PDFs em ordem.
 * Se normalizeToPoints for passado, todas as páginas são escalonadas para esse tamanho (em pontos PDF).
 */
export async function mergePdfs(
  pdfs: Buffer[],
  normalizeToPoints?: { width: number; height: number },
): Promise<Buffer> {
  const result = await PDFDocument.create();

  for (const pdf of pdfs) {
    const doc = await PDFDocument.load(pdf);

    for (let i = 0; i < doc.getPageCount(); i++) {
      if (normalizeToPoints) {
        const { width: tw, height: th } = normalizeToPoints;
        const embedded = await result.embedPage(doc.getPage(i));
        const page = result.addPage([tw, th]);
        page.drawPage(embedded, { x: 0, y: 0, width: tw, height: th });
      } else {
        const [copied] = await result.copyPages(doc, [i]);
        result.addPage(copied);
      }
    }
  }

  return Buffer.from(await result.save({ useObjectStreams: true }));
}

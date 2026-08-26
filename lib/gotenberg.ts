const GOTENBERG_URL =
  process.env.GOTENBERG_URL ??
  "https://reobote-gotenberg-api-pdf.to0i0r.easypanel.host";

/**
 * Envia HTML para o Gotenberg e retorna o PDF como Buffer.
 */
export async function sendToGotenberg(html: string): Promise<Buffer> {
  const form = new FormData();
  form.append("files", new Blob([html], { type: "text/html" }), "index.html");
  form.append("paperWidth", "21.0");
  form.append("paperHeight", "29.7");
  form.append("marginTop", "0.0");
  form.append("marginBottom", "0.0");
  form.append("marginLeft", "0.0");
  form.append("marginRight", "0.0");
  form.append("scale", "1.0");
  form.append("printBackground", "true");
  form.append("preferCssPageSize", "true");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45_000);

  let res: Response;
  try {
    res = await fetch(
      `${GOTENBERG_URL}/forms/chromium/convert/html`,
      { method: "POST", body: form, signal: controller.signal },
    );
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      throw new Error("Geração de PDF expirou (45s). Tente novamente.");
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Gotenberg error ${res.status}: ${text}`);
  }

  return Buffer.from(await res.arrayBuffer());
}

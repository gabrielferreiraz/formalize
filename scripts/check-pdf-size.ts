import { PDFDocument } from "pdf-lib";

const url = "https://pub-8b013d06768841f7a14bf65b8219e6f6.r2.dev/assets/givago/base.pdf";

async function main() {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());

  const pdf = await PDFDocument.load(buffer);
  const page = pdf.getPage(0);
  const { width, height } = page.getSize();

  console.log("Dimensões em pontos:", width, "x", height);
  console.log("Em cm  (1pt = 0.0352778cm):", (width * 0.0352778).toFixed(4), "x", (height * 0.0352778).toFixed(4));
  console.log("Em in  (1pt = 1/72in):", (width / 72).toFixed(4), "x", (height / 72).toFixed(4));
}

main().catch(console.error);

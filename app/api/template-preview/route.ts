import { NextResponse } from "next/server";
import { assertSuperAdmin } from "@/lib/super-auth";
import { buildOrc001 } from "@/lib/templates/orcamento/orc-001-classic";
import { buildOrc002 } from "@/lib/templates/orcamento/orc-002-light";

const SAMPLE_ARTIST = {
  name: "Artista Exemplo",
  legalName: "Artista Exemplo Ltda",
  cnpj: "00.000.000/0001-00",
  primaryColor: "#E8A045",
  secondaryColor: "#ffffff",
  whatsapp: "(67) 99999-9999",
  instagram: "@artistaexemplo",
  website: "www.artistaexemplo.com.br",
  logoUrl: null,
  backgroundUrl: null,
  address: { rua: "Rua Exemplo", numero: "123", bairro: "Centro", cidade: "Campo Grande", estado: "MS" },
  bankInfo: { titular: "Artista Exemplo Ltda", pix: "00.000.000/0001-00", banco: "Banco Exemplo", conta: "00000-0", agencia: "0000" },
  pixKey: "00.000.000/0001-00",
  instruments: "Bateria, Percussão, Guitarra, Baixo, Sanfona",
  orcamentoTemplate: "orc-001",
  contratoTemplate: "ctr-001",
  orcamentoFontScale: 1,
  contratoFontScale: 1,
  orcamentoLogoScale: 1,
  contratoLogoScale: 1,
};

const SAMPLE_DATA = {
  contratante: "João Silva",
  evento: "Casamento",
  local: "Chácara das Palmeiras",
  cidade: "Campo Grande - MS",
  data: "2025-08-15",
  horarioDefinido: true,
  horario: "20:00",
  horas: 3,
  cache: "500000",
  backline: "incluso",
  backlineValor: "0",
  transporte: "valor",
  transporteValor: "50000",
  alimentacao: "incluso",
  alimentacaoValor: "0",
  hospedagem: "vazio",
  hospedagemValor: "0",
  formaPagamento: "30% de entrada + 70% no dia",
};

export async function GET() {
  const { error } = await assertSuperAdmin();
  if (error) return error;

  const [html001, html002] = await Promise.all([
    buildOrc001(SAMPLE_ARTIST as any, SAMPLE_DATA, undefined, null, null),
    buildOrc002(SAMPLE_ARTIST as any, SAMPLE_DATA, undefined, null),
  ]);

  const payload = JSON.stringify({ html001, html002 });

  const page = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Template Preview — Classic vs Light</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #07090e; font-family: Inter, system-ui, sans-serif; height: 100vh; display: flex; flex-direction: column; }
    .bar { padding: 14px 20px; background: #0e1118; border-bottom: 1px solid #252d3d; display: flex; align-items: center; gap: 16px; flex-shrink: 0; }
    .bar h1 { color: #f5c842; font-size: 15px; font-weight: 700; }
    .bar span { color: #6b7280; font-size: 12px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding: 12px; flex: 1; min-height: 0; }
    .panel { display: flex; flex-direction: column; gap: 8px; min-height: 0; }
    .label { color: #94a3b8; font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; padding: 6px 12px; background: #1a1f2e; border-radius: 8px; border: 1px solid #252d3d; flex-shrink: 0; }
    .classic .label { color: #f5c842; border-color: rgba(245,200,66,0.3); background: rgba(245,200,66,0.06); }
    iframe { flex: 1; border: 1px solid #252d3d; border-radius: 10px; width: 100%; min-height: 0; }
  </style>
</head>
<body>
  <div class="bar">
    <h1>Template Preview</h1>
    <span>orc-001 Classic (dark) × orc-002 Light — dados de exemplo</span>
  </div>
  <div class="grid">
    <div class="panel classic">
      <div class="label">orc-001 — Classic (dark) — atual padrão</div>
      <iframe id="f1"></iframe>
    </div>
    <div class="panel">
      <div class="label">orc-002 — Light — em revisão</div>
      <iframe id="f2"></iframe>
    </div>
  </div>
  <script>
    const data = ${payload};
    function loadFrame(id, html) {
      const blob = new Blob([html], { type: 'text/html' });
      document.getElementById(id).src = URL.createObjectURL(blob);
    }
    loadFrame('f1', data.html001);
    loadFrame('f2', data.html002);
  </script>
</body>
</html>`;

  return new NextResponse(page, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

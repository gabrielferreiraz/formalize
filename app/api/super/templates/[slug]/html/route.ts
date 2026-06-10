import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ORCAMENTO_TEMPLATES, CONTRATO_TEMPLATES } from "@/lib/templates/registry";
import { buildTemplate } from "@/lib/templates";

const ALL_TEMPLATES = [...ORCAMENTO_TEMPLATES, ...CONTRATO_TEMPLATES];

// Artista de demonstração usado para gerar o HTML de referência no editor
const DEMO_ARTIST = {
  name: "Banda Exemplo",
  legalName: "Banda Exemplo Ltda",
  cnpj: "12.345.678/0001-90",
  logoUrl: null,
  backgroundUrl: null,
  primaryColor: "#e6b800",
  instruments: "Guitarra, Baixo, Bateria, Voz",
  whatsapp: "(67) 99999-9999",
  email: "contato@bandaexemplo.com",
  instagram: "@bandaexemplo",
  spotify: null, x: null, youtube: null, website: null,
  pixKey: "12.345.678/0001-90",
  address: null, bankInfo: null,
  paperWidth: "21.0", paperHeight: "29.7",
  contractPaperWidth: "21.0", contractPaperHeight: "29.7",
  orcamentoFontScale: 100, contratoFontScale: 100,
  orcamentoLogoScale: 100, contratoLogoScale: 100,
  orcamentoTemplate: "orc-001", contratoTemplate: "ctr-001",
};

const DEMO_ORC = {
  contratante: "Espaço de Eventos Modelo",
  evento: "Aniversário Corporativo",
  data: "2025-12-20",
  horario: "21:00",
  local: "Salão Garden Premium",
  cidade: "Campo Grande",
  horas: "3",
  cache: "1800000",
  backline: "incluso",
  transporte: "incluso",
  alimentacao: "incluso",
  hospedagem: "nao",
  formaPagamento: "50% na assinatura + 50% no dia",
};

const DEMO_CTR = {
  contratanteNome: "João Carlos Pereira",
  contratanteCpfCnpj: "123.456.789-00",
  contratanteRg: "1.234.567",
  data: "2025-12-20",
  horario: "21:00",
  local: "Salão Garden Premium",
  cidadeEvento: "Campo Grande/MS",
  cidade: "Campo Grande",
  horas: "3",
  cache: "1800000",
  backline: "incluso",
  transporte: "incluso",
  alimentacao: "nao",
  hospedagem: "nao",
  formaPagamento: "50% na assinatura e 50% uma semana antes",
};

type Ctx = { params: { slug: string } };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "SUPER_ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { slug } = params;
  const meta = ALL_TEMPLATES.find(t => t.id === slug);
  if (!meta) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const type = meta.type;
  const artistOverride = {
    ...DEMO_ARTIST,
    orcamentoTemplate: type === "orcamento" ? slug : DEMO_ARTIST.orcamentoTemplate,
    contratoTemplate:  type === "contrato"  ? slug : DEMO_ARTIST.contratoTemplate,
  };

  const html = await buildTemplate(
    type,
    artistOverride,
    type === "orcamento" ? DEMO_ORC : DEMO_CTR,
    { width: "21.0", height: "29.7" },
  );

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

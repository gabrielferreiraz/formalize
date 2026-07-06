export interface TemplateInfo {
  id: string;
  type: "orcamento" | "contrato";
  name: string;
  description: string;
  style: "dark" | "light" | "colorful";
  previewBg: string;
  previewAccent: string;
}

export const ORCAMENTO_TEMPLATES: TemplateInfo[] = [
  {
    id: "orc-001",
    type: "orcamento",
    name: "Minimalista",
    description: "Design limpo e geométrico com fonte Inter — moderno e profissional",
    style: "light",
    previewBg: "#ffffff",
    previewAccent: "#000000",
  },
  {
    id: "orc-002",
    type: "orcamento",
    name: "Light",
    description: "Fundo claro com barra colorida — leve e limpo",
    style: "light",
    previewBg: "#f8f8f6",
    previewAccent: "#111111",
  },
  {
    id: "orc-003",
    type: "orcamento",
    name: "Profissional",
    description: "Modelo profissional com tabela de itens, termos de validade e área para assinatura",
    style: "light",
    previewBg: "#f8f8f6",
    previewAccent: "#8da4b5",
  },
  {
    id: "orc-004",
    type: "orcamento",
    name: "Prestige",
    description: "Escuro sólido com tipografia bold e acento primário",
    style: "dark",
    previewBg: "#0c0c0c",
    previewAccent: "#E8A045",
  },
  {
    id: "orc-005",
    type: "orcamento",
    name: "Dark Gold",
    description: "Fundo quase preto com cards escuros e total em ouro — sofisticado",
    style: "dark",
    previewBg: "#0e0e12",
    previewAccent: "#c9a227",
  },
  {
    id: "orc-006",
    type: "orcamento",
    name: "Premium",
    description: "Barra lateral colorida com tipografia premium — elegante e refinado",
    style: "light",
    previewBg: "#f8f8f6",
    previewAccent: "#E8A045",
  },
  {
    id: "orc-007",
    type: "orcamento",
    name: "Transport",
    description: "Estilo industrial com ícones — perfeito para eventos com logística pesada",
    style: "light",
    previewBg: "#f1f5f9",
    previewAccent: "#2563eb",
  },
];

export const CONTRATO_TEMPLATES: TemplateInfo[] = [
  {
    id: "ctr-001",
    type: "contrato",
    name: "Classic",
    description: "Cabeçalho escuro com logo e destaque colorido nas cláusulas",
    style: "light",
    previewBg: "#ffffff",
    previewAccent: "#E8A045",
  },
  {
    id: "ctr-002",
    type: "contrato",
    name: "Light",
    description: "Fundo claro minimalista — simples e funcional",
    style: "light",
    previewBg: "#f8f8f6",
    previewAccent: "#111111",
  },
  {
    id: "ctr-003",
    type: "contrato",
    name: "Premium",
    description: "Barra lateral colorida com tipografia premium — elegante",
    style: "light",
    previewBg: "#ffffff",
    previewAccent: "#E8A045",
  },
  {
    id: "ctr-004",
    type: "contrato",
    name: "Formal",
    description: "Cabeçalho colorido, seções numeradas — institucional",
    style: "light",
    previewBg: "#ffffff",
    previewAccent: "#E8A045",
  },
  {
    id: "ctr-005",
    type: "contrato",
    name: "Dark Gold",
    description: "Fundo preto profundo com barra lateral e texto dourado — premium escuro",
    style: "dark",
    previewBg: "#0d0d0d",
    previewAccent: "#c9a227",
  },
  {
    id: "ctr-006",
    type: "contrato",
    name: "Dark Modern",
    description: "Azul escuro com cláusulas numeradas e tipografia Inter — moderno e limpo",
    style: "dark",
    previewBg: "#0f1117",
    previewAccent: "#818cf8",
  },
];

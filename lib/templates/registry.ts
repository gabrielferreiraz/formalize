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
    description: "Branco e preto — moderno e profissional",
    style: "light",
    previewBg: "#ffffff",
    previewAccent: "#000000",
  },
  {
    id: "orc-002",
    type: "orcamento",
    name: "Light",
    description: "Branco com detalhes em preto — moderno e limpo",
    style: "light",
    previewBg: "#ffffff",
    previewAccent: "#1a1a1a",
  },
  {
    id: "orc-003",
    type: "orcamento",
    name: "Profissional",
    description: "Tons claros e neutros, com azul acinzentado — sóbrio e profissional",
    style: "light",
    previewBg: "#f8f8f6",
    previewAccent: "#8da4b5",
  },
  {
    id: "orc-004",
    type: "orcamento",
    name: "Prestige",
    description: "Fundo escuro sólido com dourado — forte e elegante",
    style: "dark",
    previewBg: "#0c0c0c",
    previewAccent: "#E8A045",
  },
  {
    id: "orc-005",
    type: "orcamento",
    name: "Dark Gold",
    description: "Fundo quase preto com detalhes em dourado — sofisticado",
    style: "dark",
    previewBg: "#0e0e12",
    previewAccent: "#c9a227",
  },
  {
    id: "orc-006",
    type: "orcamento",
    name: "Premium",
    description: "Tons claros com dourado em destaque — elegante e refinado",
    style: "light",
    previewBg: "#f8f8f6",
    previewAccent: "#E8A045",
  },
  {
    id: "orc-007",
    type: "orcamento",
    name: "Transport",
    description: "Tons claros com azul em destaque — direto e funcional",
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
    description: "Tons neutros com cinza-escuro — elegante e organizado",
    style: "light",
    previewBg: "#f5f5f5",
    previewAccent: "#2d2d2d",
  },
  {
    id: "ctr-002",
    type: "contrato",
    name: "Light",
    description: "Branco com detalhes em preto — moderno e limpo",
    style: "light",
    previewBg: "#ffffff",
    previewAccent: "#1a1a1a",
  },
  {
    id: "ctr-003",
    type: "contrato",
    name: "Premium",
    description: "Fundo escuro com dourado em destaque — sofisticado e imponente",
    style: "dark",
    previewBg: "#06080f",
    previewAccent: "#e59a18",
  },
  {
    id: "ctr-004",
    type: "contrato",
    name: "Formal",
    description: "Branco com dourado em destaque — institucional",
    style: "light",
    previewBg: "#ffffff",
    previewAccent: "#E8A045",
  },
  {
    id: "ctr-005",
    type: "contrato",
    name: "Dark Gold",
    description: "Fundo preto profundo com dourado — premium e escuro",
    style: "dark",
    previewBg: "#0d0d0d",
    previewAccent: "#c9a227",
  },
  {
    id: "ctr-006",
    type: "contrato",
    name: "Dark Modern",
    description: "Fundo escuro com rosa neon em destaque — moderno e impactante",
    style: "dark",
    previewBg: "#09090d",
    previewAccent: "#ec4899",
  },
];

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
    name: "Classic",
    description: "Fundo escuro com foto e destaque na cor do artista",
    style: "dark",
    previewBg: "#111111",
    previewAccent: "#E8A045",
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
    name: "Executivo",
    description: "Branco corporativo com cards estruturados — sem foto",
    style: "light",
    previewBg: "#f2f2ee",
    previewAccent: "#E8A045",
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
];

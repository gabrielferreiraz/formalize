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
    description: "Fundo escuro com destaque dourado",
    style: "dark",
    previewBg: "#111111",
    previewAccent: "#E8A045",
  },
  {
    id: "orc-002",
    type: "orcamento",
    name: "Light",
    description: "Fundo claro com barra colorida",
    style: "light",
    previewBg: "#f8f8f6",
    previewAccent: "#111111",
  },
];

export const CONTRATO_TEMPLATES: TemplateInfo[] = [
  {
    id: "ctr-001",
    type: "contrato",
    name: "Classic",
    description: "Fundo branco com cabeçalho escuro",
    style: "light",
    previewBg: "#ffffff",
    previewAccent: "#E8A045",
  },
  {
    id: "ctr-002",
    type: "contrato",
    name: "Light",
    description: "Fundo claro minimalista",
    style: "light",
    previewBg: "#f8f8f6",
    previewAccent: "#111111",
  },
];

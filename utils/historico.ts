// utils/historico.ts — Histórico e dados locais (migrado de Givago)

// ── Locais fixos (Campo Grande + Dourados) ───────────────────────────────────

export const LOCAIS_FIXOS: string[] = [
  "Bosque dos Ipês",
  "Shopping Campo Grande",
  "Shopping Norte Sul Plaza",
  "Morada dos Baís",
  "Parque das Nações Indígenas",
  "Centro de Convenções Arquiteto Rubens Gil de Camillo",
  "Esplanada Ferroviária",
  "Horto Florestal",
  "Parque Ayrton Senna",
  "Cabaña Del Primo",
  "Cervejaria Prosa",
  "Villa Bistrô",
  "Estância Toca da Onça",
  "Shopping Dourados",
  "Parque dos Ipês (Dourados)",
  "Centro de Eventos José Octávio Guizzo",
];

export const ENDERECOS_LOCAIS: Record<string, string> = {
  "Bosque dos Ipês":
    "Av. Cônsul Assaf Trad, Parque dos Poderes, Campo Grande - MS",
  "Shopping Campo Grande":
    "Av. Afonso Pena, 4909, Santa Fé, Campo Grande - MS, 79031-900",
  "Shopping Norte Sul Plaza":
    "Av. Pres. Ernesto Geisel, 2300, Jardim Jacy, Campo Grande - MS",
  "Morada dos Baís":
    "Av. Noroeste, 5140, Centro, Campo Grande - MS, 79002-460",
  "Parque das Nações Indígenas":
    "R. Antônio Maria Coelho, Jardim dos Estados, Campo Grande - MS",
  "Centro de Convenções Arquiteto Rubens Gil de Camillo":
    "Parque dos Poderes, Bloco 9, Campo Grande - MS",
  "Esplanada Ferroviária":
    "R. 14 de Julho, s/n, Centro, Campo Grande - MS",
  "Horto Florestal":
    "Av. Ricardo Brandão, 780, Jardim Veraneio, Campo Grande - MS",
  "Parque Ayrton Senna":
    "Av. Cônsul Assaf Trad, s/n, Jardim Veraneio, Campo Grande - MS",
  "Cabaña Del Primo":
    "R. Antônio Maria Coelho, 6000, Chácara Cachoeira, Campo Grande - MS",
  "Cervejaria Prosa":
    "R. Dr. Temístocles, 103, Centro, Campo Grande - MS",
  "Villa Bistrô":
    "R. Pedro Celestino, 1820, Centro, Campo Grande - MS",
  "Estância Toca da Onça":
    "Rod. BR-262, Km 12, Campo Grande - MS",
  "Shopping Dourados":
    "R. Firmo Vieira de Oliveira, 1033, Jardim Central, Dourados - MS",
  "Parque dos Ipês (Dourados)":
    "Av. Marcelino Pires, Dourados - MS",
  "Centro de Eventos José Octávio Guizzo":
    "R. 26 de Agosto, 382, Centro, Campo Grande - MS",
};

export const EVENTOS_FIXOS: string[] = [
  "Casamento",
  "Aniversário",
  "Formatura",
  "Evento Corporativo",
  "Confraternização",
  "Festival",
  "Show Particular",
  "Reveillon",
  "Carnaval",
  "Festa Junina",
  "Outros",
];

// ── Chaves localStorage (prefixo formalize_) ─────────────────────────────────

const KEY_HISTORICO = "formalize_historico";
const KEY_LOCAIS = "formalize_locais";
const KEY_EVENTOS = "formalize_eventos";
const KEY_FRASES = "formalize_frases_rodape";

// ── Histórico (genérico) ─────────────────────────────────────────────────────

export interface HistoricoItem {
  [key: string]: unknown;
  timestamp?: number;
}

export function salvarHistorico(item: HistoricoItem): void {
  const lista = carregarHistorico();
  lista.unshift({ ...item, timestamp: Date.now() });
  localStorage.setItem(KEY_HISTORICO, JSON.stringify(lista.slice(0, 50)));
}

export function carregarHistorico(): HistoricoItem[] {
  try {
    return JSON.parse(localStorage.getItem(KEY_HISTORICO) ?? "[]");
  } catch {
    return [];
  }
}

export function removerHistorico(index: number): void {
  const lista = carregarHistorico();
  lista.splice(index, 1);
  localStorage.setItem(KEY_HISTORICO, JSON.stringify(lista));
}

// ── Locais (salvos pelo usuário) ─────────────────────────────────────────────

export function carregarLocais(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEY_LOCAIS) ?? "[]");
  } catch {
    return [];
  }
}

export function salvarLocal(local: string): void {
  const lista = carregarLocais();
  if (!lista.includes(local)) {
    lista.push(local);
    localStorage.setItem(KEY_LOCAIS, JSON.stringify(lista));
  }
}

export function removerLocal(local: string): void {
  const lista = carregarLocais().filter((l) => l !== local);
  localStorage.setItem(KEY_LOCAIS, JSON.stringify(lista));
}

export function buscarEnderecoLocal(local: string): string | null {
  return ENDERECOS_LOCAIS[local] ?? null;
}

// ── Eventos (salvos pelo usuário) ────────────────────────────────────────────

export function carregarEventos(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEY_EVENTOS) ?? "[]");
  } catch {
    return [];
  }
}

export function salvarEvento(evento: string): void {
  const lista = carregarEventos();
  if (!lista.includes(evento)) {
    lista.push(evento);
    localStorage.setItem(KEY_EVENTOS, JSON.stringify(lista));
  }
}

export function removerEvento(evento: string): void {
  const lista = carregarEventos().filter((e) => e !== evento);
  localStorage.setItem(KEY_EVENTOS, JSON.stringify(lista));
}

// ── Frases de rodapé ─────────────────────────────────────────────────────────

export function carregarFrasesRodape(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEY_FRASES) ?? "[]");
  } catch {
    return [];
  }
}

export function salvarFraseRodape(frase: string): void {
  const lista = carregarFrasesRodape();
  if (!lista.includes(frase)) {
    lista.push(frase);
    localStorage.setItem(KEY_FRASES, JSON.stringify(lista));
  }
}

export function removerFraseRodape(frase: string): void {
  const lista = carregarFrasesRodape().filter((f) => f !== frase);
  localStorage.setItem(KEY_FRASES, JSON.stringify(lista));
}

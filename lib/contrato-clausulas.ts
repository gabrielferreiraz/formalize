export interface ClausulaContrato {
  id: string;
  ordem: number;
  titulo: string;
  corpo: string; // HTML with {{var}} placeholders
  tipo: "clausula" | "obs";
  opcional: boolean;
  ativa: boolean;
}

export type ContratoTipo = "banda" | "solo" | "dj" | "generico" | "custom";

export type ClausulaVars = Record<string, string>;

export function interpolarClausula(texto: string, vars: ClausulaVars): string {
  return texto.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
}

function c(
  id: string,
  ordem: number,
  titulo: string,
  corpo: string,
  tipo: "clausula" | "obs" = "clausula",
  opcional = false,
): ClausulaContrato {
  return { id, ordem, titulo, corpo, tipo, opcional, ativa: true };
}

// ── BANDA ─────────────────────────────────────────────────────────────────────

const CLAUSULAS_BANDA: ClausulaContrato[] = [
  c("b1", 1, "Cláusula Primeira — Do Objeto",
    `O presente instrumento tem por objeto a contratação de apresentação musical pela <strong>CONTRATADA {{artistaNome}}</strong>, para o <strong>CONTRATANTE {{contratanteNome}}</strong>, inscrito(a) no CPF/CNPJ sob o nº <strong>{{contratanteCpfCnpj}}</strong>{{rgTexto}}, nos termos e condições estabelecidos neste instrumento.`),

  c("b2", 2, "Cláusula Segunda — Do Serviço",
    `A CONTRATADA se compromete a realizar apresentação musical com banda completa composta por <strong>{{pessoasBanda}} integrantes</strong>, executando os seguintes instrumentos: <strong>{{artistaInstrumentos}}</strong>.<br><br>A apresentação ocorrerá no evento <strong>{{evento}}</strong>, no dia <strong>{{dataEventoBr}}</strong> às <strong>{{horario}}</strong>, com duração mínima de <strong>{{horasFormatado}}</strong>, no local <strong>{{local}}</strong>, em <strong>{{cidadeEvento}}</strong>.`),

  c("b3", 3, "Cláusula Terceira — Do Cachê",
    `O valor total pelos serviços ora contratados fica estipulado em <strong>{{valorTotalFormatado}}</strong> (<em>{{valorTotalExtenso}}</em>), a ser pago mediante <strong>{{formaPagamento}}</strong>.`),

  c("b4obs", 4, "OBS — Alimentação",
    `<strong>Alimentação:</strong> O CONTRATANTE se obriga a fornecer alimentação e bebida (não alcoólica) para <strong>{{pessoasBanda}} pessoas</strong> durante o evento, disponibilizando espaço adequado para repouso e alimentação da equipe nos períodos de montagem, apresentação e desmontagem.`,
    "obs"),

  c("b5", 5, "Cláusula Quarta — Do Deslocamento",
    `{{transporteTexto}}`),

  c("b6", 6, "Cláusula Quinta — Da Rescisão",
    `Em caso de cancelamento por parte do CONTRATANTE com antecedência inferior a <strong>15 (quinze) dias</strong> da data do evento, será devida multa equivalente a <strong>50% (cinquenta por cento)</strong> do valor total deste contrato, a título de perdas e danos. O cancelamento deverá ser formalizado por escrito.`),

  c("b7", 7, "Cláusula Sexta — Do Foro",
    `Fica eleito o Foro da Comarca de <strong>{{foro}}</strong> para dirimir quaisquer controvérsias oriundas do presente contrato, com renúncia expressa a qualquer outro, por mais privilegiado que seja.`),
];

// ── SOLO ──────────────────────────────────────────────────────────────────────

const CLAUSULAS_SOLO: ClausulaContrato[] = [
  c("s1", 1, "Cláusula Primeira — Do Objeto",
    `O presente instrumento tem por objeto a contratação de apresentação musical solo pela <strong>CONTRATADA {{artistaNome}}</strong>, para o <strong>CONTRATANTE {{contratanteNome}}</strong>, inscrito(a) no CPF/CNPJ sob o nº <strong>{{contratanteCpfCnpj}}</strong>{{rgTexto}}, nos termos e condições estabelecidos neste instrumento.`),

  c("s2", 2, "Cláusula Segunda — Do Serviço",
    `A CONTRATADA se compromete a realizar apresentação musical solo no evento <strong>{{evento}}</strong>, no dia <strong>{{dataEventoBr}}</strong> às <strong>{{horario}}</strong>, com duração mínima de <strong>{{horasFormatado}}</strong>, no local <strong>{{local}}</strong>, em <strong>{{cidadeEvento}}</strong>.`),

  c("s3", 3, "Cláusula Terceira — Do Cachê",
    `O valor total pelos serviços ora contratados fica estipulado em <strong>{{valorTotalFormatado}}</strong> (<em>{{valorTotalExtenso}}</em>), a ser pago mediante <strong>{{formaPagamento}}</strong>.`),

  c("s4", 4, "Cláusula Quarta — Do Deslocamento",
    `{{transporteTexto}}`),

  c("s5", 5, "Cláusula Quinta — Da Rescisão",
    `Em caso de cancelamento por parte do CONTRATANTE com antecedência inferior a <strong>15 (quinze) dias</strong> da data do evento, será devida multa equivalente a <strong>50% (cinquenta por cento)</strong> do valor total deste contrato. O cancelamento deverá ser formalizado por escrito.`),

  c("s6", 6, "Cláusula Sexta — Do Foro",
    `Fica eleito o Foro da Comarca de <strong>{{foro}}</strong> para dirimir quaisquer controvérsias oriundas do presente contrato, com renúncia expressa a qualquer outro, por mais privilegiado que seja.`),
];

// ── DJ ────────────────────────────────────────────────────────────────────────

const CLAUSULAS_DJ: ClausulaContrato[] = [
  c("d1", 1, "Cláusula Primeira — Do Objeto",
    `O presente instrumento tem por objeto a contratação de serviços de DJ pelo <strong>CONTRATANTE {{contratanteNome}}</strong>, inscrito(a) no CPF/CNPJ sob o nº <strong>{{contratanteCpfCnpj}}</strong>{{rgTexto}}, junto à <strong>CONTRATADA {{artistaNome}}</strong>, nos termos e condições estabelecidos neste instrumento.`),

  c("d2", 2, "Cláusula Segunda — Do Serviço",
    `A CONTRATADA se compromete a realizar apresentação de DJ set no evento <strong>{{evento}}</strong>, no dia <strong>{{dataEventoBr}}</strong> às <strong>{{horario}}</strong>, com duração mínima de <strong>{{horasFormatado}}</strong>, no local <strong>{{local}}</strong>, em <strong>{{cidadeEvento}}</strong>.`),

  c("d3", 3, "Cláusula Terceira — Do Cachê",
    `O valor total pelos serviços ora contratados fica estipulado em <strong>{{valorTotalFormatado}}</strong> (<em>{{valorTotalExtenso}}</em>), a ser pago mediante <strong>{{formaPagamento}}</strong>.`),

  c("d4", 4, "Cláusula Quarta — Dos Equipamentos",
    `Os equipamentos de som e iluminação necessários à apresentação serão de responsabilidade do CONTRATANTE, que deverá garantir estrutura técnica adequada. Eventuais equipamentos adicionais trazidos pela CONTRATADA são de sua exclusiva responsabilidade.`),

  c("d5", 5, "Cláusula Quinta — Do Deslocamento",
    `{{transporteTexto}}`),

  c("d6", 6, "Cláusula Sexta — Da Rescisão",
    `Em caso de cancelamento por parte do CONTRATANTE com antecedência inferior a <strong>15 (quinze) dias</strong> da data do evento, será devida multa equivalente a <strong>50% (cinquenta por cento)</strong> do valor total deste contrato. O cancelamento deverá ser formalizado por escrito.`),

  c("d7", 7, "Cláusula Sétima — Do Foro",
    `Fica eleito o Foro da Comarca de <strong>{{foro}}</strong> para dirimir quaisquer controvérsias oriundas do presente contrato, com renúncia expressa a qualquer outro, por mais privilegiado que seja.`),
];

// ── GENÉRICO ──────────────────────────────────────────────────────────────────

const CLAUSULAS_GENERICO: ClausulaContrato[] = [
  c("g1", 1, "Cláusula Primeira — Do Objeto",
    `O presente instrumento tem por objeto a contratação de prestação de serviços artísticos pela <strong>CONTRATADA {{artistaNome}}</strong>, para o <strong>CONTRATANTE {{contratanteNome}}</strong>, inscrito(a) no CPF/CNPJ sob o nº <strong>{{contratanteCpfCnpj}}</strong>{{rgTexto}}, nos termos e condições estabelecidos neste instrumento.`),

  c("g2", 2, "Cláusula Segunda — Do Serviço",
    `A CONTRATADA se compromete a realizar serviço artístico no evento <strong>{{evento}}</strong>, no dia <strong>{{dataEventoBr}}</strong> às <strong>{{horario}}</strong>, com duração de <strong>{{horasFormatado}}</strong>, no local <strong>{{local}}</strong>, em <strong>{{cidadeEvento}}</strong>.`),

  c("g3", 3, "Cláusula Terceira — Do Cachê",
    `O valor total pelos serviços ora contratados fica estipulado em <strong>{{valorTotalFormatado}}</strong> (<em>{{valorTotalExtenso}}</em>), a ser pago mediante <strong>{{formaPagamento}}</strong>.`),

  c("g4", 4, "Cláusula Quarta — Da Rescisão",
    `Em caso de cancelamento por parte do CONTRATANTE com antecedência inferior a <strong>15 (quinze) dias</strong> da data do evento, será devida multa equivalente a <strong>50% (cinquenta por cento)</strong> do valor total deste contrato. O cancelamento deverá ser formalizado por escrito.`),

  c("g5", 5, "Cláusula Quinta — Do Foro",
    `Fica eleito o Foro da Comarca de <strong>{{foro}}</strong> para dirimir quaisquer controvérsias oriundas do presente contrato, com renúncia expressa a qualquer outro, por mais privilegiado que seja.`),
];

// ── Exports ───────────────────────────────────────────────────────────────────

export const PRESET_LABELS: Record<string, string> = {
  banda: "Banda",
  solo: "Solo",
  dj: "DJ",
  generico: "Genérico",
};

export function getPresetClausulas(tipo: ContratoTipo): ClausulaContrato[] {
  let source: ClausulaContrato[];
  switch (tipo) {
    case "banda":    source = CLAUSULAS_BANDA; break;
    case "solo":     source = CLAUSULAS_SOLO;  break;
    case "dj":       source = CLAUSULAS_DJ;    break;
    case "generico": source = CLAUSULAS_GENERICO; break;
    default:         source = CLAUSULAS_GENERICO;
  }
  return source.map((cl) => ({ ...cl }));
}

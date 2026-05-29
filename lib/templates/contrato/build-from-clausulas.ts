import crypto from "crypto";
import { escapeHtml, formatData, valorPorExtenso } from "@/lib/templates/utils";
import type { ArtistTemplateData, AssetResult } from "@/lib/templates/types";
import { interpolarClausula, type ClausulaContrato, type ClausulaVars } from "@/lib/contrato-clausulas";

type ArtistData = ArtistTemplateData & Record<string, any>;

export function buildVars(artist: ArtistData, data: Record<string, any>): ClausulaVars {
  const addr = (artist.address as any) || {};
  const valorCache = (parseFloat(data.cache) || 0) / 100;
  const backlineNumerico = data.backline === "valor" ? (parseFloat(data.backlineValor) || 0) / 100 : 0;
  const transporteNumerico = data.transporte === "valor" ? (parseFloat(data.transporteValor) || 0) / 100 : 0;
  const valorTotal = valorCache + backlineNumerico + transporteNumerico;
  const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });
  const dataEventoBr = formatData(data.data);
  const dataAssinaturaBr = data.dataAssinatura ? formatData(data.dataAssinatura) : dataEventoBr;
  const foro = addr.cidade ? `${addr.cidade}-${addr.estado}` : "Campo Grande-MS";
  const cidadeEstadoContratante = data.cidade && data.uf ? `${data.cidade}/${data.uf}` : "";
  const horasNum = data.horas || 2;
  const horasFormatado = horasNum % 1 !== 0 ? `${Math.floor(horasNum)}h30` : `${horasNum}h`;
  const rgTexto = data.contratanteRg
    ? `, RG nº ${escapeHtml(data.contratanteRg)}${data.contratanteOrgao ? " " + escapeHtml(data.contratanteOrgao) : ""}`
    : "";
  const transporteTexto =
    data.transporte === "incluso" || !data.transporte
      ? "O deslocamento do artista e equipe já está incluso no valor do cachê, conforme combinado."
      : `O deslocamento do artista e equipe será cobrado à parte no valor de <strong>${fmt(transporteNumerico)}</strong>, conforme combinado.`;

  return {
    artistaNome:             escapeHtml(artist.name || ""),
    artistaLegalNome:        escapeHtml(artist.legalName || artist.name || ""),
    artistaCnpj:             escapeHtml(artist.cnpj || ""),
    artistaInstrumentos:     escapeHtml(artist.instruments || ""),
    artistaEndereco:         addr.rua
      ? escapeHtml(`${addr.rua} Nº ${addr.numero || ""}, ${addr.bairro || ""}, ${addr.cidade || ""}/${addr.estado || ""}`)
      : "",
    pixKey:                  escapeHtml(artist.pixKey || ""),
    contratanteNome:         escapeHtml(data.contratanteNome || ""),
    contratanteCpfCnpj:      escapeHtml(data.contratanteCpfCnpj || ""),
    contratanteRg:           escapeHtml(data.contratanteRg || ""),
    contratanteOrgao:        escapeHtml(data.contratanteOrgao || ""),
    cidadeEstadoContratante: escapeHtml(cidadeEstadoContratante),
    rgTexto,
    evento:                  escapeHtml(data.evento || ""),
    local:                   escapeHtml(data.local || ""),
    cidadeEvento:            escapeHtml(data.cidadeEvento || foro),
    dataEventoBr,
    dataAssinaturaBr,
    horario:                 escapeHtml(data.horario || ""),
    horasFormatado,
    valorCacheFormatado:     fmt(valorCache),
    valorTotalFormatado:     fmt(valorTotal),
    valorTotalExtenso:       valorPorExtenso(valorTotal),
    formaPagamento:          escapeHtml(data.formaPagamento || ""),
    pessoasBanda:            String(data.pessoasBanda || 7),
    transporteTexto,
    foro:                    escapeHtml(foro),
  };
}

export async function buildFromClausulas(
  artist: ArtistData,
  data: Record<string, any>,
  clausulas: ClausulaContrato[],
  _pageSize?: { width: string; height: string },
  logo?: AssetResult | null,
  titulo?: string,
): Promise<string> {
  const vars = buildVars(artist, data);
  const primaryColor = artist.primaryColor || "#E8A045";
  const fontScale = (artist.contratoFontScale || 100) / 71;
  const logoMime = logo?.mime || "image/png";
  const logoBase64 = logo?.base64 || "";
  const addr = (artist.address as any) || {};
  const bank = (artist.bankInfo as any) || {};
  const docTitulo = escapeHtml(titulo || "Contrato de Prestação de Serviços");

  const nomeSlug = (data.contratanteNome || "")
    .normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().trim();
  const hashContrato = crypto
    .createHash("sha256")
    .update(nomeSlug + vars.dataEventoBr + vars.valorTotalFormatado + Date.now().toString())
    .digest("hex").substring(0, 16).toUpperCase();
  const dataAssinatura = new Date().toLocaleString("pt-BR", { timeZone: "America/Campo_Grande" });

  const activeClauses = clausulas.filter((c) => c.ativa).sort((a, b) => a.ordem - b.ordem);

  const clausulaHtml = activeClauses.map((cl) => {
    const corpo = interpolarClausula(cl.corpo, vars);
    if (cl.tipo === "obs") {
      return `<div class="obs">${corpo}</div>`;
    }
    return `
      <div class="clausula">
        <div class="clausula-titulo">${escapeHtml(cl.titulo)}</div>
        <div class="clausula-texto">${corpo}</div>
      </div>`;
  }).join("\n");

  // Plain-text fields from the form: escape HTML, then convert newlines to <br>
  const renderPlainBlock = (text: string, label: string) =>
    `<div class="clausula">
      <div class="clausula-titulo">${label}</div>
      <div class="clausula-texto">${escapeHtml(text).replace(/\n/g, "<br>")}</div>
     </div>`;

  const clausulasEspeciais = data.clausulasEspeciais
    ? renderPlainBlock(String(data.clausulasEspeciais), "Cláusulas Especiais")
    : "";

  const riderTecnico = data.riderTecnico
    ? renderPlainBlock(String(data.riderTecnico), "Rider Técnico")
    : "";

  const bankingHtml =
    artist.pixKey || bank.banco
      ? `<div class="secao-bancaria">
          <div class="banco-titulo">Dados para Pagamento</div>
          ${artist.pixKey ? `<div class="banco-linha"><strong>PIX:</strong> ${escapeHtml(artist.pixKey)}</div>` : ""}
          ${bank.banco ? `<div class="banco-linha"><strong>Banco:</strong> ${escapeHtml(String(bank.banco))}</div>` : ""}
          ${bank.agencia ? `<div class="banco-linha"><strong>Agência:</strong> ${escapeHtml(String(bank.agencia))}</div>` : ""}
          ${bank.conta ? `<div class="banco-linha"><strong>Conta:</strong> ${escapeHtml(String(bank.conta))}</div>` : ""}
          ${bank.titular ? `<div class="banco-linha"><strong>Titular:</strong> ${escapeHtml(String(bank.titular))}</div>` : ""}
        </div>`
      : "";

  const assinaturaDigital = data.assinarDigitalmente
    ? `<div style="margin:0 auto 6px;padding:6px 8px;background:#f9f9f9;border-radius:5px;border:1.5px solid ${primaryColor};max-width:180px;text-align:center;">
        <div style="font-family:'Montserrat',sans-serif;font-weight:800;font-size:${7.5 * fontScale}px;color:${primaryColor};letter-spacing:1.5px;text-transform:uppercase;margin-bottom:4px;border-bottom:1px solid ${primaryColor}33;padding-bottom:3px;">Certificado de Assinatura</div>
        <div style="font-size:${8.5 * fontScale}px;color:#555;line-height:1.55;">${escapeHtml(dataAssinatura)}</div>
        <div style="font-family:'Courier New',monospace;font-size:${7 * fontScale}px;color:#aaa;margin-top:4px;letter-spacing:1px;">${hashContrato}</div>
       </div>`
    : "";

  const enderecoArtista = addr.rua
    ? escapeHtml(`${addr.rua} Nº ${addr.numero || ""}, Bairro ${addr.bairro || ""}, ${addr.cidade || ""}/${addr.estado || ""}`)
    : "";

  const fraseRodape = data.fraseRodape
    ? `<div style="text-align:center;margin-top:16px;font-style:italic;font-size:${14 * fontScale}px;color:#888;">"${escapeHtml(String(data.fraseRodape))}"</div>`
    : "";

  const artistaNomeHeader = escapeHtml(artist.name || "");
  const contratadaNome = escapeHtml(artist.legalName || artist.name || "CONTRATADA");
  const contratanteNomeAssinatura = escapeHtml(data.contratanteNome || "CONTRATANTE");
  const contratanteCpfAssinatura = data.contratanteCpfCnpj
    ? `<div class="cargo-assinatura">${escapeHtml(data.contratanteCpfCnpj)}</div>`
    : "";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;900&family=Open+Sans:wght@400;600&display=swap" rel="stylesheet">
  <style>
    @page { margin: 1mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; background: #ffffff; font-family: 'Open Sans', sans-serif; }
    .pagina { width: 100%; min-height: 100vh; position: relative; display: flex; flex-direction: column; background: #ffffff; }
    .marca-dagua { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 70%; opacity: 0.04; z-index: 0; pointer-events: none; }
    .header { background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%); padding: 32px 50px 26px; text-align: center; flex-shrink: 0; position: relative; z-index: 1; }
    .header img { height: 100px; display: block; margin: 0 auto 12px; }
    .header-subtitulo { font-family: 'Montserrat', sans-serif; font-weight: 400; font-size: ${16 * fontScale}px; color: #888888; letter-spacing: 5px; text-transform: uppercase; margin-bottom: 14px; }
    .header-linha { width: 60%; height: 2px; background: linear-gradient(to right, transparent, ${primaryColor}, transparent); margin: 0 auto; }
    .corpo { position: relative; z-index: 1; padding: 32px 55px 55px; flex: 1; }
    .titulo { font-family: 'Montserrat', sans-serif; font-weight: 900; font-size: ${34 * fontScale}px; color: #111111; text-align: center; letter-spacing: 5px; text-transform: uppercase; margin-bottom: 26px; padding-bottom: 16px; position: relative; }
    .titulo::after { content: ''; position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); width: 140px; height: 3px; background: linear-gradient(to right, transparent, ${primaryColor}, transparent); }
    .clausula { margin-bottom: 18px; break-inside: avoid; }
    .clausula-titulo { font-family: 'Montserrat', sans-serif; font-weight: 700; font-size: ${19 * fontScale}px; color: ${primaryColor}; margin-bottom: 6px; display: flex; align-items: center; gap: 8px; }
    .clausula-titulo::before { content: ''; width: 6px; height: 6px; background: ${primaryColor}; border-radius: 50%; flex-shrink: 0; }
    .clausula-texto { font-size: ${19 * fontScale}px; color: #333333; line-height: 1.8; text-align: justify; padding-left: 14px; }
    .clausula-texto strong { font-family: 'Montserrat', sans-serif; font-weight: 700; color: #111111; }
    .obs { font-size: ${19 * fontScale}px; color: #333333; line-height: 1.8; margin-bottom: 12px; text-align: justify; padding: 10px 14px; background: #fafafa; border-left: 3px solid ${primaryColor}; border-radius: 3px; break-inside: avoid; }
    .obs strong { font-family: 'Montserrat', sans-serif; font-weight: 700; color: ${primaryColor}; }
    .secao-bancaria { background: #f5f5f5; border-left: 5px solid ${primaryColor}; border-radius: 6px; padding: 18px 24px; margin: 18px 0; break-inside: avoid; }
    .banco-titulo { font-family: 'Montserrat', sans-serif; font-weight: 900; font-size: ${19 * fontScale}px; color: #111111; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 2px; }
    .banco-linha { font-size: ${19 * fontScale}px; color: #333333; line-height: 1.9; }
    .banco-linha strong { font-family: 'Montserrat', sans-serif; font-weight: 700; color: #111111; }
    .assinaturas { margin-top: 36px; padding-top: 24px; border-top: 1px solid #eeeeee; break-inside: avoid; }
    .local-data { font-size: ${17 * fontScale}px; color: #444444; margin-bottom: 34px; text-align: center; font-style: italic; }
    .grid-assinaturas { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
    .bloco-assinatura { text-align: center; }
    .linha-assinatura { border-top: 1.5px solid #333333; padding-top: 8px; }
    .nome-assinatura { font-family: 'Montserrat', sans-serif; font-weight: 700; font-size: ${16 * fontScale}px; color: #111111; }
    .cargo-assinatura { font-size: ${14 * fontScale}px; color: #666666; margin-top: 2px; }
    .rodape { padding: 0 55px 30px; }
    .rodape-linha { width: 60%; height: 1px; background: linear-gradient(to right, transparent, #ccc, transparent); margin: 0 auto 12px; }
    .rodape-texto { font-size: ${12 * fontScale}px; color: #aaaaaa; text-align: center; }
  </style>
</head>
<body>
<div class="pagina">
  ${logoBase64 ? `<img class="marca-dagua" src="data:${logoMime};base64,${logoBase64}" alt="" />` : ""}

  <div class="header">
    ${logoBase64 ? `<img src="data:${logoMime};base64,${logoBase64}" alt="${artistaNomeHeader}" />` : ""}
    <div class="header-subtitulo">${artistaNomeHeader}</div>
    <div class="header-linha"></div>
  </div>

  <div class="corpo">
    <div class="titulo">${docTitulo}</div>

    ${clausulaHtml}
    ${clausulasEspeciais}
    ${riderTecnico}
    ${bankingHtml}

    <div class="assinaturas">
      <div class="local-data">
        ${vars.cidadeEvento}, ${vars.dataAssinaturaBr}
      </div>
      <div class="grid-assinaturas">
        <div class="bloco-assinatura">
          <div class="linha-assinatura">
            <div class="nome-assinatura">${contratanteNomeAssinatura}</div>
            <div class="cargo-assinatura">Contratante</div>
            ${contratanteCpfAssinatura}
          </div>
        </div>
        <div class="bloco-assinatura">
          <div class="linha-assinatura">
            <div class="nome-assinatura">${contratadaNome}</div>
            <div class="cargo-assinatura">Contratada</div>
            ${enderecoArtista ? `<div class="cargo-assinatura">${enderecoArtista}</div>` : ""}
          </div>
        </div>
      </div>
      ${assinaturaDigital}
    </div>
  </div>

  <div class="rodape">
    <div class="rodape-linha"></div>
    ${fraseRodape}
    <div class="rodape-texto">Foro: Comarca de ${vars.foro}</div>
  </div>
</div>
</body>
</html>`;
}

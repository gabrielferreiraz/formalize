import crypto from "crypto";
import { escapeHtml, formatData, valorPorExtenso } from "@/lib/templates/utils";
import type { ArtistTemplateData, AssetResult } from "@/lib/templates/types";
import { getTextosCategoria } from "@/lib/templates/contrato/artist-texts";

type ArtistData = ArtistTemplateData & Record<string, any>;

export async function buildCtr001(
  artist: ArtistData,
  data: Record<string, any>,
  _pageSize?: { width: string; height: string },
  logo?: AssetResult | null,
): Promise<string> {
  const d = data;
  const primaryColor = artist.primaryColor || "#E8A045";
  const addr = (artist.address as any) || {};
  const bank = (artist.bankInfo as any) || {};
  const logoMime = logo?.mime || "image/png";
  const logoBase64 = logo?.base64 || "";
  const logoScale = Number(artist.contratoLogoScale) || 100;
  const logoH = Math.round(100 * logoScale / 100);

  const valorCache = (parseFloat(d.cache) || 0) / 100;
  const valorCacheFormatado = valorCache.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });

  const backlineRaw = d.backline;
  const backlineNumerico = backlineRaw === "valor" ? (parseFloat(d.backlineValor) || 0) / 100 : 0;
  const backlineFormatado = backlineNumerico > 0
    ? backlineNumerico.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 })
    : null;

  const transporteRaw = d.transporte;
  const transporteNumerico = transporteRaw === "valor" ? (parseFloat(d.transporteValor) || 0) / 100 : 0;
  const transporteFormatado = transporteNumerico > 0
    ? transporteNumerico.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 })
    : null;

  const valorTotal = valorCache + backlineNumerico + transporteNumerico;
  const valorTotalFormatado = valorTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });
  const valorTotalExtenso = valorPorExtenso(valorTotal);

  const transporteTexto = (transporteRaw === "incluso" || !transporteRaw)
    ? "O deslocamento do artista e equipe já está incluso no valor do cachê, conforme combinado."
    : `O deslocamento do artista e equipe será cobrado à parte no valor de <strong>${transporteFormatado}</strong>, conforme combinado.`;

  const nomeSlug = (d.contratanteNome || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
  const dataEventoBr = formatData(d.data);
  const hashContrato = crypto.createHash("sha256")
    .update(nomeSlug + dataEventoBr + valorTotalFormatado + Date.now().toString())
    .digest("hex").substring(0, 16).toUpperCase();
  const dataAssinaturaBr = d.dataAssinatura ? formatData(d.dataAssinatura) : dataEventoBr;
  const dataAssinatura = new Date().toLocaleString("pt-BR", { timeZone: "America/Campo_Grande" });

  const enderecoArtista = addr.rua
    ? `${addr.rua} Nº ${addr.numero || ""}, Bairro ${addr.bairro || ""}, ${addr.cidade || ""}/${addr.estado || ""}`
    : "—";
  const foro = addr.cidade ? `${addr.cidade}-${addr.estado}` : "Campo Grande-MS";
  const cidadeEstadoContratante = d.cidade && d.uf ? `${d.cidade}/${d.uf}` : "";
  const cidadeEstadoEvento = d.cidadeEvento || foro;
  const instruments = artist.instruments || "Bateria, Percussão, Guitarra, Baixo, Sanfona";
  const textos = getTextosCategoria(artist.categoria);
  const pessoasBanda = d.pessoasBanda || textos.pessoasDefault;
  const rgTexto = d.contratanteRg
    ? `${d.contratanteRg}${d.contratanteOrgao ? " " + d.contratanteOrgao : ""}`
    : "não informado";
  const horasNum = d.horas || 2;
  const horasFormatado = (horasNum % 1 !== 0) ? `${Math.floor(horasNum)}:30` : `${horasNum}:00`;
  const fontScale = (artist.contratoFontScale || 100) / 52;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    @page { margin: 25mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; background: #ffffff; font-family: 'Inter', sans-serif; }
    .pagina { width: 100%; min-height: 100vh; position: relative; display: flex; flex-direction: column; background: #ffffff; }
    .topo-regua { height: 4px; background: ${primaryColor}; width: 100%; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .marca-dagua { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 65%; opacity: 0.035; z-index: 0; pointer-events: none; }
    .header { background: #ffffff; padding: 20px 20px 18px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #eeeeee; position: relative; z-index: 1; }
    .header-left { display: flex; align-items: center; gap: 16px; }
    .header-logo { height: ${logoH}px; max-width: 260px; object-fit: contain; display: block; }
    .header-vdivider { width: 1px; height: 38px; background: #e0e0e0; }
    .header-artist { font-family: 'Inter', sans-serif; font-weight: 700; font-size: ${Math.round(15 * fontScale)}px; color: #111; letter-spacing: -0.2px; }
    .header-sub { font-size: ${Math.round(9 * fontScale)}px; color: #aaa; letter-spacing: 3px; text-transform: uppercase; margin-top: 3px; font-weight: 500; }
    .header-right { text-align: right; }
    .header-doc-label { font-size: ${Math.round(9 * fontScale)}px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: #ccc; margin-bottom: 3px; }
    .header-date { font-size: ${Math.round(11 * fontScale)}px; font-weight: 600; color: #555; }
    .corpo { position: relative; z-index: 1; padding: 24px 20px 30px; flex: 1; }
    .titulo-area { text-align: center; margin-bottom: 22px; padding-bottom: 18px; border-bottom: 1px solid #eeeeee; }
    .titulo { font-family: 'Playfair Display', Georgia, serif; font-weight: 700; font-size: ${Math.round(24 * fontScale)}px; color: #111111; letter-spacing: -0.3px; line-height: 1.2; margin-bottom: 10px; }
    .titulo-regua { width: 60px; height: 2px; background: ${primaryColor}; margin: 0 auto 8px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .titulo-cat { font-size: ${Math.round(9 * fontScale)}px; color: #aaa; letter-spacing: 4px; text-transform: uppercase; font-weight: 500; }
    .intro { font-size: ${Math.round(15 * fontScale)}px; color: #333333; line-height: 1.85; margin-bottom: 14px; text-align: justify; }
    .intro strong { font-weight: 700; color: #111111; }
    .clausula { margin-bottom: 12px; break-inside: avoid; }
    .clausula-titulo { font-family: 'Inter', sans-serif; font-weight: 700; font-size: ${Math.round(11 * fontScale)}px; color: #111; margin-bottom: 5px; display: flex; align-items: center; gap: 10px; text-transform: uppercase; letter-spacing: 1.5px; }
    .clausula-titulo::before { content: ''; width: 18px; height: 2px; background: ${primaryColor}; flex-shrink: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .clausula-texto { font-size: ${Math.round(15 * fontScale)}px; color: #444444; line-height: 1.85; text-align: justify; padding-left: 28px; }
    .clausula-texto strong { font-weight: 700; color: #111111; }
    .paragrafo { font-size: ${Math.round(14 * fontScale)}px; color: #555555; line-height: 1.8; margin-top: 5px; padding-left: 42px; text-align: justify; }
    .obs { font-size: ${Math.round(14 * fontScale)}px; color: #444; line-height: 1.8; margin-bottom: 10px; text-align: justify; padding: 10px 16px; background: #f8f8f8; border-left: 3px solid ${primaryColor}; break-inside: avoid; border-radius: 0 4px 4px 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .obs strong { font-weight: 700; color: ${primaryColor}; }
    .secao-bancaria { background: #f7f7f7; border-radius: 8px; border: 1px solid #eeeeee; padding: 16px 20px; margin: 16px 0; break-inside: avoid; }
    .banco-titulo { font-family: 'Inter', sans-serif; font-weight: 700; font-size: ${Math.round(10 * fontScale)}px; color: #999; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 10px; }
    .banco-linha { font-size: ${Math.round(14 * fontScale)}px; color: #444; line-height: 2; }
    .banco-linha strong { font-weight: 700; color: #111; }
    .assinaturas { margin-top: 26px; padding-top: 16px; border-top: 1px solid #eeeeee; break-inside: avoid; }
    .local-data { font-size: ${Math.round(12 * fontScale)}px; color: #888; margin-bottom: 22px; text-align: center; font-style: italic; }
    .linha-assinatura { display: flex; justify-content: space-between; gap: 60px; margin-bottom: 18px; break-inside: avoid; align-items: flex-end; }
    .assinatura-bloco { flex: 1; text-align: center; }
    .assinatura-linha { border-top: 1px solid #333333; margin-bottom: 8px; }
    .assinatura-label { font-size: ${Math.round(9 * fontScale)}px; color: #999; margin-top: 4px; text-transform: uppercase; letter-spacing: 2px; font-weight: 600; }
    .testemunhas-titulo { font-family: 'Inter', sans-serif; font-weight: 700; font-size: ${Math.round(10 * fontScale)}px; color: #999; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 2px; }
    .testemunhas-linha { display: flex; align-items: center; gap: 12px; margin-top: 8px; break-inside: avoid; }
    .test-num { font-weight: 700; font-size: ${Math.round(12 * fontScale)}px; color: #333; white-space: nowrap; }
    .test-linha { flex: 1; border-top: 1px solid #333; }
    .rodape { padding: 14px 20px; text-align: center; position: relative; z-index: 1; border-top: 1px solid #eeeeee; }
    .rodape-frase { font-family: 'Playfair Display', serif; font-weight: 400; font-style: italic; font-size: ${Math.round(13 * fontScale)}px; color: ${primaryColor}; letter-spacing: 0.5px; }
    .ass-dig-bloco { margin: 0 auto 5px; padding: 6px 8px; border: 1px solid ${primaryColor}44; border-radius: 4px; background: #fafafa; text-align: center; max-width: 180px; }
    .ass-dig-titulo { font-family: 'Inter', sans-serif; font-weight: 700; font-size: ${Math.round(7 * fontScale)}px; color: ${primaryColor}; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 4px; border-bottom: 1px solid ${primaryColor}22; padding-bottom: 3px; }
    .ass-dig-info { font-size: ${Math.round(8 * fontScale)}px; color: #555; line-height: 1.55; }
    .ass-dig-codigo { font-family: 'Courier New', monospace; font-size: ${Math.round(6.5 * fontScale)}px; color: #bbb; margin-top: 4px; letter-spacing: 1px; }
  </style>
</head>
<body>
  <div class="pagina">
    ${logo ? `<img class="marca-dagua" src="data:${logoMime};base64,${logoBase64}" />` : ""}
    <div class="topo-regua"></div>
    <div class="header">
      <div class="header-left">
        ${logo ? `<img class="header-logo" src="data:${logoMime};base64,${logoBase64}" />` : ""}
        ${logo ? `<div class="header-vdivider"></div>` : ""}
        <div>
          <div class="header-artist">${escapeHtml(artist.name)}</div>
          <div class="header-sub">Entretenimento Musical</div>
        </div>
      </div>
      <div class="header-right">
        <div class="header-doc-label">Documento</div>
        <div class="header-date">${escapeHtml(dataAssinaturaBr)}</div>
      </div>
    </div>
    <div class="corpo">
      <div class="titulo-area">
        <div class="titulo">Contrato de Prestação de Serviços Artísticos</div>
        <div class="titulo-regua"></div>
        <div class="titulo-cat">Entretenimento Musical</div>
      </div>
      <div class="intro">
        Pelo presente instrumento e na melhor forma de direito, de um lado doravante denominado
        simplesmente <strong>CONTRATANTE</strong>, <strong>${escapeHtml(d.contratanteNome || "")}</strong>,
        inscrita no CPF/CNPJ: <strong>${escapeHtml(d.contratanteCpfCnpj || "")}</strong>
        e RG: <strong>${escapeHtml(rgTexto)}</strong>,
        residente e domiciliado na Rua: <strong>${escapeHtml(d.logradouro || "")}</strong>,
        <strong>Nº ${escapeHtml(d.numero || "")}</strong>, <strong>${escapeHtml(d.bairro || "")}</strong>,
        CEP: <strong>${escapeHtml(d.cep || "")}</strong>, <strong>${escapeHtml(cidadeEstadoContratante)}</strong>${d.contratanteTelefone ? `, Tel: <strong>${escapeHtml(d.contratanteTelefone)}</strong>` : ""}
      </div>
      <div class="intro">
        De outro lado o <strong>"${escapeHtml(artist.name)}"</strong>, denominado <strong>CONTRATADO</strong>,
        <em>empresa brasileira com CNPJ: ${escapeHtml(artist.cnpj || "")},
        escritório localizado na ${escapeHtml(enderecoArtista)},</em>
        têm entre si, junto e contratado o seguinte:
      </div>
      <div class="clausula">
        <div class="clausula-titulo">Cláusula Primeira:</div>
        <div class="clausula-texto">O CONTRATADO se obriga a prestar seu serviço de ${textos.tipoServico} musical na seguinte data: <strong>${escapeHtml(dataEventoBr)}.</strong></div>
      </div>
      <div class="clausula">
        <div class="clausula-titulo">Cláusula Segunda:</div>
        <div class="clausula-texto">O CONTRATADO desempenhará sua função, na duração de <strong>${escapeHtml(horasFormatado)} hs de ${textos.tipoServico}</strong>${d.horario ? `, às <strong>${escapeHtml(d.horario)}h</strong>` : ""}, no Local: <strong>${escapeHtml(d.local || "")}</strong>, <strong>${escapeHtml(cidadeEstadoEvento)}</strong></div>
      </div>
      <div class="clausula">
        <div class="clausula-titulo">Cláusula Terceira:</div>
        <div class="clausula-texto">No valor do contrato estipula-se a importância de <strong>${escapeHtml(valorTotalFormatado)} (${escapeHtml(valorTotalExtenso)})</strong> para a apresentação de <strong>${escapeHtml(String(horasNum))}</strong> horas com local citado acima${backlineNumerico > 0 ? `, sendo <strong>${escapeHtml(valorCacheFormatado)}</strong> de cachê e <strong>${escapeHtml(backlineFormatado!)}</strong> de backline` : ""}.</div>
      </div>
      <div class="clausula">
        <div class="clausula-titulo">Cláusula Quarta:</div>
        <div class="clausula-texto">${textos.formatoTexto(escapeHtml(instruments))}</div>
      </div>
      <div class="clausula">
        <div class="clausula-titulo">Cláusula Quinta:</div>
        <div class="clausula-texto">${transporteTexto}</div>
      </div>
      ${backlineNumerico > 0 ? `
      <div class="clausula">
        <div class="clausula-titulo">Backline:</div>
        <div class="clausula-texto">Backline no valor de <strong>${escapeHtml(backlineFormatado!)}</strong> ficará por conta do CONTRATANTE.</div>
      </div>` : ""}
      <div class="obs"><strong>OBS.</strong> Água mineral durante a apresentação e alimentação para <strong>${pessoasBanda}</strong> pessoas fica por conta do CONTRATANTE.</div>
      <div class="obs"><strong>OBS.</strong> ${textos.obsBacklineOuSom}</div>
      <div class="clausula">
        <div class="clausula-titulo">Cláusula Sexta:</div>
        <div class="clausula-texto">${textos.repertorioTexto}</div>
      </div>
      <div class="clausula">
        <div class="clausula-titulo">Cláusula Sétima:</div>
        <div class="clausula-texto">Em caso de rescisão desta Nota Contratual, a parte infratora indenizará a parte prejudicada da seguinte forma;</div>
        <div class="paragrafo">§ 1º - Multa de 10% (dez por cento) do valor contratado, quando a rescisão se der por escrito, até 15 (quinze) dias antes da data do referido serviço a ser prestado;</div>
        <div class="paragrafo">§ 2º - Multa de 50% (cinquenta por cento) do valor contratado, quando a rescisão se der por escrito, no dia do evento.</div>
      </div>
      <div class="clausula">
        <div class="clausula-titulo">Cláusula Oitava:</div>
        <div class="clausula-texto">${d.formaPagamento
          ? `O Contratante efetuará o pagamento da seguinte forma: <strong>${escapeHtml(d.formaPagamento)}</strong>, em moeda corrente vigente neste país.`
          : "O Contratante efetuará o pagamento de 30% do valor de entrada na assinatura do contrato e o restante será pago até a semana que antecede o evento, em moeda corrente vigente neste país."
        }</div>
      </div>
      <div class="secao-bancaria">
        <div class="banco-titulo">Dados Bancários</div>
        <div class="banco-linha"><strong>Titular:</strong> ${escapeHtml(bank.titular || artist.legalName || artist.name || "")}</div>
        <div class="banco-linha"><strong>Pix:</strong> ${escapeHtml(bank.pix || artist.pixKey || "")}</div>
        <div class="banco-linha"><strong>Banco:</strong> ${escapeHtml(bank.banco || "")}</div>
        <div class="banco-linha"><strong>Conta:</strong> ${escapeHtml(bank.conta || "")} &nbsp;&nbsp; <strong>Agência:</strong> ${escapeHtml(bank.agencia || "")}</div>
      </div>
      <div class="clausula">
        <div class="clausula-titulo">Cláusula Nona:</div>
        <div class="clausula-texto">${textos.interrupcaoTexto}</div>
      </div>
      <div class="clausula">
        <div class="clausula-titulo">Cláusula Décima:</div>
        <div class="clausula-texto">Ficam sob inteira responsabilidade do CONTRATANTE, os alvarás do juizado de menores, taxas de cobrança do ECAD, diversões Públicas e quaisquer outros que se fizeram necessário à realização do espetáculo.</div>
      </div>
      <div class="clausula">
        <div class="clausula-titulo">Cláusula Décima Primeira:</div>
        <div class="clausula-texto">As partes aqui contratadas elegem desde já, o foro da Cidade de ${escapeHtml(foro)}, com exclusão de qualquer outro, por mais privilegiado que seja para questões judiciais que se originaram desta Nota Contratual.</div>
      </div>
      ${d.clausulasEspeciais ? `
      <div class="clausula">
        <div class="clausula-titulo">Cláusula Especial:</div>
        <div class="clausula-texto">${escapeHtml(d.clausulasEspeciais)}</div>
      </div>` : ""}
      ${d.riderTecnico ? `
      <div class="obs"><strong>Rider Técnico:</strong> ${escapeHtml(d.riderTecnico)}</div>` : ""}
      ${d.observacoes ? `
      <div class="obs"><strong>OBS.</strong> ${escapeHtml(d.observacoes)}</div>` : ""}
      <div class="assinaturas">
        <div class="local-data">${escapeHtml(foro)}, ${escapeHtml(dataAssinaturaBr)}</div>
        <div class="linha-assinatura">
          <div class="assinatura-bloco">
            <div class="assinatura-linha"></div>
            <div class="assinatura-label">Contratante</div>
          </div>
          <div class="assinatura-bloco">
            ${d.assinarDigitalmente !== false ? `
            <div class="ass-dig-bloco">
              <div class="ass-dig-titulo">Certificado de Assinatura</div>
              <div class="ass-dig-info"><strong>${escapeHtml(artist.legalName || artist.name)}</strong></div>
              <div class="ass-dig-info">CNPJ: ${escapeHtml(artist.cnpj || "")}</div>
              <div class="ass-dig-info">${escapeHtml(dataAssinatura)}</div>
              <div class="ass-dig-codigo">${hashContrato}</div>
            </div>` : ""}
            <div class="assinatura-linha"></div>
            <div class="assinatura-label">Contratado</div>
          </div>
        </div>
        <div class="testemunhas-titulo">TESTEMUNHAS:</div>
        <div class="testemunhas-linha">
          <span class="test-num">1º</span>
          <div class="test-linha"></div>
          <span class="test-num">2º</span>
          <div class="test-linha"></div>
        </div>
      </div>
      <div class="rodape">
        <div class="rodape-frase">${escapeHtml(d.fraseRodape || "Depois do Sim, é hora do Show")}</div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

// ── Templates Light ──────────────────────────────────────────────────────────


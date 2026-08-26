import crypto from "crypto";
import { escapeHtml, formatData, valorPorExtenso } from "@/lib/templates/utils";
import type { ArtistTemplateData, AssetResult } from "@/lib/templates/types";
import { getTextosCategoria } from "@/lib/templates/contrato/artist-texts";

type ArtistData = ArtistTemplateData & Record<string, any>;

export async function buildCtr004(
  artist: ArtistData,
  data: Record<string, any>,
  _pageSize?: { width: string; height: string },
  logo?: AssetResult | null,
  _background?: AssetResult | null,
): Promise<string> {
  const d = data;
  const primary = artist.primaryColor || "#e6b800";
  const addr = (artist.address as any) || {};
  const bank = (artist.bankInfo as any) || {};
  const logoMime = logo?.mime || "image/png";
  const logoBase64 = logo?.base64 || "";
  const fontScale = (artist.contratoFontScale || 100) / 52;
  const logoScale = Number(artist.contratoLogoScale) || 100;
  const logoH = Math.round(80 * logoScale / 100);

  const valorCache = (parseFloat(d.cache) || 0) / 100;
  const backlineN = d.backline === "valor" ? (parseFloat(d.backlineValor) || 0) / 100 : 0;
  const transporteN = d.transporte === "valor" ? (parseFloat(d.transporteValor) || 0) / 100 : 0;
  const valorTotal = valorCache + backlineN + transporteN;
  const totalFmt = valorTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });
  const totalExt = valorPorExtenso(valorTotal);
  const cacheFmt = valorCache.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });
  const backlineFmt = backlineN > 0
    ? backlineN.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 })
    : null;
  const transporteFmt = transporteN > 0
    ? transporteN.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 })
    : null;

  const transporteTexto = d.transporte === "incluso" || !d.transporte
    ? "O deslocamento do artista e equipe já está incluso no valor do cachê, conforme combinado."
    : `O deslocamento do artista e equipe será cobrado à parte no valor de <strong>${transporteFmt}</strong>, conforme combinado.`;

  const enderecoArtista = addr.rua
    ? `${addr.rua} Nº ${addr.numero || ""}, Bairro ${addr.bairro || ""}, ${addr.cidade || ""}/${addr.estado || ""}`
    : "—";
  const foro = addr.cidade ? `${addr.cidade}-${addr.estado}` : "Campo Grande-MS";
  const cidadeEstadoContratante = d.cidade && d.uf ? `${d.cidade}/${d.uf}` : "";
  const cidadeEstadoEvento = d.cidadeEvento || foro;
  const instruments = artist.instruments || "Bateria, Percussão, Guitarra, Baixo, Sanfona";
  const textos = getTextosCategoria(artist.categoria);
  const rgTexto = d.contratanteRg
    ? `${d.contratanteRg}${d.contratanteOrgao ? " " + d.contratanteOrgao : ""}`
    : "não informado";
  const horasNum = d.horas || 2;
  const horasFormatado = horasNum % 1 !== 0 ? `${Math.floor(horasNum)}:30` : `${horasNum}:00`;
  const pessoasBanda = d.pessoasBanda || textos.pessoasDefault;
  const dataEventoBr = formatData(d.data);
  const dataAssinaturaBr = d.dataAssinatura ? formatData(d.dataAssinatura) : dataEventoBr;
  const dataAssinatura = new Date().toLocaleString("pt-BR", { timeZone: "America/Campo_Grande" });
  const nomeSlug = (d.contratanteNome || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
  const hashContrato = crypto.createHash("sha256")
    .update(nomeSlug + dataEventoBr + totalFmt + Date.now().toString())
    .digest("hex").substring(0, 16).toUpperCase();

  const fs = fontScale;

  // Section helper
  const sec = (n: string, title: string) =>
    `<div class="sec-header"><span class="sec-num">${n}</span><span class="sec-title">${title}</span></div>`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;600;700;900&family=Open+Sans:wght@400;600&display=swap" rel="stylesheet">
  <style>
    @page { margin: 25mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; background: #fff; font-family: 'Open Sans', sans-serif; }

    .pagina { width: 100%; min-height: 100vh; display: flex; flex-direction: column; background: #fff; }

    /* ── Header ── */
    .header-top-rule { height: 4px; background: ${primary}; width: 100%; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .header-band {
      background: #fff; padding: 16px 20px 14px;
      display: flex; align-items: center; justify-content: space-between;
      border-bottom: 1px solid #eee;
    }
    .header-band-left { display: flex; align-items: center; gap: 14px; }
    .header-logo { height: ${logoH}px; max-width: 280px; object-fit: contain; }
    .header-logo-placeholder { width: 1px; }
    .header-artist { font-family: 'Montserrat', sans-serif; font-weight: 900; font-size: ${Math.round(16*fs)}px; color: #111; letter-spacing: 0.3px; }
    .header-cnpj { font-size: ${Math.round(11*fs)}px; color: #aaa; margin-top: 2px; }
    .header-doc {
      font-family: 'Montserrat', sans-serif; font-weight: 700;
      font-size: ${Math.round(11*fs)}px; letter-spacing: 3px; text-transform: uppercase;
      color: ${primary};
    }

    /* ── Sub-header ── */
    .sub-header {
      background: #f8f8f8; padding: 8px 20px;
      display: flex; align-items: center; justify-content: center;
      border-bottom: 1px solid #eee;
    }
    .sub-header-title {
      font-family: 'Montserrat', sans-serif; font-weight: 500;
      font-size: ${Math.round(11*fs)}px; letter-spacing: 5px;
      text-transform: uppercase; color: #aaa;
    }

    /* ── Body ── */
    .corpo { padding: 16px 20px 24px; flex: 1; }

    .intro { font-size: ${Math.round(16*fs)}px; color: #333; line-height: 1.9; margin-bottom: 14px; text-align: justify; }
    .intro strong { font-family: 'Montserrat', sans-serif; font-weight: 700; color: #111; }

    /* ── Section ── */
    .sec-header {
      display: flex; align-items: center; gap: 10px;
      margin-bottom: 6px; margin-top: 12px;
      break-after: avoid;
    }
    .sec-num {
      font-family: 'Montserrat', sans-serif; font-weight: 900;
      font-size: ${Math.round(13*fs)}px; color: ${primary};
      background: #111; padding: 2px 7px; border-radius: 3px;
      letter-spacing: 1px;
    }
    .sec-title {
      font-family: 'Montserrat', sans-serif; font-weight: 700;
      font-size: ${Math.round(16*fs)}px; color: #111; letter-spacing: 1px;
      text-transform: uppercase;
    }
    .sec-body {
      font-size: ${Math.round(16*fs)}px; color: #444;
      line-height: 1.8; text-align: justify; padding-left: 28px;
      break-before: avoid; break-inside: avoid;
    }
    .sec-body strong { font-family: 'Montserrat', sans-serif; font-weight: 700; color: #111; }
    .paragrafo {
      font-size: ${Math.round(15*fs)}px; color: #555;
      line-height: 1.8; margin-top: 4px; padding-left: 42px; text-align: justify;
    }

    .obs {
      font-size: ${Math.round(16*fs)}px; color: #444; line-height: 1.8;
      margin: 8px 0; padding: 8px 14px;
      background: #fffdf7; border-left: 3px solid ${primary};
      break-inside: avoid;
    }
    .obs strong { font-family: 'Montserrat', sans-serif; font-weight: 700; color: ${primary}; }

    /* ── Financial box ── */
    .financial-box {
      background: #f9f9f9; border-radius: 8px;
      border: 1px solid #eee; padding: 14px 18px;
      margin: 12px 0; break-inside: avoid;
    }
    .financial-title {
      font-family: 'Montserrat', sans-serif; font-weight: 700;
      font-size: ${Math.round(12*fs)}px; color: #888;
      letter-spacing: 3px; text-transform: uppercase; margin-bottom: 10px;
    }
    .financial-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #eee; }
    .financial-row:last-child { border-bottom: none; }
    .financial-key { font-size: ${Math.round(15*fs)}px; color: #777; }
    .financial-val { font-family: 'Montserrat', sans-serif; font-weight: 700; font-size: ${Math.round(16*fs)}px; color: #111; }
    .financial-total-row {
      display: flex; justify-content: space-between; align-items: center;
      margin-top: 8px; padding-top: 8px; border-top: 2px solid #111;
    }
    .financial-total-key {
      font-family: 'Montserrat', sans-serif; font-weight: 900;
      font-size: ${Math.round(13*fs)}px; color: #111; letter-spacing: 2px; text-transform: uppercase;
    }
    .financial-total-val {
      font-family: 'Montserrat', sans-serif; font-weight: 900;
      font-size: ${Math.round(20*fs)}px; color: ${primary};
    }

    .banco-box {
      background: #f9f9f9; border-radius: 8px; border: 1px solid #eee;
      padding: 14px 18px; margin: 12px 0; break-inside: avoid;
    }
    .banco-title {
      font-family: 'Montserrat', sans-serif; font-weight: 700;
      font-size: ${Math.round(12*fs)}px; color: #888;
      letter-spacing: 3px; text-transform: uppercase; margin-bottom: 8px;
    }
    .banco-linha { font-size: ${Math.round(16*fs)}px; color: #444; line-height: 1.9; }
    .banco-linha strong { font-family: 'Montserrat', sans-serif; font-weight: 700; color: #111; }

    /* ── Signatures ── */
    .assinaturas { margin-top: 24px; padding-top: 16px; border-top: 1px solid #eee; break-inside: avoid; }
    .local-data { font-size: ${Math.round(13*fs)}px; color: #555; margin-bottom: 24px; text-align: center; font-style: italic; }
    .linha-assinatura { display: flex; justify-content: space-between; gap: 50px; margin-bottom: 24px; align-items: flex-end; }
    .assinatura-bloco { flex: 1; text-align: center; }
    .assinatura-linha { border-top: 1px solid #333; margin-bottom: 6px; }
    .assinatura-label { font-size: ${Math.round(12*fs)}px; color: #888; text-transform: uppercase; letter-spacing: 2px; }
    .testemunhas-titulo { font-family: 'Montserrat', sans-serif; font-weight: 600; font-size: ${Math.round(12*fs)}px; color: #888; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 2px; }
    .testemunhas-linha { display: flex; align-items: center; gap: 10px; margin-top: 8px; }
    .test-num { font-family: 'Montserrat', sans-serif; font-weight: 700; font-size: ${Math.round(13*fs)}px; color: #111; white-space: nowrap; }
    .test-linha { flex: 1; border-top: 1px solid #333; }

    .ass-dig-bloco { margin: 0 auto 5px; padding: 6px 8px; border: 1.5px solid ${primary}; border-radius: 5px; background: #fffdf5; text-align: center; max-width: 180px; }
    .ass-dig-titulo { font-family: 'Montserrat', sans-serif; font-weight: 800; font-size: ${Math.round(7.5*fs)}px; color: ${primary}; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 4px; border-bottom: 1px solid ${primary}33; padding-bottom: 3px; }
    .ass-dig-info { font-size: ${Math.round(8.5*fs)}px; color: #555; line-height: 1.55; }
    .ass-dig-codigo { font-family: 'Courier New', monospace; font-size: ${Math.round(7*fs)}px; color: #aaa; margin-top: 4px; letter-spacing: 1px; }

    /* ── Footer ── */
    .rodape {
      padding: 12px 20px; background: #f9f9f9; border-top: 1px solid #eee;
      display: flex; align-items: center; justify-content: space-between;
    }
    .rodape-frase {
      font-family: 'Montserrat', sans-serif; font-weight: 700;
      font-size: ${Math.round(12*fs)}px; color: ${primary}; letter-spacing: 2px; font-style: italic;
    }
    .rodape-hash { font-size: ${Math.round(11*fs)}px; color: #ccc; }
  </style>
</head>
<body>
  <div class="pagina">
    <div class="header-top-rule"></div>
    <div class="header-band">
      <div class="header-band-left">
        ${logo ? `<img class="header-logo" src="data:${logoMime};base64,${logoBase64}" />` : `<div class="header-logo-placeholder"></div>`}
        <div>
          <div class="header-artist">${escapeHtml(artist.name)}</div>
          ${artist.cnpj ? `<div class="header-cnpj">CNPJ ${escapeHtml(artist.cnpj)}</div>` : ""}
        </div>
      </div>
      <div class="header-doc">Contrato</div>
    </div>
    <div class="sub-header">
      <div class="sub-header-title">Prestação de Serviços Artísticos</div>
    </div>

    <div class="corpo">
      <div class="intro">
        Pelo presente instrumento, de um lado denominado <strong>CONTRATANTE</strong>,
        <strong>${escapeHtml(d.contratanteNome || "")}</strong>,
        CPF/CNPJ: <strong>${escapeHtml(d.contratanteCpfCnpj || "")}</strong>,
        RG: <strong>${escapeHtml(rgTexto)}</strong>,
        residente na Rua: <strong>${escapeHtml(d.logradouro || "")}</strong>,
        Nº <strong>${escapeHtml(d.numero || "")}</strong>, <strong>${escapeHtml(d.bairro || "")}</strong>,
        CEP: <strong>${escapeHtml(d.cep || "")}</strong>, <strong>${escapeHtml(cidadeEstadoContratante)}</strong>${d.contratanteTelefone ? `, Tel: <strong>${escapeHtml(d.contratanteTelefone)}</strong>` : ""}.
      </div>
      <div class="intro">
        De outro lado, <strong>"${escapeHtml(artist.name)}"</strong>, denominado <strong>CONTRATADO</strong>,
        <em>empresa brasileira, CNPJ: ${escapeHtml(artist.cnpj || "")}, com escritório na ${escapeHtml(enderecoArtista)}</em>,
        têm entre si o seguinte:
      </div>

      ${sec("01", "Data do Evento")}
      <div class="sec-body">O CONTRATADO se obriga a prestar serviço de ${textos.tipoServico} em: <strong>${escapeHtml(dataEventoBr)}</strong>.</div>

      ${sec("02", "Local e Duração")}
      <div class="sec-body">Duração de <strong>${escapeHtml(horasFormatado)}hs de ${textos.tipoServico}</strong>${d.horario ? `, às <strong>${escapeHtml(d.horario)}h</strong>` : ""}, no local: <strong>${escapeHtml(d.local || "")}</strong>, <strong>${escapeHtml(cidadeEstadoEvento)}</strong>.</div>

      ${sec("03", "Valor Contratado")}
      <div class="sec-body">Valor de <strong>${escapeHtml(totalFmt)} (${escapeHtml(totalExt)})</strong>${backlineN > 0 ? `, sendo <strong>${escapeHtml(cacheFmt)}</strong> de cachê e <strong>${escapeHtml(backlineFmt!)}</strong> de backline` : ""}.</div>

      <div class="financial-box">
        <div class="financial-title">Composição do Valor</div>
        <div class="financial-row"><span class="financial-key">Cachê (${horasNum}h)</span><span class="financial-val">${cacheFmt}</span></div>
        ${backlineN > 0 ? `<div class="financial-row"><span class="financial-key">Backline</span><span class="financial-val">${backlineFmt}</span></div>` : ""}
        ${transporteN > 0 ? `<div class="financial-row"><span class="financial-key">Transporte</span><span class="financial-val">${transporteFmt}</span></div>` : ""}
        <div class="financial-total-row">
          <span class="financial-total-key">Total</span>
          <span class="financial-total-val">${totalFmt}</span>
        </div>
      </div>

      ${sec("04", textos.formatoTitulo)}
      <div class="sec-body">${textos.formatoTexto(escapeHtml(instruments))}</div>

      ${sec("05", "Deslocamento")}
      <div class="sec-body">${transporteTexto}</div>

      ${backlineN > 0 ? `${sec("", "Backline")}<div class="sec-body">Backline no valor de <strong>${escapeHtml(backlineFmt!)}</strong> ficará por conta do CONTRATANTE.</div>` : ""}

      <div class="obs"><strong>OBS.</strong> Água mineral e alimentação para <strong>${pessoasBanda}</strong> pessoas ficam por conta do CONTRATANTE.</div>
      <div class="obs"><strong>OBS.</strong> ${textos.obsBacklineOuSom}</div>

      ${sec("06", "Repertório")}
      <div class="sec-body">${textos.repertorioTexto}</div>

      ${sec("07", "Rescisão")}
      <div class="sec-body">Em caso de rescisão, a parte infratora indenizará a prejudicada:</div>
      <div class="paragrafo">§ 1º — Multa de 10% do valor, rescisão por escrito até 15 dias antes do evento.</div>
      <div class="paragrafo">§ 2º — Multa de 50% do valor, rescisão no dia do evento.</div>

      ${sec("08", "Pagamento")}
      <div class="sec-body">${d.formaPagamento
        ? `O CONTRATANTE efetuará o pagamento da seguinte forma: <strong>${escapeHtml(d.formaPagamento)}</strong>.`
        : "O CONTRATANTE efetuará o pagamento de 30% na assinatura do contrato e o restante até a semana que antecede o evento."
      }</div>

      <div class="banco-box">
        <div class="banco-title">Dados Bancários</div>
        <div class="banco-linha"><strong>Titular:</strong> ${escapeHtml(bank.titular || artist.legalName || artist.name || "")}</div>
        <div class="banco-linha"><strong>PIX:</strong> ${escapeHtml(bank.pix || artist.pixKey || "")}</div>
        <div class="banco-linha"><strong>Banco:</strong> ${escapeHtml(bank.banco || "")} &nbsp; <strong>Conta:</strong> ${escapeHtml(bank.conta || "")} &nbsp; <strong>Agência:</strong> ${escapeHtml(bank.agencia || "")}</div>
      </div>

      ${sec("09", textos.interrupcaoTitulo)}
      <div class="sec-body">${textos.interrupcaoTexto}</div>

      ${sec("10", "Responsabilidades")}
      <div class="sec-body">Ficam sob responsabilidade do CONTRATANTE alvarás, taxas ECAD, diversões públicas e demais exigências legais para realização do evento.</div>

      ${sec("11", "Foro")}
      <div class="sec-body">Fica eleito o foro da cidade de ${escapeHtml(foro)} para questões oriundas deste contrato.</div>

      ${d.clausulasEspeciais ? `${sec("12", "Cláusula Especial")}<div class="sec-body">${escapeHtml(d.clausulasEspeciais)}</div>` : ""}
      ${d.observacoes ? `<div class="obs"><strong>OBS.</strong> ${escapeHtml(d.observacoes)}</div>` : ""}

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
        <div class="testemunhas-titulo">Testemunhas</div>
        <div class="testemunhas-linha">
          <span class="test-num">1ª</span><div class="test-linha"></div>
          <span class="test-num">2ª</span><div class="test-linha"></div>
        </div>
      </div>
    </div>

    <div class="rodape">
      <div class="rodape-frase">${escapeHtml(d.fraseRodape || "Depois do Sim, é hora do Show")}</div>
      <div class="rodape-hash">Cód: ${hashContrato}</div>
    </div>
  </div>
</body>
</html>`;
}

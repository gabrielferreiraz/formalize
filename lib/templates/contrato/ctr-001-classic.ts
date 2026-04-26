import crypto from "crypto";
import { escapeHtml, formatData, valorPorExtenso } from "@/lib/templates/utils";
import type { ArtistTemplateData, AssetResult } from "@/lib/templates/types";

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

  const pessoasBanda = d.pessoasBanda || 7;

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
  const rgTexto = d.contratanteRg
    ? `${d.contratanteRg}${d.contratanteOrgao ? " " + d.contratanteOrgao : ""}`
    : "não informado";
  const horasNum = d.horas || 2;
  const horasFormatado = (horasNum % 1 !== 0) ? `${Math.floor(horasNum)}:30` : `${horasNum}:00`;
  const fontScale = (artist.contratoFontScale || 100) / 100;

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
    .intro { font-size: ${19 * fontScale}px; color: #222222; line-height: 1.8; margin-bottom: 20px; text-align: justify; }
    .intro strong { font-family: 'Montserrat', sans-serif; font-weight: 700; color: #111111; }
    .clausula { margin-bottom: 18px; break-inside: avoid; }
    .clausula-titulo { font-family: 'Montserrat', sans-serif; font-weight: 700; font-size: ${19 * fontScale}px; color: ${primaryColor}; margin-bottom: 6px; display: flex; align-items: center; gap: 8px; }
    .clausula-titulo::before { content: ''; width: 6px; height: 6px; background: ${primaryColor}; border-radius: 50%; flex-shrink: 0; }
    .clausula-texto { font-size: ${19 * fontScale}px; color: #333333; line-height: 1.8; text-align: justify; padding-left: 14px; }
    .clausula-texto strong { font-family: 'Montserrat', sans-serif; font-weight: 700; color: #111111; }
    .paragrafo { font-size: ${18 * fontScale}px; color: #444444; line-height: 1.8; margin-top: 6px; padding-left: 28px; text-align: justify; }
    .obs { font-size: ${19 * fontScale}px; color: #333333; line-height: 1.8; margin-bottom: 12px; text-align: justify; padding: 10px 14px; background: #fafafa; border-left: 3px solid ${primaryColor}; border-radius: 3px; break-inside: avoid; }
    .obs strong { font-family: 'Montserrat', sans-serif; font-weight: 700; color: ${primaryColor}; }
    .secao-bancaria { background: #f5f5f5; border-left: 5px solid ${primaryColor}; border-radius: 6px; padding: 18px 24px; margin: 18px 0; break-inside: avoid; }
    .banco-titulo { font-family: 'Montserrat', sans-serif; font-weight: 900; font-size: ${19 * fontScale}px; color: #111111; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 2px; }
    .banco-linha { font-size: ${19 * fontScale}px; color: #333333; line-height: 1.9; }
    .banco-linha strong { font-family: 'Montserrat', sans-serif; font-weight: 700; color: #111111; }
    .assinaturas { margin-top: 36px; padding-top: 24px; border-top: 1px solid #eeeeee; break-inside: avoid; }
    .local-data { font-size: ${17 * fontScale}px; color: #444444; margin-bottom: 34px; text-align: center; font-style: italic; }
    .linha-assinatura { display: flex; justify-content: space-between; gap: 60px; margin-bottom: 34px; break-inside: avoid; align-items: flex-end; }
    .assinatura-bloco { flex: 1; text-align: center; }
    .assinatura-linha { border-top: 1.5px solid #333333; margin-bottom: 8px; }
    .assinatura-label { font-size: ${16 * fontScale}px; color: #777777; margin-top: 5px; text-transform: uppercase; letter-spacing: 2px; }
    .testemunhas-titulo { font-family: 'Montserrat', sans-serif; font-weight: 700; font-size: ${17 * fontScale}px; color: #111111; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 2px; }
    .testemunhas-linha { display: flex; align-items: center; gap: 12px; margin-top: 10px; break-inside: avoid; }
    .test-num { font-family: 'Montserrat', sans-serif; font-weight: 700; font-size: ${17 * fontScale}px; color: #111111; white-space: nowrap; }
    .test-linha { flex: 1; border-top: 1.5px solid #333333; }
    .rodape { padding: 20px 40px; text-align: center; position: relative; z-index: 1; }
    .rodape-linha { width: 60%; height: 2px; background: linear-gradient(to right, transparent, ${primaryColor}, transparent); margin: 0 auto 14px; }
    .rodape-frase { font-family: 'Montserrat', sans-serif; font-weight: 700; font-size: ${17 * fontScale}px; color: ${primaryColor}; letter-spacing: 3px; font-style: italic; }
    .ass-dig-bloco { margin-top: 8px; padding: 8px 10px; border: 1px solid ${primaryColor}; border-radius: 4px; background: #fffbf5; text-align: center; }
    .ass-dig-titulo { font-family: 'Montserrat', sans-serif; font-weight: 700; font-size: ${12 * fontScale}px; color: ${primaryColor}; letter-spacing: 2px; margin-bottom: 4px; }
    .ass-dig-info { font-size: ${12 * fontScale}px; color: #444444; line-height: 1.6; }
    .ass-dig-codigo { font-family: 'Montserrat', sans-serif; font-size: ${11 * fontScale}px; color: #888888; margin-top: 4px; letter-spacing: 1px; word-break: break-all; }
  </style>
</head>
<body>
  <div class="pagina">
    ${logo ? `<img class="marca-dagua" src="data:${logoMime};base64,${logoBase64}" />` : ""}
    <div class="header">
      ${logo ? `<img src="data:${logoMime};base64,${logoBase64}" />` : ""}
      <div class="header-subtitulo">Entretenimento Musical</div>
      <div class="header-linha"></div>
    </div>
    <div class="corpo">
      <div class="titulo">Nota Contratual</div>
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
        <div class="clausula-texto">O contratado se obriga a prestar seu serviço de show musical na seguinte data: <strong>${escapeHtml(dataEventoBr)}.</strong></div>
      </div>
      <div class="clausula">
        <div class="clausula-titulo">Cláusula Segunda:</div>
        <div class="clausula-texto">O contratado desempenhará sua função, na duração de <strong>${escapeHtml(horasFormatado)} hs de show</strong>${d.horario ? `, às <strong>${escapeHtml(d.horario)}h</strong>` : ""}, no Local: <strong>${escapeHtml(d.local || "")}</strong>, <strong>${escapeHtml(cidadeEstadoEvento)}</strong></div>
      </div>
      <div class="clausula">
        <div class="clausula-titulo">Cláusula Terceira:</div>
        <div class="clausula-texto">No valor do contrato estipula-se a importância de <strong>${escapeHtml(valorTotalFormatado)} (${escapeHtml(valorTotalExtenso)})</strong> para a apresentação de <strong>${escapeHtml(String(horasNum))}</strong> horas com local citado acima${backlineNumerico > 0 ? `, sendo <strong>${escapeHtml(valorCacheFormatado)}</strong> de cachê e <strong>${escapeHtml(backlineFormatado!)}</strong> de backline` : ""}.</div>
      </div>
      <div class="clausula">
        <div class="clausula-titulo">Cláusula Quarta:</div>
        <div class="clausula-texto">O artista se apresentará em seu formato de banda completa com os seguintes instrumentos: ${escapeHtml(instruments)}, conforme o mapa de palco em anexo na última página.</div>
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
      <div class="obs"><strong>OBS.</strong> Som profissional para atender o evento, durante o tempo determinado de apresentação deverá ser fornecido pelo contratante ou pelo espaço de eventos, porém backline com técnico de som será fornecido pelo artista, para uso do próprio durante a sua apresentação.</div>
      <div class="clausula">
        <div class="clausula-titulo">Cláusula Sexta:</div>
        <div class="clausula-texto">A escolha do repertório a ser executado ficará a critério do <strong><em>Contratado podendo incluir pedido da contratante com antecedência de até 30 dias da data prevista para o evento.</em></strong></div>
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
        <div class="clausula-texto">O espetáculo será interrompido a qualquer momento se ficar constatado o comportamento inadequado do público presente para com o artista e sua banda, ficando bem evidenciado, neste caso, que o CONTRATADO não terá nenhuma responsabilidade ou multa, sendo o espetáculo considerado realizado.</div>
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
              <div class="ass-dig-titulo">Assinado Digitalmente</div>
              <div class="ass-dig-info"><strong>${escapeHtml(artist.legalName || artist.name)}</strong></div>
              <div class="ass-dig-info">CNPJ: ${escapeHtml(artist.cnpj || "")}</div>
              <div class="ass-dig-info">${escapeHtml(dataAssinatura)}</div>
              <div class="ass-dig-codigo">Cód: ${hashContrato}</div>
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
        <div class="rodape-linha"></div>
        <div class="rodape-frase">${escapeHtml(d.fraseRodape || "Depois do Sim, é hora do Show")}</div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

// ── Templates Light ──────────────────────────────────────────────────────────

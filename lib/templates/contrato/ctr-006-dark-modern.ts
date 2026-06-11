import crypto from "crypto";
import { escapeHtml, formatData, valorPorExtenso } from "@/lib/templates/utils";
import type { ArtistTemplateData, AssetResult } from "@/lib/templates/types";

type ArtistData = ArtistTemplateData & Record<string, any>;

export async function buildCtr006(
  artist: ArtistData,
  data: Record<string, any>,
  _pageSize?: { width: string; height: string },
  logo?: AssetResult | null,
  _background?: AssetResult | null,
): Promise<string> {
  const d = data;
  const primary = artist.primaryColor || "#818cf8";
  const addr = (artist.address as any) || {};
  const bank = (artist.bankInfo as any) || {};
  const logoMime = logo?.mime || "image/png";
  const logoBase64 = logo?.base64 || "";
  const fontScale = (artist.contratoFontScale || 100) / 52;
  const logoScale = Number(artist.contratoLogoScale) || 100;
  const logoH = Math.round(72 * logoScale / 100);
  const fs = fontScale;

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
  const rgTexto = d.contratanteRg
    ? `${d.contratanteRg}${d.contratanteOrgao ? " " + d.contratanteOrgao : ""}`
    : "não informado";
  const horasNum = d.horas || 2;
  const horasFormatado = horasNum % 1 !== 0 ? `${Math.floor(horasNum)}:30` : `${horasNum}:00`;
  const pessoasBanda = d.pessoasBanda || 7;
  const dataEventoBr = formatData(d.data);
  const dataAssinaturaBr = d.dataAssinatura ? formatData(d.dataAssinatura) : dataEventoBr;
  const dataAssinatura = new Date().toLocaleString("pt-BR", { timeZone: "America/Campo_Grande" });
  const nomeSlug = (d.contratanteNome || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().trim();
  const hashContrato = crypto.createHash("sha256")
    .update(nomeSlug + dataEventoBr + totalFmt + Date.now().toString())
    .digest("hex").substring(0, 16).toUpperCase();

  let clausulaNum = 0;
  const cl = (titulo: string, corpo: string) => {
    clausulaNum++;
    const n = String(clausulaNum).padStart(2, "0");
    return `
    <div class="clausula">
      <div class="clausula-header">
        <span class="clausula-num">${n}</span>
        <span class="clausula-titulo">${titulo}</span>
      </div>
      <div class="clausula-texto">${corpo}</div>
    </div>`;
  };

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;900&family=Space+Grotesk:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    @page { margin: 25mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; background: #0f1117; font-family: 'Inter', sans-serif; }

    .pagina { width: 100%; min-height: 100vh; display: flex; flex-direction: column; background: #0f1117; }

    .header {
      padding: 0 20px; background: #0f1117;
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    .header-top {
      padding: 28px 0 22px; display: flex; align-items: center;
      justify-content: space-between;
    }
    .header-logo { height: ${logoH}px; max-width: 240px; object-fit: contain; display: block; }
    .header-artist { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: ${Math.round(20*fs)}px; color: #f1f5f9; letter-spacing: -0.5px; }
    .header-cnpj { font-size: ${Math.round(12*fs)}px; color: #475569; margin-top: 2px; }
    .header-tag {
      display: flex; align-items: center; gap: 8px;
      padding: 6px 14px; border-radius: 20px;
      background: ${primary}18; border: 1px solid ${primary}44;
      font-size: ${Math.round(11*fs)}px; font-weight: 600;
      color: ${primary}; letter-spacing: 2px; text-transform: uppercase;
    }
    .header-tag-dot { width: 6px; height: 6px; border-radius: 50%; background: ${primary}; }
    .header-bar { height: 2px; background: linear-gradient(to right, ${primary}, ${primary}44, transparent); }

    .titulo-wrap { padding: 28px 20px 0; }
    .titulo {
      font-family: 'Space Grotesk', sans-serif; font-weight: 700;
      font-size: ${Math.round(26*fs)}px; color: #f1f5f9;
      letter-spacing: -0.5px; margin-bottom: 6px;
    }
    .subtitulo { font-size: ${Math.round(14*fs)}px; color: #475569; letter-spacing: 0.5px; }

    .corpo { padding: 16px 20px 30px; flex: 1; }

    .intro-box {
      background: #171b26; border: 1px solid rgba(255,255,255,0.07);
      border-radius: 10px; padding: 18px 22px; margin-bottom: 24px;
    }
    .intro { font-size: ${Math.round(15*fs)}px; color: #94a3b8; line-height: 1.9; margin-bottom: 10px; text-align: justify; }
    .intro:last-child { margin-bottom: 0; }
    .intro strong { font-weight: 600; color: #e2e8f0; }

    .clausulas-grid { display: flex; flex-direction: column; gap: 10px; }
    .clausula { break-inside: avoid; }
    .clausula-header {
      display: flex; align-items: center; gap: 12px;
      margin-bottom: 5px;
    }
    .clausula-num {
      font-family: 'Space Grotesk', sans-serif; font-weight: 700;
      font-size: ${Math.round(11*fs)}px; color: ${primary};
      background: ${primary}18; border: 1px solid ${primary}33;
      border-radius: 4px; padding: 2px 7px; letter-spacing: 1px;
      flex-shrink: 0;
    }
    .clausula-titulo {
      font-family: 'Space Grotesk', sans-serif; font-weight: 600;
      font-size: ${Math.round(15*fs)}px; color: #cbd5e1;
      text-transform: uppercase; letter-spacing: 1px;
    }
    .clausula-texto { font-size: ${Math.round(16*fs)}px; color: #94a3b8; line-height: 1.85; text-align: justify; padding-left: 36px; }
    .clausula-texto strong { font-weight: 600; color: #e2e8f0; }
    .paragrafo { font-size: ${Math.round(15*fs)}px; color: #64748b; line-height: 1.8; margin-top: 4px; padding-left: 52px; text-align: justify; }

    .obs {
      font-size: ${Math.round(15*fs)}px; color: #7c8fa8; line-height: 1.8;
      padding: 10px 14px 10px 18px;
      background: #171b26; border-radius: 6px;
      border-left: 2px solid ${primary}55;
      break-inside: avoid;
    }
    .obs strong { font-weight: 600; color: ${primary}; }

    .secao-bancaria {
      background: #171b26; border: 1px solid rgba(255,255,255,0.06);
      border-radius: 10px; padding: 16px 20px; margin: 16px 0; break-inside: avoid;
    }
    .banco-titulo {
      font-family: 'Space Grotesk', sans-serif; font-weight: 600;
      font-size: ${Math.round(11*fs)}px; color: ${primary}; letter-spacing: 3px;
      text-transform: uppercase; margin-bottom: 10px; padding-bottom: 8px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    .banco-linha { font-size: ${Math.round(15*fs)}px; color: #94a3b8; line-height: 2; }
    .banco-linha strong { font-weight: 600; color: #e2e8f0; }

    .assinaturas { margin-top: 36px; padding-top: 22px; border-top: 1px solid rgba(255,255,255,0.06); break-inside: avoid; }
    .local-data { font-size: ${Math.round(13*fs)}px; color: #475569; margin-bottom: 30px; text-align: center; font-style: italic; }
    .linha-assinatura { display: flex; justify-content: space-between; gap: 50px; margin-bottom: 28px; align-items: flex-end; }
    .assinatura-bloco { flex: 1; text-align: center; }
    .assinatura-linha { border-top: 1px solid #2d3748; margin-bottom: 8px; }
    .assinatura-label { font-size: ${Math.round(11*fs)}px; color: #475569; text-transform: uppercase; letter-spacing: 2px; font-weight: 500; }

    .testemunhas-titulo { font-size: ${Math.round(11*fs)}px; color: #334155; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 2px; font-weight: 600; }
    .testemunhas-linha { display: flex; align-items: center; gap: 10px; margin-top: 8px; }
    .test-num { font-weight: 700; font-size: ${Math.round(13*fs)}px; color: #334155; white-space: nowrap; }
    .test-linha { flex: 1; border-top: 1px solid #1e2535; }

    .ass-dig-bloco { margin: 0 auto 5px; padding: 6px 8px; border: 1.5px solid ${primary}44; border-radius: 5px; background: ${primary}0d; text-align: center; max-width: 180px; }
    .ass-dig-titulo { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: ${Math.round(7.5*fs)}px; color: ${primary}; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 4px; border-bottom: 1px solid ${primary}22; padding-bottom: 3px; }
    .ass-dig-info { font-size: ${Math.round(8.5*fs)}px; color: #64748b; line-height: 1.55; }
    .ass-dig-codigo { font-family: 'Courier New', monospace; font-size: ${Math.round(7*fs)}px; color: #334155; margin-top: 4px; letter-spacing: 1px; }

    .rodape { padding: 14px 20px; border-top: 1px solid rgba(255,255,255,0.04); display: flex; align-items: center; justify-content: space-between; }
    .rodape-frase { font-size: ${Math.round(11*fs)}px; color: #1e293b; font-style: italic; letter-spacing: 1px; }
    .rodape-hash { font-family: 'Courier New', monospace; font-size: ${Math.round(10*fs)}px; color: #1e293b; }
  </style>
</head>
<body>
  <div class="pagina">
    <div class="header">
      <div class="header-top">
        <div>
          ${logoBase64 ? `<img class="header-logo" src="data:${logoMime};base64,${logoBase64}" style="margin-bottom:8px;" />` : ""}
          <div class="header-artist">${escapeHtml(artist.name)}</div>
          ${artist.cnpj ? `<div class="header-cnpj">CNPJ ${escapeHtml(artist.cnpj)}</div>` : ""}
        </div>
        <div class="header-tag">
          <span class="header-tag-dot"></span>
          Contrato
        </div>
      </div>
      <div class="header-bar"></div>
    </div>

    <div class="titulo-wrap">
      <div class="titulo">Contrato de Prestação de Serviços</div>
      <div class="subtitulo">Documento com validade jurídica entre as partes identificadas abaixo</div>
    </div>

    <div class="corpo">
      <div class="intro-box">
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
      </div>

      <div class="clausulas-grid">
        ${cl("Objeto", `O CONTRATADO se obriga a prestar seu serviço de show musical na data: <strong>${escapeHtml(dataEventoBr)}</strong>.`)}
        ${cl("Local e Duração", `Duração de <strong>${escapeHtml(horasFormatado)} hs de show</strong>${d.horario ? `, às <strong>${escapeHtml(d.horario)}h</strong>` : ""}, no local: <strong>${escapeHtml(d.local || "")}</strong>, <strong>${escapeHtml(cidadeEstadoEvento)}</strong>.`)}
        ${cl("Valor", `Valor contratado: <strong>${escapeHtml(totalFmt)} (${escapeHtml(totalExt)})</strong>${backlineN > 0 ? `, sendo <strong>${escapeHtml(cacheFmt)}</strong> de cachê e <strong>${escapeHtml(backlineFmt!)}</strong> de backline` : ""}.`)}
        ${cl("Instrumentação", `O artista se apresentará com os instrumentos: ${escapeHtml(instruments)}, conforme mapa de palco em anexo.`)}
        ${cl("Transporte", transporteTexto)}
        ${backlineN > 0 ? cl("Backline", `Backline no valor de <strong>${escapeHtml(backlineFmt!)}</strong> ficará por conta do CONTRATANTE.`) : ""}
        <div class="obs"><strong>OBS.</strong> Água mineral durante a apresentação e alimentação para <strong>${pessoasBanda}</strong> pessoas ficam por conta do CONTRATANTE.</div>
        <div class="obs"><strong>OBS.</strong> Som profissional para atender o evento deverá ser fornecido pelo contratante ou pelo espaço; backline com técnico de som será fornecido pelo artista para uso próprio.</div>
        ${cl("Repertório", "O repertório ficará a critério do <strong><em>CONTRATADO, podendo incluir pedidos com antecedência de até 30 dias.</em></strong>")}
        ${cl("Rescisão", `Em caso de rescisão, a parte infratora indenizará a prejudicada conforme abaixo:<div class="paragrafo">§ 1º — Multa de 10% do valor, quando a rescisão se der por escrito até 15 dias antes do evento.</div><div class="paragrafo">§ 2º — Multa de 50% do valor, quando a rescisão ocorrer no dia do evento.</div>`)}
        ${cl("Pagamento", d.formaPagamento
          ? `O CONTRATANTE efetuará o pagamento da seguinte forma: <strong>${escapeHtml(d.formaPagamento)}</strong>.`
          : "O CONTRATANTE efetuará o pagamento de 30% na assinatura do contrato e o restante até a semana que antecede o evento."
        )}

        <div class="secao-bancaria">
          <div class="banco-titulo">Dados para Pagamento</div>
          <div class="banco-linha"><strong>Titular:</strong> ${escapeHtml(bank.titular || artist.legalName || artist.name || "")}</div>
          <div class="banco-linha"><strong>PIX:</strong> ${escapeHtml(bank.pix || artist.pixKey || "")}</div>
          <div class="banco-linha"><strong>Banco:</strong> ${escapeHtml(bank.banco || "")} &nbsp;&nbsp; <strong>Conta:</strong> ${escapeHtml(bank.conta || "")} &nbsp;&nbsp; <strong>Agência:</strong> ${escapeHtml(bank.agencia || "")}</div>
        </div>

        ${cl("Interrupção", "O espetáculo será interrompido se constatado comportamento inadequado do público para com o artista — neste caso o CONTRATADO não terá multa e o espetáculo será considerado realizado.")}
        ${cl("Obrigações do Contratante", "Ficam sob inteira responsabilidade do CONTRATANTE os alvarás, taxas ECAD, diversões públicas e quaisquer outros necessários à realização do evento.")}
        ${cl("Foro", `Fica eleito o foro da Cidade de ${escapeHtml(foro)}, com exclusão de qualquer outro, para questões judiciais oriundas deste contrato.`)}
        ${d.clausulasEspeciais ? cl("Cláusula Especial", escapeHtml(d.clausulasEspeciais)) : ""}
        ${d.observacoes ? `<div class="obs"><strong>OBS.</strong> ${escapeHtml(d.observacoes)}</div>` : ""}
      </div>

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
      <div class="rodape-hash">${hashContrato}</div>
    </div>
  </div>
</body>
</html>`;
}

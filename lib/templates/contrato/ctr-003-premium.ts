import crypto from "crypto";
import { escapeHtml, formatData, valorPorExtenso } from "@/lib/templates/utils";
import type { ArtistTemplateData, AssetResult } from "@/lib/templates/types";

type ArtistData = ArtistTemplateData & Record<string, any>;

export async function buildCtr003(
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
  const fontScale = (artist.contratoFontScale || 100) / 100;

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
  const nomeSlug = (d.contratanteNome || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
  const hashContrato = crypto.createHash("sha256")
    .update(nomeSlug + dataEventoBr + totalFmt + Date.now().toString())
    .digest("hex").substring(0, 16).toUpperCase();

  const fs = fontScale;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;900&family=Open+Sans:wght@400;600&display=swap" rel="stylesheet">
  <style>
    @page { margin: 1mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; background: #fff; font-family: 'Open Sans', sans-serif; }

    .pagina {
      width: 100%; min-height: 100vh; display: flex; flex-direction: row;
      position: relative; background: #fff;
    }

    /* ── Left accent bar ── */
    .sidebar {
      width: 6px; background: ${primary}; flex-shrink: 0; min-height: 100%;
    }

    /* ── Main content ── */
    .main { flex: 1; display: flex; flex-direction: column; }

    .header {
      padding: 26px 40px 20px; display: flex; align-items: center;
      justify-content: space-between; border-bottom: 1px solid #eee;
    }
    .header-left {}
    .header-logo { height: 64px; max-width: 180px; object-fit: contain; display: block; margin-bottom: 8px; }
    .header-name { font-family: 'Montserrat', sans-serif; font-weight: 900; font-size: ${Math.round(17*fs)}px; color: #111; letter-spacing: 0.5px; }
    .header-cnpj { font-size: ${Math.round(13*fs)}px; color: #aaa; margin-top: 2px; }
    .header-right { text-align: right; }
    .header-doc-label { font-family: 'Montserrat', sans-serif; font-weight: 300; font-size: ${Math.round(12*fs)}px; letter-spacing: 4px; text-transform: uppercase; color: #bbb; margin-bottom: 4px; }
    .header-badge {
      display: inline-block; padding: 4px 14px;
      border: 1px solid ${primary}; border-radius: 4px;
      font-family: 'Montserrat', sans-serif; font-weight: 700;
      font-size: ${Math.round(13*fs)}px; color: ${primary}; letter-spacing: 2px;
      text-transform: uppercase;
    }

    .corpo { padding: 22px 40px 32px; flex: 1; }

    .titulo {
      font-family: 'Montserrat', sans-serif; font-weight: 900;
      font-size: ${Math.round(20*fs)}px; color: #111;
      text-align: center; letter-spacing: 4px; text-transform: uppercase;
      margin-bottom: 18px; padding-bottom: 12px;
      border-bottom: 2px solid ${primary};
    }

    .intro { font-size: ${Math.round(14*fs)}px; color: #333; line-height: 1.9; margin-bottom: 14px; text-align: justify; }
    .intro strong { font-family: 'Montserrat', sans-serif; font-weight: 700; color: #111; }

    .clausula { margin-bottom: 12px; break-inside: avoid; }
    .clausula-titulo {
      font-family: 'Montserrat', sans-serif; font-weight: 700;
      font-size: ${Math.round(14*fs)}px; color: #111; margin-bottom: 4px;
      display: flex; align-items: center; gap: 8px;
    }
    .clausula-titulo::before {
      content: ''; display: block; width: 14px; height: 2px;
      background: ${primary}; flex-shrink: 0;
    }
    .clausula-texto { font-size: ${Math.round(14*fs)}px; color: #444; line-height: 1.8; text-align: justify; padding-left: 22px; }
    .clausula-texto strong { font-family: 'Montserrat', sans-serif; font-weight: 700; color: #111; }
    .paragrafo { font-size: ${Math.round(13*fs)}px; color: #555; line-height: 1.8; margin-top: 4px; padding-left: 36px; text-align: justify; }

    .obs {
      font-size: ${Math.round(14*fs)}px; color: #444; line-height: 1.8;
      margin-bottom: 10px; text-align: justify;
      padding: 8px 12px; background: #fafafa;
      border-left: 3px solid ${primary}; border-radius: 0 4px 4px 0;
      break-inside: avoid;
    }
    .obs strong { font-family: 'Montserrat', sans-serif; font-weight: 700; color: #111; }

    .secao-bancaria {
      background: #f8f8f8; border-radius: 6px; border: 1px solid #eee;
      padding: 14px 18px; margin: 14px 0; break-inside: avoid;
    }
    .banco-titulo {
      font-family: 'Montserrat', sans-serif; font-weight: 700;
      font-size: ${Math.round(12*fs)}px; color: #888; letter-spacing: 3px;
      text-transform: uppercase; margin-bottom: 8px;
    }
    .banco-linha { font-size: ${Math.round(14*fs)}px; color: #444; line-height: 1.9; }
    .banco-linha strong { font-family: 'Montserrat', sans-serif; font-weight: 700; color: #111; }

    .assinaturas { margin-top: 26px; padding-top: 18px; border-top: 1px solid #eee; break-inside: avoid; }
    .local-data { font-size: ${Math.round(13*fs)}px; color: #555; margin-bottom: 26px; text-align: center; font-style: italic; }

    .linha-assinatura { display: flex; justify-content: space-between; gap: 50px; margin-bottom: 26px; align-items: flex-end; }
    .assinatura-bloco { flex: 1; text-align: center; }
    .assinatura-linha { border-top: 1px solid #333; margin-bottom: 6px; }
    .assinatura-label { font-size: ${Math.round(12*fs)}px; color: #888; text-transform: uppercase; letter-spacing: 2px; }

    .testemunhas-titulo { font-family: 'Montserrat', sans-serif; font-weight: 600; font-size: ${Math.round(12*fs)}px; color: #888; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 2px; }
    .testemunhas-linha { display: flex; align-items: center; gap: 10px; margin-top: 8px; }
    .test-num { font-family: 'Montserrat', sans-serif; font-weight: 700; font-size: ${Math.round(13*fs)}px; color: #111; white-space: nowrap; }
    .test-linha { flex: 1; border-top: 1px solid #333; }

    .rodape { padding: 14px 40px; border-top: 1px solid #eee; display: flex; align-items: center; justify-content: space-between; }
    .rodape-frase { font-family: 'Montserrat', sans-serif; font-weight: 700; font-size: ${Math.round(12*fs)}px; color: ${primary}; letter-spacing: 2px; font-style: italic; }
    .rodape-hash { font-size: ${Math.round(11*fs)}px; color: #ccc; }

    .ass-dig-bloco { margin-top: 6px; padding: 6px 10px; border: 1px solid ${primary}44; border-radius: 4px; background: #fffdf5; text-align: center; }
    .ass-dig-titulo { font-family: 'Montserrat', sans-serif; font-weight: 700; font-size: ${Math.round(11*fs)}px; color: ${primary}; letter-spacing: 2px; margin-bottom: 3px; }
    .ass-dig-info { font-size: ${Math.round(12*fs)}px; color: #555; line-height: 1.6; }
    .ass-dig-codigo { font-family: 'Montserrat', sans-serif; font-size: ${Math.round(11*fs)}px; color: #aaa; margin-top: 3px; letter-spacing: 1px; word-break: break-all; }
  </style>
</head>
<body>
  <div class="pagina">
    <div class="sidebar"></div>
    <div class="main">
      <div class="header">
        <div class="header-left">
          ${logo ? `<img class="header-logo" src="data:${logoMime};base64,${logoBase64}" />` : ""}
          <div class="header-name">${escapeHtml(artist.name)}</div>
          ${artist.cnpj ? `<div class="header-cnpj">CNPJ ${escapeHtml(artist.cnpj)}</div>` : ""}
        </div>
        <div class="header-right">
          <div class="header-doc-label">Documento</div>
          <div class="header-badge">Contrato</div>
        </div>
      </div>

      <div class="corpo">
        <div class="titulo">Nota Contratual</div>

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

        <div class="clausula">
          <div class="clausula-titulo">Cláusula Primeira</div>
          <div class="clausula-texto">O CONTRATADO se obriga a prestar seu serviço de show musical na data: <strong>${escapeHtml(dataEventoBr)}.</strong></div>
        </div>
        <div class="clausula">
          <div class="clausula-titulo">Cláusula Segunda</div>
          <div class="clausula-texto">Duração de <strong>${escapeHtml(horasFormatado)} hs de show</strong>${d.horario ? `, às <strong>${escapeHtml(d.horario)}h</strong>` : ""}, no local: <strong>${escapeHtml(d.local || "")}</strong>, <strong>${escapeHtml(cidadeEstadoEvento)}</strong>.</div>
        </div>
        <div class="clausula">
          <div class="clausula-titulo">Cláusula Terceira</div>
          <div class="clausula-texto">Valor contratado: <strong>${escapeHtml(totalFmt)} (${escapeHtml(totalExt)})</strong>${backlineN > 0 ? `, sendo <strong>${escapeHtml(cacheFmt)}</strong> de cachê e <strong>${escapeHtml(backlineFmt!)}</strong> de backline` : ""}.</div>
        </div>
        <div class="clausula">
          <div class="clausula-titulo">Cláusula Quarta</div>
          <div class="clausula-texto">O artista se apresentará com os instrumentos: ${escapeHtml(instruments)}, conforme mapa de palco em anexo.</div>
        </div>
        <div class="clausula">
          <div class="clausula-titulo">Cláusula Quinta</div>
          <div class="clausula-texto">${transporteTexto}</div>
        </div>
        ${backlineN > 0 ? `
        <div class="clausula">
          <div class="clausula-titulo">Backline</div>
          <div class="clausula-texto">Backline no valor de <strong>${escapeHtml(backlineFmt!)}</strong> ficará por conta do CONTRATANTE.</div>
        </div>` : ""}
        <div class="obs"><strong>OBS.</strong> Água mineral durante a apresentação e alimentação para <strong>${pessoasBanda}</strong> pessoas ficam por conta do CONTRATANTE.</div>
        <div class="obs"><strong>OBS.</strong> Som profissional para atender o evento deverá ser fornecido pelo contratante ou pelo espaço; backline com técnico de som será fornecido pelo artista para uso próprio.</div>
        <div class="clausula">
          <div class="clausula-titulo">Cláusula Sexta</div>
          <div class="clausula-texto">O repertório ficará a critério do <strong><em>CONTRATADO, podendo incluir pedidos com antecedência de até 30 dias.</em></strong></div>
        </div>
        <div class="clausula">
          <div class="clausula-titulo">Cláusula Sétima — Rescisão</div>
          <div class="clausula-texto">Em caso de rescisão, a parte infratora indenizará a prejudicada conforme abaixo:</div>
          <div class="paragrafo">§ 1º — Multa de 10% do valor, quando a rescisão se der por escrito até 15 dias antes do evento.</div>
          <div class="paragrafo">§ 2º — Multa de 50% do valor, quando a rescisão ocorrer no dia do evento.</div>
        </div>
        <div class="clausula">
          <div class="clausula-titulo">Cláusula Oitava — Pagamento</div>
          <div class="clausula-texto">${d.formaPagamento
            ? `O CONTRATANTE efetuará o pagamento da seguinte forma: <strong>${escapeHtml(d.formaPagamento)}</strong>.`
            : "O CONTRATANTE efetuará o pagamento de 30% na assinatura do contrato e o restante até a semana que antecede o evento."
          }</div>
        </div>

        <div class="secao-bancaria">
          <div class="banco-titulo">Dados Bancários</div>
          <div class="banco-linha"><strong>Titular:</strong> ${escapeHtml(bank.titular || artist.legalName || artist.name || "")}</div>
          <div class="banco-linha"><strong>PIX:</strong> ${escapeHtml(bank.pix || artist.pixKey || "")}</div>
          <div class="banco-linha"><strong>Banco:</strong> ${escapeHtml(bank.banco || "")} &nbsp;&nbsp; <strong>Conta:</strong> ${escapeHtml(bank.conta || "")} &nbsp;&nbsp; <strong>Agência:</strong> ${escapeHtml(bank.agencia || "")}</div>
        </div>

        <div class="clausula">
          <div class="clausula-titulo">Cláusula Nona</div>
          <div class="clausula-texto">O espetáculo será interrompido se constatado comportamento inadequado do público para com o artista — neste caso o CONTRATADO não terá multa e o espetáculo será considerado realizado.</div>
        </div>
        <div class="clausula">
          <div class="clausula-titulo">Cláusula Décima</div>
          <div class="clausula-texto">Ficam sob inteira responsabilidade do CONTRATANTE os alvarás, taxas ECAD, diversões públicas e quaisquer outros necessários à realização do evento.</div>
        </div>
        <div class="clausula">
          <div class="clausula-titulo">Cláusula Décima Primeira — Foro</div>
          <div class="clausula-texto">Fica eleito o foro da Cidade de ${escapeHtml(foro)}, com exclusão de qualquer outro, para questões judiciais oriundas deste contrato.</div>
        </div>
        ${d.clausulasEspeciais ? `
        <div class="clausula">
          <div class="clausula-titulo">Cláusula Especial</div>
          <div class="clausula-texto">${escapeHtml(d.clausulasEspeciais)}</div>
        </div>` : ""}
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
  </div>
</body>
</html>`;
}

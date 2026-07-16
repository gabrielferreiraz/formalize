import crypto from "crypto";
import { escapeHtml, formatData, valorPorExtenso } from "@/lib/templates/utils";
import type { ArtistTemplateData, AssetResult } from "@/lib/templates/types";
import { getTextosCategoria } from "@/lib/templates/contrato/artist-texts";

type ArtistData = ArtistTemplateData & Record<string, any>;

export async function buildCtr006(
  artist: ArtistData,
  data: Record<string, any>,
  _pageSize?: { width: string; height: string },
  logo?: AssetResult | null,
  _background?: AssetResult | null,
): Promise<string> {
  const d = data;
  const primary = artist.primaryColor || "#8b5cf6";
  const accent = "#ec4899";
  const addr = (artist.address as any) || {};
  const bank = (artist.bankInfo as any) || {};
  const logoMime = logo?.mime || "image/png";
  const logoBase64 = logo?.base64 || "";
  const fontScale = (artist.contratoFontScale || 100) / 100;
  const logoScale = Number(artist.contratoLogoScale) || 100;
  const logoH = Math.round(60 * logoScale / 100);
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
  const textos = getTextosCategoria(artist.categoria);
  const pessoasBanda = d.pessoasBanda || textos.pessoasDefault;
  const dataEventoBr = formatData(d.data);
  const dataAssinaturaBr = d.dataAssinatura ? formatData(d.dataAssinatura) : dataEventoBr;
  const dataAssinatura = new Date().toLocaleString("pt-BR", { timeZone: "America/Campo_Grande" });
  const nomeSlug = (d.contratanteNome || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().trim();
  const hashContrato = crypto.createHash("sha256")
    .update(nomeSlug + dataEventoBr + totalFmt + Date.now().toString())
    .digest("hex").substring(0, 16).toUpperCase();

  const baseFontSize = Math.round(9.5 * fs);

  let clausulaNum = 0;
  const cl = (titulo: string, corpo: string) => {
    clausulaNum++;
    const n = String(clausulaNum).padStart(2, "0");
    return `
    <div class="clause-item">
      <div class="clause-title"><span class="neon-number">${n}</span> ${titulo}</div>
      <p>${corpo}</p>
    </div>`;
  };

  const clWithList = (titulo: string, corpo: string, lista: string[]) => {
    clausulaNum++;
    const n = String(clausulaNum).padStart(2, "0");
    return `
    <div class="clause-item">
      <div class="clause-title"><span class="neon-number">${n}</span> ${titulo}</div>
      <p>${corpo}</p>
      <ul>${lista.map(item => `<li>${item}</li>`).join("")}</ul>
    </div>`;
  };

  const clDual = (titulo1: string, corpo1: string, titulo2: string, corpo2: string) => {
    clausulaNum++;
    const n1 = String(clausulaNum).padStart(2, "0");
    clausulaNum++;
    const n2 = String(clausulaNum).padStart(2, "0");
    return `
    <div class="clause-item" style="display: flex; gap: 15px;">
      <div>
        <div class="clause-title"><span class="neon-number">${n1}</span> ${titulo1}</div>
        <p>${corpo1}</p>
      </div>
      <div>
        <div class="clause-title"><span class="neon-number">${n2}</span> ${titulo2}</div>
        <p>${corpo2}</p>
      </div>
    </div>`;
  };

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Contrato Artístico - ${escapeHtml(artist.name)}</title>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }

        @media screen {
            body {
                background-color: #4c28c4;
                display: flex;
                justify-content: center;
                align-items: flex-start;
                padding: 40px 20px;
                min-height: 100vh;
            }
            .sheet {
                width: 210mm;
                min-height: 297mm;
                box-shadow: 0 25px 60px rgba(0, 0, 0, 0.6);
            }
        }

        @media print {
            @page { size: A4; margin: 0; }
            body { background-color: transparent; padding: 0; }
            .sheet { width: 100%; height: 100vh; box-shadow: none; margin: 0; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }

        .sheet {
            background-color: #09090d;
            background-image:
                linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
            background-size: 38px 38px;
            color: #d1d5db;
            font-family: 'Plus Jakarta Sans', sans-serif;
            font-size: ${baseFontSize}px;
            line-height: 1.5;
            position: relative;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            z-index: 1;
        }

        .content-wrapper { padding: 30px 40px 20px; flex-grow: 1; display: flex; flex-direction: column; z-index: 2; }

        .neon-glow { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.5; z-index: -1; }
        .glow-top-left { top: -40px; left: -40px; width: 250px; height: 250px; background: radial-gradient(circle, rgba(59, 130, 246, 0.8) 0%, rgba(139, 92, 246, 0.4) 50%, rgba(0,0,0,0) 100%); }
        .glow-bottom-right { bottom: 10%; right: -100px; width: 300px; height: 300px; background: radial-gradient(circle, rgba(236, 72, 153, 0.7) 0%, rgba(59, 130, 246, 0.4) 60%, rgba(0,0,0,0) 100%); }

        .header-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; }
        .recipient-info h2 { font-size: ${Math.round(18 * fs)}px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px; margin-bottom: 2px; text-transform: uppercase; }
        .recipient-info p { color: #8b5cf6; font-size: ${Math.round(10 * fs)}px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;}

        .star-container { width: 60px; height: 60px; display: flex; flex-direction: column; align-items: flex-end; gap: 10px; }
        .star-svg { width: 45px; height: 45px; color: #ffffff; }
        .decor-line { width: 80px; height: 1px; background-color: rgba(255, 255, 255, 0.4); margin-bottom: 5px; }
        .date-text { color: #9ca3af; font-size: ${Math.round(9 * fs)}px; font-weight: 500; letter-spacing: 0.5px; }

        .contract-content { flex-grow: 1; }

        .preamble {
            background-color: rgba(255, 255, 255, 0.02);
            border: 1px solid rgba(255, 255, 255, 0.1);
            padding: 10px 12px;
            border-radius: 6px;
            margin-bottom: 12px;
            text-align: justify;
        }
        .preamble strong { color: #fff; }

        .clauses-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 8px;
        }
        .clause-item { text-align: justify; }
        .clause-title {
            color: #ffffff;
            font-weight: 700;
            margin-bottom: 2px;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .neon-number {
            color: #ec4899;
            font-family: monospace;
            font-size: ${Math.round(12 * fs)}px;
            font-weight: 700;
        }
        .clause-item p { display: inline; color: #d1d5db; }
        .clause-item ul { margin-top: 4px; padding-left: 15px; list-style-type: square; color: #9ca3af; }

        .cyber-box {
            background: rgba(236, 72, 153, 0.05);
            border-left: 2px solid #ec4899;
            padding: 8px 12px;
            margin-top: 5px;
            font-family: monospace;
            font-size: ${Math.round(9.5 * fs)}px;
            color: #fff;
        }

        .graphic-elements {
            display: flex; justify-content: space-between; align-items: flex-end; margin-top: 15px; padding-top: 10px;
        }
                
        .sender-block { width: 40%; text-align: center; }
        .sender-block h3 { font-size: ${Math.round(11 * fs)}px; font-weight: 700; color: #ffffff; margin: 0; }
        .sender-block p { font-size: ${Math.round(8 * fs)}px; color: #9ca3af; margin: 0; text-transform: uppercase; letter-spacing: 1px;}
        
        .sig-line { width: 100%; height: 1px; background-color: rgba(255, 255, 255, 0.3); margin-bottom: 6px; }
        .sig-label { font-size: ${Math.round(7 * fs)}px; letter-spacing: 1px; color: #9ca3af; display: block; width: 100%; }

        .plus-decorator { font-size: 24px; color: rgba(255, 255, 255, 0.3); font-weight: 300; transform: translate(0, -10px); }

        .meta-block { text-align: right; display: flex; flex-direction: column; gap: 10px; }
        .social-row { display: flex; justify-content: flex-end; gap: 8px; font-size: ${Math.round(8 * fs)}px; font-weight: 600; letter-spacing: 1px; color: #ffffff; text-transform: uppercase; }
        .circle-dot { width: 8px; height: 8px; background-color: #8b5cf6; border-radius: 50%; display: inline-block; }

        .ass-dig-bloco { margin: 0 auto 5px; padding: 6px 8px; border: 1.5px solid ${accent}44; border-radius: 5px; background: ${accent}0d; text-align: center; max-width: 180px; }
        .ass-dig-titulo { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: ${Math.round(7.5 * fs)}px; color: ${accent}; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 4px; border-bottom: 1px solid ${accent}22; padding-bottom: 3px; }
        .ass-dig-info { font-size: ${Math.round(8.5 * fs)}px; color: #64748b; line-height: 1.55; }
        .ass-dig-codigo { font-family: 'Courier New', monospace; font-size: ${Math.round(7 * fs)}px; color: #334155; margin-top: 4px; letter-spacing: 1px; }

        .rodape { padding: 14px 0 0; display: flex; align-items: center; justify-content: space-between; border-top: 1px solid rgba(255,255,255,0.05); margin-top: 20px; }
        .rodape-frase { font-size: ${Math.round(9 * fs)}px; color: ${accent}88; font-style: italic; letter-spacing: 1px; }
        .rodape-hash { font-family: 'Courier New', monospace; font-size: ${Math.round(8 * fs)}px; color: #334155; }
    </style>
</head>
<body>

    <div class="sheet">
        <div class="neon-glow glow-top-left"></div>
        <div class="neon-glow glow-bottom-right"></div>

        <div class="content-wrapper">

            <div class="header-top">
                <div class="recipient-info">
                    ${logoBase64 ? `<img src="data:${logoMime};base64,${logoBase64}" style="height:${logoH}px; max-width:200px; object-fit:contain; display:block; margin-bottom:8px;" />` : ""}
                    <h2>${escapeHtml(artist.name)}</h2>
                    <p>Contrato de Serviços · Prestação Artística</p>
                </div>

                <div class="star-container">
                    <svg class="star-svg" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M50,0 L53,37 L85,15 L63,43 L100,50 L63,57 L85,85 L53,63 L50,100 L47,63 L15,85 L37,57 L0,50 L37,43 L15,15 L47,37 Z" fill="#ffffff"/>
                    </svg>
                    <div style="text-align: right;">
                        <div class="decor-line"></div>
                        <div class="date-text">Emitido: ${escapeHtml(addr.cidade || "Campo Grande")}, ${escapeHtml(addr.estado || "MS")}</div>
                    </div>
                </div>
            </div>

            <div class="contract-content">

                <div class="preamble">
                    Pelo presente instrumento, de um lado denominado <strong>CONTRATANTE</strong>,
                    <strong>${escapeHtml(d.contratanteNome || "")}</strong>,
                    CPF/CNPJ: <strong>${escapeHtml(d.contratanteCpfCnpj || "")}</strong>,
                    RG: <strong>${escapeHtml(rgTexto)}</strong>,
                    residente na Rua: <strong>${escapeHtml(d.logradouro || "")}</strong>,
                    Nº <strong>${escapeHtml(d.numero || "")}</strong>, <strong>${escapeHtml(d.bairro || "")}</strong>,
                    CEP: <strong>${escapeHtml(d.cep || "")}</strong>, <strong>${escapeHtml(cidadeEstadoContratante)}</strong>${d.contratanteTelefone ? `, Tel: <strong>${escapeHtml(d.contratanteTelefone)}</strong>` : ""}.
                    De outro lado, <strong>"${escapeHtml(artist.name)}"</strong>, denominado <strong>CONTRATADO</strong>,
                    empresa brasileira, CNPJ: <strong>${escapeHtml(artist.cnpj || "")}</strong>,
                    com escritório na ${escapeHtml(enderecoArtista)}.
                    Têm entre si o seguinte:
                </div>

                <div class="clauses-grid">
                    ${cl("DATA DO EVENTO", `O CONTRATADO se obriga a prestar serviço de ${textos.tipoServico} em: <strong>${escapeHtml(dataEventoBr)}</strong>.`)}

                    ${cl("LOCAL E DURAÇÃO", `Duração de <strong>${escapeHtml(horasFormatado)}hs de ${textos.tipoServico}</strong>${d.horario ? `, às <strong>${escapeHtml(d.horario)}h</strong>` : ""}, no local: <strong>${escapeHtml(d.local || "")}</strong>, <strong>${escapeHtml(cidadeEstadoEvento)}</strong>.`)}

                    ${cl("VALOR CONTRATADO", `Valor de <strong>${escapeHtml(totalFmt)}</strong> (${escapeHtml(totalExt)}).${backlineN > 0 ? ` Sendo <strong>${escapeHtml(cacheFmt)}</strong> de cachê e <strong>${escapeHtml(backlineFmt!)}</strong> de backline.` : ""}`)}
                    <div class="cyber-box">
                        <div style="display: flex; justify-content: space-between;">
                            <span>COMPOSIÇÃO: Cachê (${horasFormatado}h)</span>
                            <span>TOTAL: ${escapeHtml(totalFmt)}</span>
                        </div>
                    </div>

                    ${cl(textos.formatoTitulo, textos.formatoTexto(escapeHtml(instruments)))}

                    ${clWithList("DESLOCAMENTO", transporteTexto, [
                        `OBS: Água mineral e alimentação para <strong>${pessoasBanda}</strong> pessoas ficam por conta do CONTRATANTE.`,
                        `OBS: ${textos.obsBacklineOuSom}`
                    ])}

                    ${cl("REPERTÓRIO", textos.repertorioTexto)}

                    ${cl("RESCISÃO", `Em caso de rescisão, a parte infratora indenizará a prejudicada:`)}
                    <div class="clause-item" style="margin-top: -8px;">
                        <ul>
                            <li>§ 1º — Multa de 10% do valor, rescisão por escrito até 15 dias antes do evento.</li>
                            <li>§ 2º — Multa de 50% do valor, rescisão no dia do evento.</li>
                        </ul>
                    </div>

                    ${cl("PAGAMENTO", d.formaPagamento
                        ? `O CONTRATANTE efetuará o pagamento da seguinte forma: <strong>${escapeHtml(d.formaPagamento)}</strong>.`
                        : "O CONTRATANTE efetuará o pagamento de <strong>50% na assinatura e 50% uma semana antes do evento.</strong>"
                    )}
                    <div class="cyber-box">
                        DADOS BANCÁRIOS (PIX)<br>
                        Titular: ${escapeHtml(bank.titular || artist.legalName || artist.name || "")}<br>
                        PIX/CNPJ: ${escapeHtml(bank.pix || artist.pixKey || artist.cnpj || "")}<br>
                        Banco: ${escapeHtml(bank.banco || "")} | Conta: ${escapeHtml(bank.conta || "")} | Agência: ${escapeHtml(bank.agencia || "")}
                    </div>

                    ${cl(textos.interrupcaoTitulo, textos.interrupcaoTexto)}

                    ${clDual("RESPONSABILIDADES", "Ficam sob responsabilidade do CONTRATANTE alvarás, taxas ECAD, e exigências legais.", "FORO", `Fica eleito o foro da cidade de ${escapeHtml(foro)} para questões deste contrato.`)}

                    ${d.clausulasEspeciais ? cl("CLÁUSULA ESPECIAL", escapeHtml(d.clausulasEspeciais)) : ""}
                    ${d.observacoes ? `<div class="clause-item"><p style="color: #9ca3af;"><strong>OBS:</strong> ${escapeHtml(d.observacoes)}</p></div>` : ""}
                </div>
            </div>

            <!-- Assinaturas -->
            <div class="graphic-elements">

                <div class="sender-block">
                    <div class="sig-line"></div>
                    <h3>${escapeHtml(d.contratanteNome || "Contratante")}</h3>
                    <p>Contratante</p>
                    <span class="sig-label">Assinatura Digital / Física</span>
                </div>

                <div class="plus-decorator">+</div>

                <div class="sender-block">
                    ${d.assinarDigitalmente !== false ? `
                    <div class="ass-dig-bloco">
                        <div class="ass-dig-titulo">Certificado</div>
                        <div class="ass-dig-info"><strong>${escapeHtml(artist.legalName || artist.name)}</strong></div>
                        <div class="ass-dig-info">CNPJ: ${escapeHtml(artist.cnpj || "")}</div>
                        <div class="ass-dig-info">${escapeHtml(dataAssinatura)}</div>
                        <div class="ass-dig-codigo">${hashContrato}</div>
                    </div>` : ""}
                    <div class="sig-line"></div>
                    <h3>${escapeHtml(artist.name)}</h3>
                    <p>Contratado</p>
                    <span class="sig-label">Assinatura Digital / Física</span>
                </div>

            </div>

            <div class="rodape">
                <div class="rodape-frase">${escapeHtml(d.fraseRodape || "Depois do Sim, é hora do Show")}</div>
                <div class="rodape-hash">${hashContrato}</div>
            </div>

        </div>
    </div>

</body>
</html>`;
}

import crypto from "crypto";
import { escapeHtml, formatData, valorPorExtenso } from "@/lib/templates/utils";
import type { ArtistTemplateData, AssetResult } from "@/lib/templates/types";
import { getTextosCategoria } from "@/lib/templates/contrato/artist-texts";

type ArtistData = ArtistTemplateData & Record<string, any>;

export async function buildCtr005(
  artist: ArtistData,
  data: Record<string, any>,
  _pageSize?: { width: string; height: string },
  logo?: AssetResult | null,
  _background?: AssetResult | null,
): Promise<string> {
  const d = data;
  const addr = (artist.address as any) || {};
  const bank = (artist.bankInfo as any) || {};
  const logoMime = logo?.mime || "image/png";
  const logoBase64 = logo?.base64 || "";
  const logoScale = Number(artist.contratoLogoScale) || 100;
  const logoH = Math.round(40 * logoScale / 100);
  const fontScale = (artist.contratoFontScale || 100) / 100;
  const fs = fontScale;

  const valorCache = (parseFloat(d.cache) || 0) / 100;
  const valorCacheFmt = valorCache.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });

  const backlineN = d.backline === "valor" ? (parseFloat(d.backlineValor) || 0) / 100 : 0;
  const backlineFmt = backlineN > 0
    ? backlineN.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 })
    : null;

  const transporteN = d.transporte === "valor" ? (parseFloat(d.transporteValor) || 0) / 100 : 0;
  const transporteFmt = transporteN > 0
    ? transporteN.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 })
    : null;

  const valorTotal = valorCache + backlineN + transporteN;
  const totalFmt = valorTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });
  const totalExtenso = valorPorExtenso(valorTotal);

  const transporteTexto = (d.transporte === "incluso" || !d.transporte)
    ? "O deslocamento do artista e equipe já está totalmente incluso no valor do cachê acertado."
    : `O deslocamento será cobrado à parte no valor de <strong>${transporteFmt}</strong>.`;

  const nomeSlug = (d.contratanteNome || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().trim();
  const dataEventoBr = formatData(d.data);
  const hashContrato = crypto.createHash("sha256")
    .update(nomeSlug + dataEventoBr + totalFmt + Date.now().toString())
    .digest("hex").substring(0, 16).toUpperCase();
  const dataAssinatura = new Date().toLocaleString("pt-BR", { timeZone: "America/Campo_Grande" });

  const enderecoArtista = addr.rua
    ? `${addr.rua} Nº ${addr.numero || ""}, ${addr.bairro || ""}, ${addr.cidade || ""}/${addr.estado || ""}`
    : "—";
  const foro = addr.cidade ? `${addr.cidade}-${addr.estado}` : "Campo Grande-MS";
  const textos = getTextosCategoria(artist.categoria);
  const pessoasBanda = d.pessoasBanda || textos.pessoasDefault;
  const instruments = artist.instruments || "Bateria, Percussão, Guitarra, Baixo, Sanfona";
  const rgTexto = d.contratanteRg
    ? `${d.contratanteRg}${d.contratanteOrgao ? " " + d.contratanteOrgao : ""}`
    : "—";
  const cidadeEstadoContratante = d.cidade && d.uf ? `${d.cidade}/${d.uf}` : "";
  const cidadeEstadoEvento = d.cidadeEvento || foro;
  const horasNum = d.horas || 2;
  const horasFmt = (horasNum % 1 !== 0) ? `${Math.floor(horasNum)}:30` : `${horasNum}:00`;

  const baseFontSize = Math.round(9 * fs);

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Contrato - ${escapeHtml(artist.name)}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;800;900&family=Inter:wght@300;400;500;600&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
            background-color: #d2c9bd;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 40px 0;
            margin: 0;
        }

        .sheet {
            width: 210mm;
            height: 297mm;
            min-width: 210mm;
            max-width: 210mm;
            min-height: 297mm;
            max-height: 297mm;
            background-color: #121212;
            color: #dcd6cd;
            font-family: 'Inter', sans-serif;
            font-size: ${baseFontSize}px;
            line-height: 1.45;
            position: relative;
            overflow: hidden;
            box-shadow: 0 20px 45px rgba(0, 0, 0, 0.5);
            flex-shrink: 0;
        }

        @media print {
            @page { size: A4; margin: 0; }
            body { background-color: #121212; padding: 0; }
            .sheet { box-shadow: none; margin: 0; width: 210mm; height: 297mm; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }

        .bg-frame {
            position: absolute;
            top: 0; left: 0;
            width: 100%; height: 100%;
            z-index: 1;
            pointer-events: none;
        }

        .content-wrapper {
            position: relative;
            z-index: 10;
            height: 100%;
            padding: 45px 55px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
        }

        .serif-title { font-family: 'Cinzel', serif; color: #c5a880; }
        strong { color: #ffffff; font-weight: 600; }
        .highlight-gold { color: #c5a880; }

        .header-section {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }

        .header-badge {
            width: 50px; height: 50px;
            border: 1px solid rgba(197, 168, 128, 0.4);
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            color: #c5a880;
            background: #121212;
            position: relative;
        }
        .header-badge::after {
            content: '';
            position: absolute;
            top: -3px; left: -3px; right: -3px; bottom: -3px;
            border: 1px solid rgba(197, 168, 128, 0.15);
            border-radius: 50%;
        }
        .header-badge svg { width: 22px; height: 22px; fill: currentColor; }

        .logo-centered {
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
        }
        .logo-centered img { height: ${logoH}px; max-width: 140px; object-fit: contain; }
        .crown-logo { width: 28px; height: auto; fill: #c5a880; }
        .logo-centered h1 { font-size: ${Math.round(19 * fs)}px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; }

        .metadata-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-bottom: 15px;
            border-bottom: 1px solid rgba(197, 168, 128, 0.2);
            padding-bottom: 8px;
        }
        .meta-group h3 { font-size: ${Math.round(10 * fs)}px; font-weight: 800; color: #c5a880; letter-spacing: 1px; }
        .meta-group p { font-size: ${Math.round(9.5 * fs)}px; font-weight: 700; color: #ffffff; text-transform: uppercase; }

        .intro-text {
            text-align: justify;
            margin-bottom: 15px;
            color: #b5afaa;
            font-size: ${Math.round(8.5 * fs)}px;
        }

        .clauses-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px 25px;
            margin-bottom: 10px;
        }
        .clause-full { grid-column: 1 / -1; }
        .clause { text-align: justify; }
        .clause h4 {
            font-family: 'Cinzel', serif;
            font-size: ${Math.round(9 * fs)}px;
            color: #c5a880;
            border-bottom: 1px solid rgba(197, 168, 128, 0.2);
            padding-bottom: 2px;
            margin-bottom: 4px;
            letter-spacing: 0.5px;
        }
        .clause-obs {
            font-style: italic;
            font-size: ${Math.round(7.5 * fs)}px;
            color: #b5afaa;
            margin-top: 3px;
            border-left: 1px solid #c5a880;
            padding-left: 6px;
        }

        .vintage-box {
            border: 1px solid rgba(197, 168, 128, 0.3);
            background: rgba(197, 168, 128, 0.02);
            padding: 8px;
            margin-top: 5px;
        }
        .vintage-row { display: flex; justify-content: space-between; margin-bottom: 2px; }
        .row-total {
            border-top: 1px dashed rgba(197, 168, 128, 0.4);
            padding-top: 3px;
            margin-top: 3px;
            font-weight: 700;
            color: #ffffff;
        }

        .signatures-container {
            display: flex;
            justify-content: space-between;
            margin-top: 15px;
            padding: 0 10px;
        }
        .sig-box { width: 42%; text-align: center; }
        .sig-line { width: 100%; height: 1px; background-color: rgba(197, 168, 128, 0.4); margin-bottom: 4px; }
        .sig-box p { font-family: 'Cinzel', serif; font-size: ${Math.round(8.5 * fs)}px; color: #ffffff; font-weight: 700; }
        .sig-box span { font-size: ${Math.round(7 * fs)}px; color: #c5a880; text-transform: uppercase; letter-spacing: 1px; }

        .ass-dig-bloco { margin: 0 auto 4px; padding: 4px 6px; border: 1px solid rgba(197, 168, 128, 0.3); background: rgba(197, 168, 128, 0.05); text-align: center; }
        .ass-dig-titulo { font-family: 'Cinzel', serif; font-weight: 700; font-size: ${Math.round(6.5 * fs)}px; color: #c5a880; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 3px; border-bottom: 1px solid rgba(197,168,128,0.2); padding-bottom: 2px; }
        .ass-dig-info { font-size: ${Math.round(7.5 * fs)}px; color: #b5afaa; line-height: 1.5; }
        .ass-dig-codigo { font-family: 'Courier New', monospace; font-size: ${Math.round(6 * fs)}px; color: #c5a88088; margin-top: 3px; letter-spacing: 1px; }

        .footer-boxes {
            display: flex;
            flex-direction: column;
            gap: 4px;
            margin-top: 15px;
        }
        .footer-box {
            border: 1px solid rgba(197, 168, 128, 0.25);
            padding: 5px;
            text-align: center;
            font-family: 'Cinzel', serif;
            font-size: ${Math.round(7.5 * fs)}px;
            color: #c5a880;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            background: rgba(197, 168, 128, 0.01);
            display: flex;
            justify-content: center;
            gap: 20px;
        }
    </style>
</head>
<body>

    <div class="sheet">

        <!-- Moldura Vetorial Dourada -->
        <svg class="bg-frame" viewBox="0 0 210 297" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="8" y="8" width="194" height="281" stroke="#c5a880" stroke-width="0.4"/>
            <path d="M 24 14 L 186 14 L 196 24 L 196 273 L 186 283 L 24 283 L 14 273 L 14 24 Z" stroke="#c5a880" stroke-width="0.25"/>
            <path d="M 8 24 L 24 8" stroke="#c5a880" stroke-width="0.25"/>
            <path d="M 202 24 L 186 8" stroke="#c5a880" stroke-width="0.25"/>
            <path d="M 8 273 L 24 289" stroke="#c5a880" stroke-width="0.25"/>
            <path d="M 202 273 L 186 289" stroke="#c5a880" stroke-width="0.25"/>
        </svg>

        <div class="content-wrapper">

            <!-- Cabeçalho -->
            <div class="header-section">
                <div class="header-badge">
                    <svg viewBox="0 0 24 24">
                        <path d="M12,2A3,3 0 0,0 9,5V11A3,3 0 0,0 12,14A3,3 0 0,0 15,11V5A3,3 0 0,0 12,2M19,11C19,14.53 16.39,17.44 13,17.93V21H11V17.93C7.61,17.44 5,14.53 5,11H7A5,5 0 0,0 12,16A5,5 0 0,0 17,11H19Z"/>
                    </svg>
                </div>

                <div class="logo-centered">
                    ${logoBase64
                      ? `<img src="data:${logoMime};base64,${logoBase64}" />`
                      : `<svg class="crown-logo" viewBox="0 0 100 50"><path d="M10,40 L20,10 L40,25 L50,5 L60,25 L80,10 L90,40 Z M10,43 H90 V46 H10 Z"/></svg>`
                    }
                    <h1 class="serif-title">${escapeHtml(artist.name.toUpperCase())}</h1>
                </div>

                <div class="header-badge">
                    <svg viewBox="0 0 24 24">
                        <path d="M20,2H18V4H20V2M16,6H14V8H16V6M21.5,12.5L20.1,11.1C19,12.2 17.5,12.8 15.9,12.8C14.3,12.8 12.8,12.2 11.7,11.1C10.6,10 10,8.5 10,6.9C10,5.3 10.6,3.8 11.7,2.7L10.3,1.3C8.8,2.8 8,4.8 8,6.9C8,8.4 8.4,9.8 9.2,11L2,18.2V22H5.8L13,14.8C14.2,15.6 15.6,16 17.1,16C19.2,16 21.2,15.2 22.7,13.7L21.5,12.5Z"/>
                    </svg>
                </div>
            </div>

            <!-- Metadados TO / DATE -->
            <div class="metadata-row">
                <div class="meta-group">
                    <h3>TO:</h3>
                    <p class="serif-title">${escapeHtml(d.contratanteNome || "")}</p>
                </div>
                <div class="meta-group" style="text-align: right;">
                    <h3>DATE:</h3>
                    <p class="serif-title">${escapeHtml(dataEventoBr).replace(/\//g, " / ")}</p>
                </div>
            </div>

            <!-- Qualificação das Partes -->
            <div class="intro-text">
                <p>Pelo presente instrumento, de um lado denominado <strong class="highlight-gold">CONTRATANTE</strong>, <strong>${escapeHtml(d.contratanteNome || "")}</strong>, CPF/CNPJ: ${escapeHtml(d.contratanteCpfCnpj || "")}, RG: ${escapeHtml(rgTexto)}, residente na ${escapeHtml(d.logradouro || "")}, Nº ${escapeHtml(d.numero || "")}, ${escapeHtml(d.bairro || "")}, ${escapeHtml(cidadeEstadoContratante)}. De outro lado, denominado <strong class="highlight-gold">CONTRATADO</strong>, <strong>"${escapeHtml(artist.name)}"</strong>, CNPJ: ${escapeHtml(artist.cnpj || "")}, com escritório na ${escapeHtml(enderecoArtista)}, têm entre si o seguinte ajustado:</p>
            </div>

            <!-- Grade das Cláusulas -->
            <div class="clauses-grid">

                <!-- Coluna Esquerda -->
                <div>
                    <div class="clause">
                        <h4>01 DATA DO EVENTO</h4>
                        <p>O CONTRATADO se obriga a prestar serviço de ${textos.tipoServico} em: <strong>${escapeHtml(dataEventoBr)}</strong>.</p>
                    </div>

                    <div class="clause" style="margin-top: 8px;">
                        <h4>02 LOCAL E DURAÇÃO</h4>
                        <p>Duração de <strong>${escapeHtml(horasFmt)}hs de ${textos.tipoServico}</strong>${d.horario ? `, às <strong>${escapeHtml(d.horario)}h</strong>` : ""}, no local: <strong>${escapeHtml(d.local || "")}</strong>, <strong>${escapeHtml(cidadeEstadoEvento)}</strong>.</p>
                    </div>

                    <div class="clause" style="margin-top: 8px;">
                        <h4>03 VALOR CONTRATADO</h4>
                        <p>Valor de <strong>${escapeHtml(totalFmt)}</strong> (${escapeHtml(totalExtenso)}).</p>
                        <div class="vintage-box">
                            <div class="vintage-row" style="color: #c5a880; font-size: 7px;"><span>DETALHAMENTO</span></div>
                            <div class="vintage-row"><span>Cachê Artístico (${horasFmt}h)</span> <span>${escapeHtml(valorCacheFmt)}</span></div>
                            ${backlineN > 0 ? `<div class="vintage-row"><span>Backline</span> <span>${escapeHtml(backlineFmt!)}</span></div>` : ""}
                            ${transporteN > 0 ? `<div class="vintage-row"><span>Transporte</span> <span>${escapeHtml(transporteFmt!)}</span></div>` : ""}
                            <div class="vintage-row row-total"><span>TOTAL</span> <span>${escapeHtml(totalFmt)}</span></div>
                        </div>
                    </div>

                    <div class="clause" style="margin-top: 8px;">
                        <h4>04 ${textos.formatoTitulo}</h4>
                        <p>${textos.formatoTexto(escapeHtml(instruments))}</p>
                    </div>
                </div>

                <!-- Coluna Direita -->
                <div>
                    <div class="clause">
                        <h4>05 DESLOCAMENTO / LOGÍSTICA</h4>
                        <p>${transporteTexto}</p>
                        <p class="clause-obs">OBS. Alimentação e água mineral para a equipe (${pessoasBanda} pessoas) são de responsabilidade do CONTRATANTE.</p>
                        <p class="clause-obs">OBS. ${textos.obsBacklineOuSom}</p>
                    </div>

                    <div class="clause" style="margin-top: 8px;">
                        <h4>06 REPERTÓRIO</h4>
                        <p>${textos.repertorioTexto}</p>
                    </div>

                    <div class="clause" style="margin-top: 8px;">
                        <h4>07 CLÁUSULA DE RESCISÃO</h4>
                        <p>Aplica-se indenização em caso de desistência imotivada:</p>
                        <p style="font-size: ${Math.round(7.5 * fs)}px; margin-top: 2px;">§ 1º — Multa de 10% (rescisão por escrito até 15 dias antes).</p>
                        <p style="font-size: ${Math.round(7.5 * fs)}px;">§ 2º — Multa de 50% (rescisão solicitada no dia do show).</p>
                    </div>

                    <div class="clause" style="margin-top: 8px;">
                        <h4>09 ${textos.interrupcaoTitulo}</h4>
                        <p>${textos.interrupcaoTexto}</p>
                    </div>
                </div>

                <!-- Pagamento (Largura Total) -->
                <div class="clause clause-full">
                    <h4>08 CONDIÇÕES DE PAGAMENTO</h4>
                    <p>O CONTRATANTE efetuará o pagamento da seguinte forma: <strong>${d.formaPagamento ? escapeHtml(d.formaPagamento) : "50% na assinatura e 50% uma semana antes do evento."}</strong></p>
                    <div class="vintage-box" style="display: flex; justify-content: space-between;">
                        <div>
                            <p style="color:#c5a880; font-size: 7px; margin-bottom: 2px;">DADOS PARA TRANSFERÊNCIA (PIX)</p>
                            <p><strong>Titular:</strong> ${escapeHtml(bank.titular || artist.legalName || artist.name || "")} &nbsp;|&nbsp; <strong>CNPJ:</strong> ${escapeHtml(bank.pix || artist.pixKey || artist.cnpj || "")}</p>
                        </div>
                        <div style="text-align: right;">
                            <p style="color:#c5a880; font-size: 7px; margin-bottom: 2px;">CONTA BANCÁRIA</p>
                            <p><strong>Banco:</strong> ${escapeHtml(bank.banco || "")} &nbsp;|&nbsp; <strong>C.C:</strong> ${escapeHtml(bank.agencia || "")} / ${escapeHtml(bank.conta || "")}</p>
                        </div>
                    </div>
                </div>

                <!-- Responsabilidade e Foro -->
                <div class="clause clause-full" style="display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 20px;">
                    <div>
                        <h4>10 RESPONSABILIDADES LEGAIS</h4>
                        <p>Ficam sob encargo exclusivo do CONTRATANTE alvarás, taxas de licenciamento, ECAD e demais obrigações legais do local.</p>
                    </div>
                    <div>
                        <h4>11 FORO ELEITO</h4>
                        <p>Fica eleito o foro da comarca de ${escapeHtml(foro)} para dirimir quaisquer controvérsias deste contrato.</p>
                    </div>
                </div>

                ${d.clausulasEspeciais ? `
                <div class="clause clause-full">
                    <h4>12 CLÁUSULA ESPECIAL</h4>
                    <p>${escapeHtml(d.clausulasEspeciais)}</p>
                </div>` : ""}

            </div>

            <!-- Área de Assinatura -->
            <div class="signatures-container">
                <div class="sig-box">
                    ${d.assinarDigitalmente !== false ? `<div style="visibility:hidden; margin-bottom:4px; padding:4px 6px; border:1px solid transparent; font-size:${Math.round(7.5 * fs)}px; line-height:1.5;"><div style="font-size:${Math.round(6.5 * fs)}px; margin-bottom:3px; padding-bottom:2px;">placeholder</div><div>placeholder</div><div>placeholder</div><div>placeholder</div><div style="font-size:${Math.round(6 * fs)}px; margin-top:3px;">hash</div></div>` : ""}
                    <div class="sig-line"></div>
                    <p>${escapeHtml(d.contratanteNome || "Contratante")}</p>
                    <span>Contratante</span>
                </div>
                <div class="sig-box">
                    ${d.assinarDigitalmente !== false ? `
                    <div class="ass-dig-bloco">
                        <div class="ass-dig-titulo">Certificado de Assinatura</div>
                        <div class="ass-dig-info"><strong>${escapeHtml(artist.legalName || artist.name)}</strong></div>
                        <div class="ass-dig-info">CNPJ: ${escapeHtml(artist.cnpj || "")}</div>
                        <div class="ass-dig-info">${escapeHtml(dataAssinatura)}</div>
                        <div class="ass-dig-codigo">${hashContrato}</div>
                    </div>` : ""}
                    <div class="sig-line"></div>
                    <p>${escapeHtml(artist.legalName || artist.name)}</p>
                    <span>Contratado</span>
                </div>
            </div>

            <!-- Rodapé -->
            <div class="footer-boxes">
                <div class="footer-box">
                    <span>TELEFONE: ${escapeHtml(artist.whatsapp || "")}</span>
                    <span>|</span>
                    <span>EMAIL: ${escapeHtml(artist.website || "")}</span>
                </div>
                <div class="footer-box" style="letter-spacing: 2px; font-weight: 700;">
                    <span>${escapeHtml(artist.name.toUpperCase())}</span>
                </div>
            </div>

        </div>
    </div>

</body>
</html>`;
}

import crypto from "crypto";
import { escapeHtml, formatData, valorPorExtenso } from "@/lib/templates/utils";
import type { ArtistTemplateData, AssetResult } from "@/lib/templates/types";
import { getTextosCategoria } from "@/lib/templates/contrato/artist-texts";

type ArtistData = ArtistTemplateData & Record<string, any>;

export async function buildCtr002(
  artist: ArtistData,
  data: Record<string, any>,
  _pageSize?: { width: string; height: string },
  logo?: AssetResult | null,
): Promise<string> {
  const d = data;
  const addr = (artist.address as any) || {};
  const bank = (artist.bankInfo as any) || {};
  const logoMime = logo?.mime || "image/png";
  const logoBase64 = logo?.base64 || "";
  const logoScale = Number(artist.contratoLogoScale) || 100;
  const logoH = Math.round(50 * logoScale / 100);
  const fontScale = (artist.contratoFontScale || 100) / 100;
  const fs = fontScale;

  const valorCache = (parseFloat(d.cache) || 0) / 100;
  const valorCacheFormatado = valorCache.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });

  const backlineNumerico = d.backline === "valor" ? (parseFloat(d.backlineValor) || 0) / 100 : 0;
  const backlineFormatado = backlineNumerico > 0
    ? backlineNumerico.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 })
    : null;

  const transporteNumerico = d.transporte === "valor" ? (parseFloat(d.transporteValor) || 0) / 100 : 0;
  const transporteFormatado = transporteNumerico > 0
    ? transporteNumerico.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 })
    : null;

  const valorTotal = valorCache + backlineNumerico + transporteNumerico;
  const valorTotalFormatado = valorTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });
  const valorTotalExtenso = valorPorExtenso(valorTotal);

  const transporteTexto = (d.transporte === "incluso" || !d.transporte)
    ? "O deslocamento do artista e equipe já está incluso no valor do cachê."
    : `O deslocamento do artista e equipe será cobrado à parte no valor de <strong>${transporteFormatado}</strong>.`;

  const nomeSlug = (d.contratanteNome || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().trim();
  const dataEventoBr = formatData(d.data);
  const hashContrato = crypto.createHash("sha256")
    .update(nomeSlug + dataEventoBr + valorTotalFormatado + Date.now().toString())
    .digest("hex").substring(0, 16).toUpperCase();
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

  const baseFontSize = Math.round(9.5 * fs);

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Contrato - ${escapeHtml(artist.name)}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&family=Inter:wght@400;500;600&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        @media screen {
            body {
                background-color: #d1d5db;
                display: flex; justify-content: center; align-items: flex-start;
                padding: 40px 20px; min-height: 100vh;
            }
            .sheet {
                width: 210mm; min-height: 297mm;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
            }
        }

        @media print {
            @page { size: A4; margin: 0; }
            body { background-color: transparent; padding: 0; }
            .sheet { width: 100%; height: 100vh; box-shadow: none; margin: 0; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }

        .sheet {
            background-color: #ffffff;
            color: #1f2937;
            font-family: 'Inter', sans-serif;
            font-size: ${baseFontSize}px;
            line-height: 1.5;
            position: relative;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }

        .geo-corner {
            position: absolute;
            pointer-events: none;
            z-index: 10;
        }
        .top-left { top: 0; left: 0; width: 350px; height: 200px; }
        .bottom-right { bottom: 0; right: 0; width: 350px; height: 200px; }

        .content-wrapper {
            padding: 70px 50px 40px 50px;
            flex-grow: 1;
            display: flex;
            flex-direction: column;
            z-index: 5;
            position: relative;
        }

        .header-block {
            display: flex;
            justify-content: flex-end;
            align-items: center;
            margin-bottom: 40px;
        }

        .logo-area {
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        .logo-area img {
            height: ${logoH}px;
            max-width: 160px;
            object-fit: contain;
            margin-bottom: 6px;
        }

        .logo-area h1 {
            font-family: 'Montserrat', sans-serif;
            font-size: ${Math.round(20 * fs)}px;
            font-weight: 800;
            color: #111827;
            letter-spacing: 1px;
            text-transform: uppercase;
        }

        .logo-area p {
            font-family: 'Montserrat', sans-serif;
            font-size: ${Math.round(8 * fs)}px;
            font-weight: 600;
            letter-spacing: 3px;
            color: #6b7280;
            text-transform: uppercase;
        }

        .parties-info {
            border-left: 3px solid #111827;
            padding-left: 15px;
            margin-bottom: 25px;
            text-align: justify;
        }

        .parties-info p { margin-bottom: 8px; }
        .parties-info p:last-child { margin-bottom: 0; }

        .parties-info strong {
            font-family: 'Montserrat', sans-serif;
            color: #111827;
            font-size: ${Math.round(10 * fs)}px;
        }

        .clauses-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px 30px;
            flex-grow: 1;
        }

        .clause-full { grid-column: 1 / -1; }

        .clause { text-align: justify; }

        .clause h4 {
            font-family: 'Montserrat', sans-serif;
            font-size: ${Math.round(10 * fs)}px;
            font-weight: 700;
            color: #111827;
            margin-bottom: 5px;
            display: flex;
            align-items: center;
            gap: 5px;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 3px;
        }

        .clause h4 span {
            color: #111827;
            font-weight: 800;
        }

        .clause-obs {
            color: #4b5563;
            font-style: italic;
            font-size: ${Math.round(9 * fs)}px;
            margin-top: 4px;
            background: #f9fafb;
            padding: 4px 6px;
            border-left: 2px solid #9ca3af;
        }

        .data-box {
            border: 1px solid #e5e7eb;
            padding: 8px 10px;
            margin-top: 6px;
            border-radius: 2px;
        }

        .data-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 4px;
        }

        .data-row:last-child { margin-bottom: 0; }

        .total-row {
            border-top: 1px solid #d1d5db;
            padding-top: 4px;
            margin-top: 4px;
            font-weight: 700;
            font-size: ${Math.round(10.5 * fs)}px;
            font-family: 'Montserrat', sans-serif;
        }

        .bank-info {
            display: flex; justify-content: space-between;
        }
        .bank-info p { margin-bottom: 2px; }

        .footer-section {
            margin-top: 20px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            padding-bottom: 20px;
        }

        .contact-info {
            display: flex;
            flex-direction: column;
            gap: 8px;
            font-size: ${Math.round(8 * fs)}px;
            color: #4b5563;
            font-weight: 500;
        }
        .contact-item { display: flex; align-items: center; gap: 8px; }

        .signatures {
            display: flex;
            gap: 70px;
            text-align: center;
            margin-right: 200px;
        }

        .sig-block { width: 180px; }
        .sig-line { width: 100%; height: 1px; background-color: #111827; margin-bottom: 5px; }
        .sig-block h5 { font-family: 'Montserrat', sans-serif; font-size: ${Math.round(10 * fs)}px; font-weight: 700; color: #111827; }
        .sig-block p { font-size: ${Math.round(8 * fs)}px; color: #6b7280; letter-spacing: 1px; text-transform: uppercase; }

        .ass-dig-bloco { margin: 0 auto 5px; padding: 5px 7px; border: 1px solid #11182733; border-radius: 4px; background: #fafafa; text-align: center; max-width: 160px; }
        .ass-dig-titulo { font-family: 'Montserrat', sans-serif; font-weight: 700; font-size: ${Math.round(6.5 * fs)}px; color: #111827; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 3px; border-bottom: 1px solid #11182722; padding-bottom: 2px; }
        .ass-dig-info { font-size: ${Math.round(7.5 * fs)}px; color: #555; line-height: 1.5; }
        .ass-dig-codigo { font-family: 'Courier New', monospace; font-size: ${Math.round(6 * fs)}px; color: #bbb; margin-top: 3px; letter-spacing: 1px; }
    </style>
</head>
<body>

    <div class="sheet">

        <!-- Grafismo Superior Esquerdo -->
        <div class="geo-corner top-left">
            <svg width="100%" height="100%" viewBox="0 0 350 200" fill="none">
                <polygon points="0,0 200,0 0,150" fill="#1a1a1a" />
                <line x1="-10" y1="120" x2="220" y2="-10" stroke="#ffffff" stroke-width="12" />
                <line x1="-10" y1="145" x2="250" y2="-10" stroke="#1a1a1a" stroke-width="5" />
                <line x1="80" y1="50" x2="330" y2="50" stroke="#1a1a1a" stroke-width="8" />
                <line x1="120" y1="35" x2="280" y2="35" stroke="#1a1a1a" stroke-width="2" />
            </svg>
        </div>

        <!-- Grafismo Inferior Direito -->
        <div class="geo-corner bottom-right">
            <svg width="100%" height="100%" viewBox="0 0 350 200" fill="none">
                <polygon points="350,200 150,200 350,50" fill="#1a1a1a" />
                <line x1="360" y1="80" x2="130" y2="210" stroke="#ffffff" stroke-width="12" />
                <line x1="360" y1="55" x2="100" y2="210" stroke="#1a1a1a" stroke-width="5" />
                <line x1="270" y1="150" x2="20" y2="150" stroke="#1a1a1a" stroke-width="8" />
                <line x1="230" y1="165" x2="70" y2="165" stroke="#1a1a1a" stroke-width="2" />
            </svg>
        </div>

        <div class="content-wrapper">

            <!-- Logo e Cabeçalho (alinhado à direita) -->
            <div class="header-block">
                <div class="logo-area">
                    ${logoBase64 ? `<img src="data:${logoMime};base64,${logoBase64}" />` : ""}
                    <h1>${escapeHtml(artist.name)}</h1>
                    <p>Prestação de Serviços Artísticos</p>
                </div>
            </div>

            <!-- Qualificação das Partes -->
            <div class="parties-info">
                <p>Pelo presente instrumento, de um lado denominado <strong>CONTRATANTE</strong>, <strong>${escapeHtml(d.contratanteNome || "")}</strong>, CPF/CNPJ: ${escapeHtml(d.contratanteCpfCnpj || "")}, RG: ${escapeHtml(rgTexto)}, residente na Rua: ${escapeHtml(d.logradouro || "")}, Nº ${escapeHtml(d.numero || "")}, ${escapeHtml(d.bairro || "")}, CEP: ${escapeHtml(d.cep || "")}, ${escapeHtml(cidadeEstadoContratante)}${d.contratanteTelefone ? `, Tel: ${escapeHtml(d.contratanteTelefone)}` : ""}.</p>
                <p>De outro lado, <strong>"${escapeHtml(artist.name)}"</strong>, denominado <strong>CONTRATADO</strong>, empresa brasileira, CNPJ: ${escapeHtml(artist.cnpj || "")}, com escritório na ${escapeHtml(enderecoArtista)}, têm entre si o seguinte:</p>
            </div>

            <!-- Cláusulas do Contrato -->
            <div class="clauses-grid">

                <!-- Coluna Esquerda -->
                <div>
                    <div class="clause">
                        <h4><span>01.</span> DATA DO EVENTO</h4>
                        <p>O CONTRATADO se obriga a prestar serviço de ${textos.tipoServico} em: <strong>${escapeHtml(dataEventoBr)}</strong>.</p>
                    </div>

                    <div class="clause" style="margin-top: 15px;">
                        <h4><span>02.</span> LOCAL E DURAÇÃO</h4>
                        <p>Duração de <strong>${escapeHtml(horasFormatado)}hs de ${textos.tipoServico}</strong>${d.horario ? `, às <strong>${escapeHtml(d.horario)}h</strong>` : ""}, no local: <strong>${escapeHtml(d.local || "")}</strong>, <strong>${escapeHtml(cidadeEstadoEvento)}</strong>.</p>
                    </div>

                    <div class="clause" style="margin-top: 15px;">
                        <h4><span>03.</span> VALOR CONTRATADO</h4>
                        <p>Valor de <strong>${escapeHtml(valorTotalFormatado)}</strong> (${escapeHtml(valorTotalExtenso)}).</p>
                        <div class="data-box">
                            <div class="data-row" style="color:#6b7280; font-size:8px;"><span>COMPOSIÇÃO DO VALOR</span></div>
                            <div class="data-row"><span>Cachê (${horasFormatado}h)</span> <span>${escapeHtml(valorCacheFormatado)}</span></div>
                            ${backlineNumerico > 0 ? `<div class="data-row"><span>Backline</span> <span>${escapeHtml(backlineFormatado!)}</span></div>` : ""}
                            ${transporteNumerico > 0 ? `<div class="data-row"><span>Transporte</span> <span>${escapeHtml(transporteFormatado!)}</span></div>` : ""}
                            <div class="data-row total-row"><span>TOTAL</span> <span>${escapeHtml(valorTotalFormatado)}</span></div>
                        </div>
                    </div>

                    <div class="clause" style="margin-top: 15px;">
                        <h4><span>04.</span> ${textos.formatoTitulo}</h4>
                        <p>${textos.formatoTexto(escapeHtml(instruments))}</p>
                    </div>

                    <div class="clause" style="margin-top: 15px;">
                        <h4><span>07.</span> RESCISÃO</h4>
                        <p>Em caso de rescisão, a parte infratora indenizará a prejudicada:</p>
                        <ul style="margin-left: 15px; margin-top: 4px;">
                            <li>§ 1º — Multa de 10% do valor (rescisão por escrito até 15 dias antes).</li>
                            <li>§ 2º — Multa de 50% do valor (rescisão no dia do evento).</li>
                        </ul>
                    </div>
                </div>

                <!-- Coluna Direita -->
                <div>
                    <div class="clause">
                        <h4><span>05.</span> DESLOCAMENTO</h4>
                        <p>${transporteTexto}</p>
                        <p class="clause-obs">OBS. Água mineral e alimentação para ${pessoasBanda} pessoas ficam por conta do CONTRATANTE.</p>
                        <p class="clause-obs">OBS. ${textos.obsBacklineOuSom}</p>
                    </div>

                    <div class="clause" style="margin-top: 15px;">
                        <h4><span>06.</span> REPERTÓRIO</h4>
                        <p>${textos.repertorioTexto}</p>
                    </div>

                    <div class="clause" style="margin-top: 15px;">
                        <h4><span>09.</span> ${textos.interrupcaoTitulo}</h4>
                        <p>${textos.interrupcaoTexto}</p>
                    </div>

                    <div class="clause" style="margin-top: 15px;">
                        <h4><span>10.</span> RESPONSABILIDADES</h4>
                        <p>Ficam sob responsabilidade do CONTRATANTE alvarás, taxas ECAD, diversões públicas e demais exigências legais para realização do evento.</p>
                    </div>
                </div>

                <!-- Cláusulas Largas -->
                <div class="clause clause-full">
                    <h4><span>08.</span> PAGAMENTO</h4>
                    <p>O CONTRATANTE efetuará o pagamento da seguinte forma: <strong>${d.formaPagamento ? escapeHtml(d.formaPagamento) : "50% na assinatura e 50% uma semana antes do evento."}</strong></p>
                    <div class="data-box bank-info">
                        <div>
                            <p style="color:#6b7280; font-size:8px; margin-bottom:4px;">DADOS BANCÁRIOS</p>
                            <p><strong>Titular:</strong> ${escapeHtml(bank.titular || artist.legalName || artist.name || "")}</p>
                            <p><strong>PIX (CNPJ):</strong> ${escapeHtml(bank.pix || artist.pixKey || artist.cnpj || "")}</p>
                        </div>
                        <div style="text-align: right;">
                            <p style="color:#ffffff; font-size:8px; margin-bottom:4px;">-</p>
                            <p><strong>Banco:</strong> ${escapeHtml(bank.banco || "")}</p>
                            <p><strong>Agência:</strong> ${escapeHtml(bank.agencia || "")} | <strong>Conta:</strong> ${escapeHtml(bank.conta || "")}</p>
                        </div>
                    </div>
                </div>

                <div class="clause clause-full">
                    <h4><span>11.</span> FORO</h4>
                    <p>Fica eleito o foro da cidade de ${escapeHtml(foro)} para questões oriundas deste contrato.</p>
                </div>

                ${d.clausulasEspeciais ? `
                <div class="clause clause-full">
                    <h4><span>12.</span> CLÁUSULA ESPECIAL</h4>
                    <p>${escapeHtml(d.clausulasEspeciais)}</p>
                </div>` : ""}
                ${d.observacoes ? `
                <div class="clause clause-full">
                    <p class="clause-obs"><strong>OBS:</strong> ${escapeHtml(d.observacoes)}</p>
                </div>` : ""}

            </div>

            <!-- Rodapé e Assinaturas -->
            <div class="footer-section">
                <div class="contact-info">
                    <div class="contact-item">
                        <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                        ${escapeHtml(artist.whatsapp || "(67) 9999-0000")}
                    </div>
                    <div class="contact-item">
                        <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                        ${escapeHtml(artist.website || "contato@artista.com.br")}
                    </div>
                    <div class="contact-item">
                        <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                        ${escapeHtml(addr.cidade || "Campo Grande")}, ${escapeHtml(addr.estado || "MS")}
                    </div>
                </div>

                <div class="signatures">
                    <div class="sig-block">
                        ${d.assinarDigitalmente !== false ? `<div style="visibility:hidden; margin-bottom:5px; padding:5px 7px; border:1px solid transparent; border-radius:4px; font-size:${Math.round(7.5 * fs)}px; line-height:1.5;">
                            <div style="font-size:${Math.round(6.5 * fs)}px; margin-bottom:3px; padding-bottom:2px;">Certificado</div>
                            <div>placeholder</div>
                            <div>placeholder</div>
                            <div>placeholder</div>
                            <div style="font-size:${Math.round(6 * fs)}px; margin-top:3px;">hash</div>
                        </div>` : ""}
                        <div class="sig-line"></div>
                        <h5>${escapeHtml((d.contratanteNome || "Contratante").toUpperCase())}</h5>
                        <p>Contratante</p>
                    </div>
                    <div class="sig-block">
                        ${d.assinarDigitalmente !== false ? `
                        <div class="ass-dig-bloco">
                            <div class="ass-dig-titulo">Certificado</div>
                            <div class="ass-dig-info"><strong>${escapeHtml(artist.legalName || artist.name)}</strong></div>
                            <div class="ass-dig-info">CNPJ: ${escapeHtml(artist.cnpj || "")}</div>
                            <div class="ass-dig-info">${escapeHtml(dataAssinatura)}</div>
                            <div class="ass-dig-codigo">${hashContrato}</div>
                        </div>` : ""}
                        <div class="sig-line"></div>
                        <h5>${escapeHtml(artist.name.toUpperCase())}</h5>
                        <p>Contratado</p>
                    </div>
                </div>
            </div>

        </div>
    </div>

</body>
</html>`;
}

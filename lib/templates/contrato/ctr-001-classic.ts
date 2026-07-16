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
    ? "O deslocamento do artista e equipe já está incluso no valor do cachê, conforme combinado."
    : `O deslocamento do artista e equipe será cobrado à parte no valor de <strong>${transporteFormatado}</strong>, conforme combinado.`;

  const nomeSlug = (d.contratanteNome || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().trim();
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

  const baseFontSize = Math.round(9.5 * fs);

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Contrato - ${escapeHtml(artist.name)}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@1,600;1,700&display=swap" rel="stylesheet">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }

        @media screen {
            body {
                background-color: #9c8e82;
                display: flex; justify-content: center; align-items: flex-start;
                padding: 40px 20px; min-height: 100vh;
            }
            .sheet {
                width: 210mm; min-height: 297mm;
                box-shadow: 0 15px 40px rgba(0, 0, 0, 0.4);
            }
        }

        @media print {
            @page { size: A4; margin: 0; }
            body { background-color: transparent; padding: 0; }
            .sheet { width: 100%; height: 100vh; box-shadow: none; margin: 0; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }

        .sheet {
            background-color: #f5f5f5;
            color: #2b2b2b;
            font-family: 'Inter', sans-serif;
            font-size: ${baseFontSize}px;
            line-height: 1.4;
            position: relative;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }

        .content-wrapper {
            padding: 40px 50px 60px 50px;
            flex-grow: 1;
            display: flex;
            flex-direction: column;
        }

        .header-block {
            position: absolute; top: 0; left: 0;
            background-color: #2d2d2d; color: #ffffff;
            width: 320px; padding: 30px 40px 20px 50px;
            border-bottom-right-radius: 60px; z-index: 2;
        }
        .header-block h1 { font-size: ${Math.round(22 * fs)}px; font-weight: 300; margin-bottom: 2px; letter-spacing: 1px; }
        .header-block h1 span { font-family: 'Playfair Display', serif; font-style: italic; font-weight: 700; }
        .header-block p { font-size: ${Math.round(9 * fs)}px; font-weight: 600; letter-spacing: 2px; color: #a3a3a3; text-transform: uppercase; }
        .header-logo { height: ${logoH}px; max-width: 180px; object-fit: contain; display: block; margin-bottom: 10px; }

        .contract-body { margin-top: ${140 + logoH}px; flex-grow: 1; }

        .parties-info {
            background: #e5e5e5;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            text-align: justify;
        }
        .parties-info p { margin-bottom: 8px; }
        .parties-info p:last-child { margin-bottom: 0; }

        .clauses-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px 25px;
        }

        .clause-full { grid-column: 1 / -1; }

        .clause { margin-bottom: 8px; text-align: justify; }
        .clause h4 {
            font-size: ${Math.round(10 * fs)}px; font-weight: 700; color: #111;
            margin-bottom: 4px; display: flex; align-items: center; gap: 6px;
        }
        .clause h4 span {
            background: #2d2d2d; color: #fff; padding: 2px 5px;
            border-radius: 3px; font-size: ${Math.round(8 * fs)}px; font-weight: 600;
        }

        .clause-obs { color: #d97706; font-weight: 500; font-style: italic; margin-top: 4px; }

        .info-box {
            border: 1px solid #d4d4d8; border-radius: 6px; padding: 10px;
            background: #fafafa; margin-top: 5px;
        }
        .info-box.flex-between { display: flex; justify-content: space-between; align-items: center; }
        .info-box p { margin-bottom: 3px; }
        .info-box p:last-child { margin-bottom: 0; }
        .price-total { font-weight: 700; font-size: ${Math.round(11 * fs)}px; border-top: 1px solid #d4d4d8; padding-top: 4px; margin-top: 4px; display: flex; justify-content: space-between; }

        .signatures-wrapper {
            display: flex; justify-content: space-between; margin-top: 30px;
            padding: 0 20px;
        }
        .sig-box { width: 45%; text-align: center; }
        .sig-line { width: 100%; height: 1px; background-color: #2b2b2b; margin-bottom: 8px; }
        .sig-box p { font-weight: 600; font-size: ${Math.round(10 * fs)}px; color: #111; }
        .sig-box span { font-size: ${Math.round(8 * fs)}px; color: #71717a; }

        .ass-dig-bloco { margin: 0 auto 5px; padding: 6px 8px; border: 1px solid #2d2d2d44; border-radius: 4px; background: #fafafa; text-align: center; max-width: 180px; }
        .ass-dig-titulo { font-family: 'Inter', sans-serif; font-weight: 700; font-size: ${Math.round(7 * fs)}px; color: #2d2d2d; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 4px; border-bottom: 1px solid #2d2d2d22; padding-bottom: 3px; }
        .ass-dig-info { font-size: ${Math.round(8 * fs)}px; color: #555; line-height: 1.55; }
        .ass-dig-codigo { font-family: 'Courier New', monospace; font-size: ${Math.round(6.5 * fs)}px; color: #bbb; margin-top: 4px; letter-spacing: 1px; }

        .footer-block {
            position: absolute; bottom: 0; right: 0;
            background-color: #2d2d2d; color: #ffffff;
            padding: 12px 50px 12px 30px; border-top-left-radius: 20px;
            display: flex; gap: 20px; font-size: ${Math.round(9 * fs)}px; font-weight: 500; z-index: 2;
        }
        .footer-block span { display: flex; align-items: center; gap: 5px; color: #d1d5db; }
    </style>
</head>
<body>

    <div class="sheet">
        <div class="content-wrapper">

            <div class="header-block">
                ${logoBase64 ? `<img class="header-logo" src="data:${logoMime};base64,${logoBase64}" />` : ""}
                <h1>Contrato <span>${escapeHtml(artist.name)}</span></h1>
                <p>Prestação de Serviços Artísticos</p>
            </div>

            <div class="contract-body">

                <div class="parties-info">
                    <p>Pelo presente instrumento, de um lado denominado <strong>CONTRATANTE</strong>, <strong>${escapeHtml(d.contratanteNome || "")}</strong>, CPF/CNPJ: <strong>${escapeHtml(d.contratanteCpfCnpj || "")}</strong>, RG: <strong>${escapeHtml(rgTexto)}</strong>, residente na Rua: <strong>${escapeHtml(d.logradouro || "")}</strong>, Nº <strong>${escapeHtml(d.numero || "")}</strong>, <strong>${escapeHtml(d.bairro || "")}</strong>, CEP: <strong>${escapeHtml(d.cep || "")}</strong>, <strong>${escapeHtml(cidadeEstadoContratante)}</strong>${d.contratanteTelefone ? `, Tel: <strong>${escapeHtml(d.contratanteTelefone)}</strong>` : ""}.</p>
                    <p>De outro lado, <strong>"${escapeHtml(artist.name)}"</strong>, denominado <strong>CONTRATADO</strong>, empresa brasileira, CNPJ: <strong>${escapeHtml(artist.cnpj || "")}</strong>, com escritório na ${escapeHtml(enderecoArtista)}, têm entre si o seguinte:</p>
                </div>

                <div class="clauses-grid">

                    <!-- Coluna Esquerda -->
                    <div>
                        <div class="clause">
                            <h4><span>01</span> DATA DO EVENTO</h4>
                            <p>O CONTRATADO se obriga a prestar serviço de ${textos.tipoServico} em: <strong>${escapeHtml(dataEventoBr)}</strong>.</p>
                        </div>

                        <div class="clause">
                            <h4><span>02</span> LOCAL E DURAÇÃO</h4>
                            <p>Duração de <strong>${escapeHtml(horasFormatado)}hs de ${textos.tipoServico}</strong>${d.horario ? `, às <strong>${escapeHtml(d.horario)}h</strong>` : ""}, no local: <strong>${escapeHtml(d.local || "")}</strong>, <strong>${escapeHtml(cidadeEstadoEvento)}</strong>.</p>
                        </div>

                        <div class="clause">
                            <h4><span>03</span> VALOR CONTRATADO</h4>
                            <p>Valor de <strong>${escapeHtml(valorTotalFormatado)}</strong> (${escapeHtml(valorTotalExtenso)}).</p>
                            <div class="info-box">
                                <div style="display: flex; justify-content: space-between; color: #52525b; font-size: ${Math.round(8 * fs)}px; margin-bottom: 4px;"><span>COMPOSIÇÃO DO VALOR</span></div>
                                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;"><span>Cachê (${horasFormatado}h)</span> <span>${escapeHtml(valorCacheFormatado)}</span></div>
                                ${backlineNumerico > 0 ? `<div style="display: flex; justify-content: space-between; margin-bottom: 4px;"><span>Backline</span> <span>${escapeHtml(backlineFormatado!)}</span></div>` : ""}
                                ${transporteNumerico > 0 ? `<div style="display: flex; justify-content: space-between; margin-bottom: 4px;"><span>Transporte</span> <span>${escapeHtml(transporteFormatado!)}</span></div>` : ""}
                                <div class="price-total"><span>TOTAL</span> <span>${escapeHtml(valorTotalFormatado)}</span></div>
                            </div>
                        </div>

                        <div class="clause">
                            <h4><span>04</span> ${textos.formatoTitulo}</h4>
                            <p>${textos.formatoTexto(escapeHtml(instruments))}</p>
                        </div>

                        <div class="clause">
                            <h4><span>10</span> RESPONSABILIDADES</h4>
                            <p>Ficam sob responsabilidade do CONTRATANTE alvarás, taxas ECAD, diversões públicas e demais exigências legais para realização do evento.</p>
                        </div>
                    </div>

                    <!-- Coluna Direita -->
                    <div>
                        <div class="clause">
                            <h4><span>05</span> DESLOCAMENTO</h4>
                            <p>${transporteTexto}</p>
                            <p class="clause-obs">OBS. Água mineral e alimentação para <strong>${pessoasBanda}</strong> pessoas ficam por conta do CONTRATANTE.</p>
                            <p class="clause-obs">OBS. ${textos.obsBacklineOuSom}</p>
                        </div>

                        <div class="clause">
                            <h4><span>06</span> REPERTÓRIO</h4>
                            <p>${textos.repertorioTexto}</p>
                        </div>

                        <div class="clause">
                            <h4><span>07</span> RESCISÃO</h4>
                            <p>Em caso de rescisão, a parte infratora indenizará a prejudicada:</p>
                            <ul style="margin-left: 15px; margin-top: 4px;">
                                <li>§ 1º — Multa de 10% do valor, rescisão por escrito até 15 dias antes do evento.</li>
                                <li>§ 2º — Multa de 50% do valor, rescisão no dia do evento.</li>
                            </ul>
                        </div>

                        <div class="clause">
                            <h4><span>09</span> ${textos.interrupcaoTitulo}</h4>
                            <p>${textos.interrupcaoTexto}</p>
                        </div>
                    </div>

                    <!-- Cláusula Larga Embaixo -->
                    <div class="clause clause-full">
                        <h4><span>08</span> PAGAMENTO</h4>
                        <p>O CONTRATANTE efetuará o pagamento da seguinte forma: <strong>${d.formaPagamento ? escapeHtml(d.formaPagamento) : "50% na assinatura e 50% uma semana antes do evento."}</strong></p>
                        <div class="info-box flex-between">
                            <div>
                                <p style="color: #71717a; font-size: ${Math.round(8 * fs)}px; margin-bottom: 2px;">DADOS BANCÁRIOS</p>
                                <p><strong>Titular:</strong> ${escapeHtml(bank.titular || artist.legalName || artist.name || "")}</p>
                                <p><strong>PIX:</strong> ${escapeHtml(bank.pix || artist.pixKey || artist.cnpj || "")}</p>
                            </div>
                            <div style="text-align: right;">
                                <p><strong>Banco:</strong> ${escapeHtml(bank.banco || "")}</p>
                                <p><strong>Conta:</strong> ${escapeHtml(bank.conta || "")}</p>
                                <p><strong>Agência:</strong> ${escapeHtml(bank.agencia || "")}</p>
                            </div>
                        </div>
                    </div>

                    <div class="clause clause-full">
                        <h4><span>11</span> FORO</h4>
                        <p>Fica eleito o foro da cidade de ${escapeHtml(foro)} para questões oriundas deste contrato.</p>
                    </div>

                    ${d.clausulasEspeciais ? `
                    <div class="clause clause-full">
                        <h4><span>12</span> CLÁUSULA ESPECIAL</h4>
                        <p>${escapeHtml(d.clausulasEspeciais)}</p>
                    </div>` : ""}
                    ${d.observacoes ? `
                    <div class="clause clause-full">
                        <p style="color: #d97706; font-weight: 500; font-style: italic;"><strong>OBS:</strong> ${escapeHtml(d.observacoes)}</p>
                    </div>` : ""}

                </div>

                <!-- Assinaturas -->
                <div class="signatures-wrapper">
                    <div class="sig-box">
                        ${d.assinarDigitalmente !== false ? `<div style="height: 70px;"></div>` : ""}
                        <div class="sig-line"></div>
                        <p>${escapeHtml((d.contratanteNome || "Contratante").toUpperCase())}</p>
                        <span>CONTRATANTE</span>
                    </div>
                    <div class="sig-box">
                        ${d.assinarDigitalmente !== false ? `
                        <div class="ass-dig-bloco">
                            <div class="ass-dig-titulo">Certificado</div>
                            <div class="ass-dig-info"><strong>${escapeHtml(artist.legalName || artist.name)}</strong></div>
                            <div class="ass-dig-info">CNPJ: ${escapeHtml(artist.cnpj || "")}</div>
                            <div class="ass-dig-info">${escapeHtml(dataAssinatura)}</div>
                            <div class="ass-dig-codigo">${hashContrato}</div>
                        </div>` : ""}
                        <div class="sig-line"></div>
                        <p>${escapeHtml(artist.name.toUpperCase())}${artist.legalName && artist.legalName !== artist.name ? ` (${escapeHtml(artist.legalName)})` : ""}</p>
                        <span>CONTRATADO</span>
                    </div>
                </div>

            </div>

            <div class="footer-block">
                <span>${escapeHtml(addr.cidade || "Campo Grande")}/${escapeHtml(addr.estado || "MS")}, ${new Date().getFullYear()}</span>
            </div>

        </div>
    </div>

</body>
</html>`;
}

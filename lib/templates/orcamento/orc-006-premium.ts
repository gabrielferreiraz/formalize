import { escapeHtml, formatData, valorPorExtenso } from "@/lib/templates/utils";
import type { ArtistTemplateData, AssetResult } from "@/lib/templates/types";

type ArtistData = ArtistTemplateData & Record<string, any>;

function parseMoney(raw: string | number | undefined): number {
  if (!raw) return 0;
  return (parseFloat(String(raw)) || 0) / 100;
}

function formatMoney(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });
}

export async function buildOrc006(
  artist: ArtistData,
  data: Record<string, any>,
  _pageSize?: { width: string; height: string },
  logo?: AssetResult | null,
  _background?: AssetResult | null,
): Promise<string> {
  const d = data;
  const cache = parseMoney(d.cache);
  const cacheFmt = formatMoney(cache);
  
  const backlineN = d.backline === "valor" ? parseMoney(d.backlineValor) : 0;
  const transporteN = d.transporte === "valor" ? parseMoney(d.transporteValor) : 0;
  const alimentacaoN = d.alimentacao === "valor" ? parseMoney(d.alimentacaoValor) : 0;
  const hospedagemN = d.hospedagem === "valor" ? parseMoney(d.hospedagemValor) : 0;
  const total = cache + backlineN + transporteN + alimentacaoN + hospedagemN;
  const totalFmt = formatMoney(total);
  
  const today = new Date();
  const todayFmt = today.toLocaleDateString("pt-BR");
  
  const logoMime = logo?.mime || "image/png";
  const logoBase64 = logo?.base64 || "";

  // Build table rows
  const tableRows: string[] = [];
  
  // Cache row
  tableRows.push(`
    <tr>
      <td>
        <span class="service-title">Cachê de Apresentação Musical</span>
        <p class="service-desc">
          Apresentação ao vivo com duração total de ${d.horas || "2"} horas. Inclui equipe técnica de apoio.
        </p>
      </td>
      <td class="price-text">${cacheFmt}</td>
      <td class="price-text">1</td>
      <td class="price-text">${cacheFmt}</td>
    </tr>
  `);
  
  // Backline
  if (d.backline && d.backline !== "nao") {
    const backlineFmt = d.backline === "valor" ? formatMoney(backlineN) : "Incluso";
    tableRows.push(`
      <tr>
        <td>
          <span class="service-title">Backline</span>
          <p class="service-desc">
            Instrumentos e equipamento do palco.
          </p>
        </td>
        <td class="price-text">${backlineFmt}</td>
        <td class="price-text">1</td>
        <td class="price-text">${backlineFmt}</td>
      </tr>
    `);
  }
  
  // Transporte
  if (d.transporte && d.transporte !== "nao") {
    const transporteFmt = d.transporte === "valor" ? formatMoney(transporteN) : "Incluso";
    tableRows.push(`
      <tr>
        <td>
          <span class="service-title">Transporte</span>
          <p class="service-desc">
            Deslocamento da banda até o local.
          </p>
        </td>
        <td class="price-text">${transporteFmt}</td>
        <td class="price-text">1</td>
        <td class="price-text">${transporteFmt}</td>
      </tr>
    `);
  }
  
  // Alimentação
  if (d.alimentacao && d.alimentacao !== "nao") {
    const alimentacaoFmt = d.alimentacao === "valor" ? formatMoney(alimentacaoN) : "Incluso";
    tableRows.push(`
      <tr>
        <td>
          <span class="service-title">Alimentação</span>
          <p class="service-desc">
            Refeição para a equipe no dia.
          </p>
        </td>
        <td class="price-text">${alimentacaoFmt}</td>
        <td class="price-text">1</td>
        <td class="price-text">${alimentacaoFmt}</td>
      </tr>
    `);
  }
  
  // Hospedagem
  if (d.hospedagem && d.hospedagem !== "nao") {
    const hospedagemFmt = d.hospedagem === "valor" ? formatMoney(hospedagemN) : "Incluso";
    tableRows.push(`
      <tr>
        <td>
          <span class="service-title">Hospedagem</span>
          <p class="service-desc">
            Hotel e descanso da equipe.
          </p>
        </td>
        <td class="price-text">${hospedagemFmt}</td>
        <td class="price-text">1</td>
        <td class="price-text">${hospedagemFmt}</td>
      </tr>
    `);
  }

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Orçamento Dark Modern - Formato A4</title>
  <style>
    /* Importando fontes modernas */
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600&family=Space+Grotesk:wght@500;700&display=swap');

    /* Reset Base */
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    /* ----------------------------------------------------
       COMPORTAMENTO DE TELA (Visualização no Navegador)
    ----------------------------------------------------- */
    @media screen {
      body {
        background-color: #2b2b2b;
        display: flex;
        justify-content: center;
        align-items: flex-start;
        padding: 20px 10px;
        min-height: 100vh;
      }
      
      .sheet {
        width: 210mm;
        min-height: 297mm;
        box-shadow: 0 15px 40px rgba(0, 0, 0, 0.6);
        border-radius: 4px;
      }
    }

    /* ----------------------------------------------------
       COMPORTAMENTO PARA CELULARES (VERDADEIRO)
    ----------------------------------------------------- */
    @media screen and (max-width: 768px) {
      body {
        padding: 0 !important;
        display: block !important;
      }
      
      .sheet {
        width: 100% !important;
        min-height: 100vh !important;
        box-shadow: none !important;
        border-radius: 0 !important;
        padding: 20px 15px !important;
        font-size: 16px !important;
      }
      
      .header-title {
        margin-top: 20px !important;
        margin-bottom: 40px !important;
      }
      
      .header-title h1 {
        font-size: 40px !important;
      }
      
      .title-ellipse {
        width: 240px !important;
        height: 80px !important;
      }
      
      .info-grid {
        flex-direction: column !important;
        gap: 30px !important;
        margin-bottom: 40px !important;
      }
      
      .meta-info {
        text-align: left !important;
      }
      
      .bill-to h4 {
        font-size: 16px !important;
      }
      
      .bill-to h2 {
        font-size: 28px !important;
      }
      
      .bill-to p {
        font-size: 16px !important;
      }
      
      .meta-info p {
        font-size: 16px !important;
      }
      
      table {
        display: block !important;
        width: 100% !important;
        overflow-x: auto !important;
      }
      
      th {
        font-size: 16px !important;
      }
      
      td {
        padding: 15px 0 !important;
      }
      
      .service-title {
        font-size: 18px !important;
      }
      
      .service-desc {
        font-size: 16px !important;
        max-width: 100% !important;
      }
      
      .price-text {
        font-size: 16px !important;
      }
      
      .footer-section {
        flex-direction: column !important;
        gap: 30px !important;
        margin-top: 40px !important;
      }
      
      .footer-left {
        width: 100% !important;
      }
      
      .footer-totals {
        width: 100% !important;
      }
      
      .footer-terms {
        font-size: 16px !important;
      }
      
      .total-row {
        font-size: 16px !important;
      }
      
      .total-row.grand-total {
        font-size: 20px !important;
      }
      
      .brand-logo {
        font-size: 18px !important;
      }
      
      .bottom-bar {
        position: relative !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        margin-top: 40px !important;
        padding: 20px 0 !important;
        flex-direction: column !important;
        gap: 15px !important;
      }
      
      .decor-star {
        top: 15px !important;
        left: 15px !important;
        width: 45px !important;
        height: 45px !important;
      }
    }

    /* ----------------------------------------------------
       COMPORTAMENTO DE IMPRESSÃO (Gotenberg / PDF-Lib)
    ----------------------------------------------------- */
    @media print {
      @page {
        size: A4;
        margin: 0;
      }
      body {
        background-color: transparent;
        padding: 0;
      }
      .sheet {
        width: 100%;
        height: 100vh;
        box-shadow: none;
        border-radius: 0;
        margin: 0;
      }
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }

    /* ----------------------------------------------------
       ESTILIZAÇÃO DA FOLHA (O Documento)
    ----------------------------------------------------- */
    .sheet {
      background-color: #1a1a1c;
      color: #d1d5db;
      font-family: 'Inter', sans-serif;
      font-size: 14px;
      padding: 50px 60px;
      position: relative;
      overflow: hidden;
      z-index: 1;
    }

    /* Efeitos de Brilho (Glows em tons de verde/cyan) */
    .glow {
      position: absolute;
      border-radius: 50%;
      filter: blur(60px);
      z-index: -1;
      opacity: 0.4;
    }
    .glow.top-right {
      top: -50px;
      right: -50px;
      width: 300px;
      height: 300px;
      background: radial-gradient(circle, rgba(0, 255, 163, 0.4) 0%, rgba(0, 255, 163, 0) 70%);
    }
    .glow.mid-right {
      top: 25%;
      right: 15%;
      width: 250px;
      height: 120px;
      background: radial-gradient(ellipse, rgba(0, 255, 163, 0.5) 0%, rgba(0, 255, 163, 0) 70%);
    }
    .glow.bottom-left {
      bottom: -50px;
      left: -50px;
      width: 400px;
      height: 400px;
      background: radial-gradient(circle, rgba(0, 255, 163, 0.3) 0%, rgba(0, 255, 163, 0) 70%);
    }

    /* Elementos Decorativos Topo (Estrela) */
    .decor-star {
      position: absolute;
      top: 40px;
      left: 40px;
      width: 60px;
      height: 60px;
    }

    /* Cabeçalho e Título */
    .header-title {
      text-align: center;
      margin-top: 40px;
      margin-bottom: 80px;
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .header-title h1 {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 56px;
      color: #ffffff;
      font-weight: 700;
      letter-spacing: -2px;
      z-index: 2;
    }

    /* Elipse em volta do título */
    .title-ellipse {
      position: absolute;
      width: 320px;
      height: 90px;
      border: 1px solid #ffffff;
      border-radius: 50%;
      transform: rotate(-4deg);
      z-index: 1;
    }

    /* Informações Iniciais */
    .info-grid {
      display: flex;
      justify-content: space-between;
      margin-bottom: 60px;
    }

    .bill-to h4 {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 15px;
      color: #ffffff;
    }

    .bill-to h2 {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 24px;
      color: #ffffff;
      margin-bottom: 8px;
    }

    .bill-to p {
      line-height: 1.6;
      font-size: 14px;
    }

    .meta-info {
      text-align: right;
      position: relative;
      z-index: 2;
    }

    .meta-info p {
      font-weight: 600;
      color: #ffffff;
      margin-bottom: 5px;
      font-size: 14px;
    }

    /* Tabela de Serviços */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 40px;
    }

    th {
      text-align: left;
      padding-bottom: 15px;
      border-bottom: 1px solid #4b5563;
      color: #ffffff;
      font-family: 'Space Grotesk', sans-serif;
      font-size: 13px;
    }

    th:nth-child(2), th:nth-child(3), th:last-child,
    td:nth-child(2), td:nth-child(3), td:last-child {
      text-align: center;
    }

    th:last-child, td:last-child {
      text-align: right;
    }

    td {
      padding: 12px 0;
      vertical-align: top;
    }

    .service-title {
      color: #ffffff;
      font-weight: 600;
      font-size: 16px;
      margin-bottom: 4px;
      display: block;
    }

    .service-desc {
      font-size: 13px;
      color: #9ca3af;
      line-height: 1.5;
      max-width: 80%;
    }

    .price-text {
      color: #ffffff;
      font-weight: 600;
      font-size: 14px;
    }

    /* Rodapé de Totais e Informações */
    .footer-section {
      display: flex;
      justify-content: space-between;
      margin-top: 50px;
      align-items: flex-start;
    }

    .footer-left {
      display: flex;
      gap: 20px;
      width: 60%;
      align-items: center;
    }

    /* Badge Redonda com Seta */
    .circle-badge {
      width: 80px;
      height: 80px;
      border: 1px dashed #ffffff;
      border-radius: 50%;
      display: flex;
      justify-content: center;
      align-items: center;
      position: relative;
      flex-shrink: 0;
    }

    .circle-badge svg {
      width: 24px;
      height: 24px;
      color: #ffffff;
      transform: rotate(-45deg);
    }

    .footer-terms {
      font-size: 13px;
      color: #9ca3af;
      line-height: 1.6;
    }

    .footer-totals {
      width: 35%;
    }

    .total-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
      font-size: 14px;
    }

    .total-row.grand-total {
      border-top: 1px solid #4b5563;
      padding-top: 15px;
      margin-top: 5px;
      font-family: 'Space Grotesk', sans-serif;
      font-size: 20px;
      color: #ffffff;
      font-weight: 700;
    }

    /* Base Info (Logotipo no rodapé da folha) */
    .bottom-bar {
      position: absolute;
      bottom: 40px;
      left: 60px;
      right: 60px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .brand-logo {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #ffffff;
      font-family: 'Space Grotesk', sans-serif;
      font-size: 14px;
      font-weight: 700;
    }

    .website {
      color: #d1d5db;
    }
  </style>
</head>
<body>

    <!-- CONTAINER DA FOLHA A4 -->
    <div class="sheet">
        
        <!-- Glows de Fundo -->
        <div class="glow top-right"></div>
        <div class="glow mid-right"></div>
        <div class="glow bottom-left"></div>

        <!-- Decoração estrela canto esquerdo -->
        <svg class="decor-star" viewBox="0 0 100 100" fill="none" stroke="#ffffff" stroke-width="1">
            <path d="M10,10 L40,30 L50,0 L60,30 L90,10 L70,40 L100,50 L70,60 L90,90 L60,70 L50,100 L40,70 L10,90 L30,60 L0,50 L30,40 Z" />
        </svg>

        <!-- Título com Elipse -->
        <div class="header-title">
            <div class="title-ellipse"></div>
            <h1>Orçamento</h1>
        </div>

        <!-- Info Cliente e Documento -->
        <div class="info-grid">
            <div class="bill-to">
                <h4>Orçamento para</h4>
                <h2>${d.contratante ? escapeHtml(d.contratante) : "Cliente"}</h2>
                <p>Evento: ${escapeHtml(d.evento || "")}<br>
                   Data: ${formatData(d.data)}<br>
                   Local: ${escapeHtml(d.local || "")}${d.cidade ? `<br>${escapeHtml(d.cidade)}` : ""}</p>
            </div>
            <div class="meta-info">
                <p>Orçamento Nº #${Math.floor(Math.random() * 90000) + 10000}</p>
                <p>Data de Emissão: ${todayFmt}</p>
            </div>
        </div>

        <!-- Tabela -->
        <table>
            <thead>
                <tr>
                    <th width="50%">Descrição do Serviço</th>
                    <th width="20%">Preço</th>
                    <th width="10%">QTD</th>
                    <th width="20%">Total</th>
                </tr>
            </thead>
            <tbody>
                ${tableRows.join("")}
            </tbody>
        </table>

        <!-- Rodapé: Totais, Termos e Badge -->
        <div class="footer-section">
            <div class="footer-left">
                <div class="circle-badge">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                </div>
                <p class="footer-terms">
                    Forma de pagamento estabelecida: ${d.formaPagamento ? escapeHtml(d.formaPagamento) : "PIX à vista"}.<br>
                    Este orçamento possui validade de 7 dias úteis. Para garantir a data, é necessária a assinatura do contrato e o pagamento do sinal conforme combinado com a produção do artista.
                </p>
            </div>

            <div class="footer-totals">
                <div class="total-row">
                    <span>Subtotal</span>
                    <span class="price-text">${totalFmt}</span>
                </div>
                <div class="total-row">
                    <span>Descontos</span>
                    <span class="price-text">R$ 0,00</span>
                </div>
                <div class="total-row grand-total">
                    <span>Total Final</span>
                    <span>${totalFmt}</span>
                </div>
            </div>
        </div>

        <!-- Barra Inferior (Logotipo e Site) -->
        <div class="bottom-bar">
            <div class="brand-logo">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00FFA3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                    <path d="M2 17l10 5 10-5"></path>
                    <path d="M2 12l10 5 10-5"></path>
                </svg>
                ${escapeHtml(artist.name)}
            </div>
            <div class="website">
                ${artist.website ? escapeHtml(artist.website) : ""}
            </div>
        </div>

    </div> <!-- FIM DO CONTAINER DA FOLHA -->

</body>
</html>`;
}
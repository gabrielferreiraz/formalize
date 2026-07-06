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

export async function buildOrc007(
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
  
  // Build table rows
  const tableRows: string[] = [];
  
  // Cache row
  tableRows.push(`
    <tr>
      <td>
        <span class="item-title">Cachê de Apresentação Musical</span>
        <span class="item-desc">Apresentação ao vivo com duração total de ${d.horas || "2"} horas. Equipe técnica de apoio inclusa no pacote principal.</span>
      </td>
      <td>1</td>
      <td>${cacheFmt}</td>
      <td>${cacheFmt}</td>
    </tr>
  `);
  
  // Backline
  if (d.backline && d.backline !== "nao") {
    const backlineFmt = d.backline === "valor" ? formatMoney(backlineN) : "Incluso";
    tableRows.push(`
      <tr>
        <td>
          <span class="item-title">Backline</span>
          <span class="item-desc">Instrumentos e equipamento do palco.</span>
        </td>
        <td>${d.backline === "valor" ? "1" : "-"}</td>
        <td>${backlineFmt}</td>
        <td>${backlineFmt}</td>
      </tr>
    `);
  }
  
  // Transporte
  if (d.transporte && d.transporte !== "nao") {
    const transporteFmt = d.transporte === "valor" ? formatMoney(transporteN) : "Incluso";
    tableRows.push(`
      <tr>
        <td>
          <span class="item-title">Transporte & Logística</span>
          <span class="item-desc">Custo de translado para a equipe.</span>
        </td>
        <td>${d.transporte === "valor" ? "1" : "-"}</td>
        <td>${transporteFmt}</td>
        <td>${transporteFmt}</td>
      </tr>
    `);
  }
  
  // Alimentação
  if (d.alimentacao && d.alimentacao !== "nao") {
    const alimentacaoFmt = d.alimentacao === "valor" ? formatMoney(alimentacaoN) : "Incluso";
    tableRows.push(`
      <tr>
        <td>
          <span class="item-title">Alimentação</span>
          <span class="item-desc">Refeição para a equipe no dia.</span>
        </td>
        <td>${d.alimentacao === "valor" ? "1" : "-"}</td>
        <td>${alimentacaoFmt}</td>
        <td>${alimentacaoFmt}</td>
      </tr>
    `);
  }
  
  // Hospedagem
  if (d.hospedagem && d.hospedagem !== "nao") {
    const hospedagemFmt = d.hospedagem === "valor" ? formatMoney(hospedagemN) : "Incluso";
    tableRows.push(`
      <tr>
        <td>
          <span class="item-title">Hospedagem</span>
          <span class="item-desc">Hotel e descanso da equipe.</span>
        </td>
        <td>${d.hospedagem === "valor" ? "1" : "-"}</td>
        <td>${hospedagemFmt}</td>
        <td>${hospedagemFmt}</td>
      </tr>
    `);
  }

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Orçamento Premium Escuro - Arredondado</title>
  <style>
    /* Importando fonte Montserrat (Elegante e Geométrica) */
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap');

    /* ----------------------------------------------------
       RESET E VARIÁVEIS
    ----------------------------------------------------- */
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    :root {
      --brand-color: #D48135; /* Laranja/Cobre premium da imagem */
      --bg-dark: #121212;
      --text-light: #E5E7EB;
      --text-dark: #111111;
      --column-highlight: rgba(255, 255, 255, 0.04);
    }

    /* ----------------------------------------------------
       COMPORTAMENTO DE TELA (Navegador)
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
      }
      .content-wrapper {
        padding: 20px 15px !important;
      }
      .sheet {
        font-size: 16px !important;
      }
      .logo-block {
        position: relative !important;
        top: 0 !important;
        left: 0 !important;
        padding: 25px !important;
        margin-bottom: 25px !important;
        border-bottom-right-radius: 30px !important;
      }
      .logo-block h1 {
        font-size: 22px !important;
      }
      .logo-block span {
        font-size: 14px !important;
      }
      .header {
        display: block !important;
      }
      .title-block {
        text-align: center !important;
        margin-top: 15px !important;
      }
      .title-block h2 {
        font-size: 40px !important;
      }
      .title-block p {
        font-size: 14px !important;
      }
      .info-section {
        flex-direction: column !important;
        gap: 30px !important;
        margin-top: 40px !important;
      }
      .date-highlight {
        font-size: 20px !important;
      }
      .info-grid {
        font-size: 16px !important;
      }
      .info-label {
        font-size: 16px !important;
      }
      .info-value {
        font-size: 16px !important;
      }
      table {
        display: block !important;
        width: 100% !important;
        overflow-x: auto !important;
      }
      th {
        font-size: 14px !important;
        padding: 15px 10px !important;
      }
      td {
        padding: 20px 10px !important;
        font-size: 16px !important;
      }
      .item-title {
        font-size: 18px !important;
      }
      .item-desc {
        font-size: 16px !important;
      }
      .totals-block {
        flex-direction: column !important;
        gap: 25px !important;
        padding: 25px !important;
        margin-top: 30px !important;
      }
      .terms {
        width: 100% !important;
        padding-right: 0 !important;
      }
      .terms h3 {
        font-size: 18px !important;
      }
      .terms p {
        font-size: 16px !important;
      }
      .totals {
        width: 100% !important;
      }
      .tot-row {
        font-size: 16px !important;
      }
      .tot-row.grand {
        font-size: 20px !important;
      }
      .tot-row.grand span:last-child {
        font-size: 22px !important;
      }
      .footer {
        flex-direction: column !important;
        gap: 15px !important;
        font-size: 16px !important;
        padding-top: 30px !important;
      }
    }

    /* ----------------------------------------------------
       COMPORTAMENTO DE IMPRESSÃO (Gotenberg / PDF-Lib)
    ----------------------------------------------------- */
    @media print {
      @page { size: A4; margin: 0; }
      html, body { 
        background: linear-gradient(135deg, #242424 0%, #0a0a0a 100%); 
        padding: 0; 
        margin: 0; 
      }
      .sheet {
        width: 100%;
        min-height: 297mm;
        box-shadow: none;
        margin: 0;
      }
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }

    /* ----------------------------------------------------
       ESTRUTURA DA FOLHA (DOCUMENTO)
    ----------------------------------------------------- */
    html, body {
      background: linear-gradient(135deg, #242424 0%, #0a0a0a 100%);
    }
    .sheet {
      background: linear-gradient(135deg, #242424 0%, #0a0a0a 100%);
      color: var(--text-light);
      font-family: 'Montserrat', sans-serif;
      font-size: 14px;
      position: relative;
      display: flex;
      flex-direction: column;
    }

    /* Envolve o conteúdo com padding interno */
    .content-wrapper {
      padding: 50px 50px;
      flex-grow: 1;
      display: flex;
      flex-direction: column;
    }

    /* ----------------------------------------------------
       CABEÇALHO E LOGO
    ----------------------------------------------------- */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 50px;
      position: relative;
    }

    .logo-block {
      position: absolute;
      top: -50px;
      left: -50px;
      background-color: var(--brand-color);
      padding: 40px 30px 25px 50px;
      border-bottom-right-radius: 35px;
      color: var(--text-dark);
    }

    .logo-block h1 {
      font-weight: 800;
      font-size: 24px;
      line-height: 1.1;
      letter-spacing: 2px;
      text-transform: uppercase;
    }
    .logo-block span {
      font-weight: 600;
      font-size: 10px;
      letter-spacing: 3px;
    }

    .title-block {
      margin-left: auto;
      text-align: right;
      padding-top: 10px;
    }

    .title-block h2 {
      font-size: 42px;
      font-weight: 800;
      font-style: italic;
      color: #ffffff;
      margin-bottom: 5px;
      letter-spacing: -1px;
    }

    .title-block p {
      color: var(--brand-color);
      font-weight: 700;
      font-size: 12px;
      letter-spacing: 2px;
    }

    /* ----------------------------------------------------
       INFORMAÇÕES DO CLIENTE / EVENTO
    ----------------------------------------------------- */
    .info-section {
      display: flex;
      justify-content: space-between;
      margin-bottom: 40px;
      margin-top: 50px;
    }

    .date-highlight {
      color: var(--brand-color);
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 15px;
      letter-spacing: 2px;
    }

    .info-grid {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 6px 15px;
      font-size: 14px;
    }

    .info-label {
      font-weight: 700;
      color: #ffffff;
      font-size: 14px;
    }
    
    .info-value {
      color: #a3a3a3;
      font-size: 14px;
    }

    /* ----------------------------------------------------
       TABELA
    ----------------------------------------------------- */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 40px;
      table-layout: fixed;
    }

    th {
      background-color: var(--brand-color);
      color: var(--text-dark);
      padding: 12px 15px;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 13px;
      letter-spacing: 1px;
    }

    th:nth-child(1) { width: 45%; text-align: left; }
    th:nth-child(2) { width: 15%; text-align: center; }
    th:nth-child(3) { width: 20%; text-align: center; }
    th:nth-child(4) { width: 20%; text-align: right; }

    td {
      padding: 20px 15px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      vertical-align: top;
      font-size: 14px;
    }

    td:nth-child(2), td:nth-child(3), td:nth-child(4) {
      background-color: var(--column-highlight);
    }

    td:nth-child(1) { text-align: left; }
    td:nth-child(2) { text-align: center; font-weight: 600;}
    td:nth-child(3) { text-align: center; font-weight: 600;}
    td:nth-child(4) { text-align: right; font-weight: 600; color: #ffffff;}

    .item-title {
      display: block;
      font-weight: 700;
      color: #ffffff;
      font-size: 16px;
      margin-bottom: 5px;
    }
    .item-desc {
      color: #a3a3a3;
      font-size: 13px;
      line-height: 1.5;
    }

    /* ----------------------------------------------------
       BLOCO DE TOTAIS E TERMOS (Arredondado e Preto)
    ----------------------------------------------------- */
    .totals-block {
      background-color: #000000; /* Fundo totalmente preto */
      color: #ffffff; /* Texto branco */
      display: flex;
      padding: 35px;
      margin-bottom: 40px;
      border-radius: 24px; /* Bordas bem arredondadas */
      border: 1px solid rgba(255, 255, 255, 0.05); /* Borda clarinha bem sutil */
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5); /* Sombra para destacar do fundo */
    }

    .terms {
      width: 60%;
      padding-right: 40px;
    }

    .terms h3 {
      font-size: 18px;
      font-weight: 800;
      margin-bottom: 10px;
      text-transform: uppercase;
      color: var(--brand-color); /* Título na cor principal da marca */
    }

    .terms p {
      font-size: 13px;
      font-weight: 500;
      line-height: 1.6;
      color: #a3a3a3; /* Texto num tom de cinza claro para leitura */
    }

    .totals {
      width: 40%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .tot-row {
      display: flex;
      justify-content: space-between;
      font-weight: 600;
      font-size: 14px;
      margin-bottom: 8px;
      color: #e5e7eb;
    }

    .tot-row.grand {
      font-size: 18px;
      font-weight: 800;
      border-top: 1px solid rgba(255, 255, 255, 0.15); /* Linha divisória clara */
      padding-top: 15px;
      margin-top: 5px;
      color: #ffffff;
    }

    /* Destacando o valor do total final com a cor da marca */
    .tot-row.grand span:last-child {
      color: var(--brand-color);
      font-size: 20px;
    }

    /* ----------------------------------------------------
       RODAPÉ (Contatos)
    ----------------------------------------------------- */
    .footer {
      margin-top: auto;
      text-align: center;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      padding-top: 20px;
      color: #a3a3a3;
      font-size: 13px;
      display: flex;
      justify-content: center;
      gap: 30px;
    }

    .footer span {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .footer svg {
      color: var(--brand-color);
    }

  </style>
</head>
<body>

  <div class="sheet">
    <div class="content-wrapper">
        
      <div class="header">
        <div class="logo-block">
          <h1>${escapeHtml(artist.name).toUpperCase().replace(/ /g, '<br>')}</h1>
          <span>PREMIUM</span>
        </div>
        
        <div class="title-block">
          <h2>Orçamento</h2>
          <p>Nº ${Math.floor(Math.random() * 90000) + 10000}</p>
        </div>
      </div>

      <div class="info-section">
        <div>
          <div class="date-highlight">${todayFmt}</div>
          <div class="info-grid">
            <span class="info-label">Para</span>
            <span class="info-value">${d.contratante ? escapeHtml(d.contratante) : ""}</span>
            
            <span class="info-label">Evento</span>
            <span class="info-value">${escapeHtml(d.evento || "")}${d.data ? ` (${formatData(d.data)})` : ""}</span>
            
            <span class="info-label">Local</span>
            <span class="info-value">${escapeHtml(d.local || "")}${d.cidade ? ` - ${escapeHtml(d.cidade)}` : ""}</span>
          </div>
        </div>

        <div>
          <div class="info-grid" style="margin-top: 35px;">
            <span class="info-label">Pagamento</span>
            <span class="info-value">${d.formaPagamento ? escapeHtml(d.formaPagamento) : "PIX à vista"}</span>
            
            ${artist.pixKey ? `<span class="info-label">Chave PIX</span><span class="info-value">${escapeHtml(artist.pixKey)}</span>` : ""}
            
            ${artist.legalName ? `<span class="info-label">Beneficiário</span><span class="info-value">${escapeHtml(artist.legalName)}</span>` : ""}
          </div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Descrição</th>
            <th>QTD</th>
            <th>Preço Unit.</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows.join("")}
        </tbody>
      </table>

      <div class="totals-block">
        <div class="terms">
          <h3>Obrigado pela preferência</h3>
          <p>
            Este orçamento possui validade de 7 dias a partir da data de emissão. A reserva da data na agenda do artista só será confirmada mediante assinatura do contrato de prestação de serviços e pagamento do sinal (50%) através dos dados bancários informados acima.
          </p>
        </div>
        <div class="totals">
          <div class="tot-row">
            <span>SUB TOTAL</span>
            <span>${totalFmt}</span>
          </div>
          <div class="tot-row">
            <span>DESCONTOS</span>
            <span>R$ 0,00</span>
          </div>
          <div class="tot-row grand">
            <span>TOTAL FINAL</span>
            <span>${totalFmt}</span>
          </div>
        </div>
      </div>

      <div class="footer">
        ${artist.whatsapp ? `<span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
          ${escapeHtml(artist.whatsapp)}
        </span>` : ""}
        ${artist.email ? `<span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
          ${escapeHtml(artist.email)}
        </span>` : ""}
        ${artist.website ? `<span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
          ${escapeHtml(artist.website)}
        </span>` : ""}
      </div>

    </div>
  </div>

</body>
</html>`;
}

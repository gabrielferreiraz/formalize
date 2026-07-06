import { escapeHtml, formatData, valorPorExtenso } from "@/lib/templates/utils";
import type { ArtistTemplateData, AssetResult } from "@/lib/templates/types";

type ArtistData = ArtistTemplateData & Record<string, any>;

export async function buildOrc003(
  artist: ArtistData,
  data: Record<string, any>,
  _pageSize?: { width: string; height: string },
  logo?: AssetResult | null,
  _background?: AssetResult | null,
): Promise<string> {
  const d = data;
  const primaryColor = "#000000";
  
  const valorCache = (parseFloat(d.cache) || 0) / 100;
  const valorCacheFormatado = valorCache.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });
  
  const backlineRaw = d.backline;
  const backlineNumerico = (backlineRaw === "valor") ? (parseFloat(d.backlineValor) || 0) / 100 : 0;
  const backlineFormatado = (backlineRaw === "valor" && backlineNumerico > 0)
    ? backlineNumerico.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })
    : (backlineRaw === 'incluso' ? 'Incluso' : null);
  
  const transporteRaw = d.transporte;
  const transporteNumerico = (transporteRaw === "valor") ? (parseFloat(d.transporteValor) || 0) / 100 : 0;
  const transporteFormatado = (transporteRaw === "valor" && transporteNumerico > 0)
    ? transporteNumerico.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })
    : (transporteRaw === 'incluso' ? 'Incluso' : null);
  
  const alimentacaoRaw = d.alimentacao;
  const alimentacaoNumerico = (alimentacaoRaw === "valor") ? (parseFloat(d.alimentacaoValor) || 0) / 100 : 0;
  const alimentacaoFormatado = (alimentacaoRaw === "valor" && alimentacaoNumerico > 0)
    ? alimentacaoNumerico.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })
    : (alimentacaoRaw === 'incluso' ? 'Incluso' : null);
  
  const hospedagemRaw = d.hospedagem;
  const hospedagemNumerico = (hospedagemRaw === "valor") ? (parseFloat(d.hospedagemValor) || 0) / 100 : 0;
  const hospedagemFormatado = (hospedagemRaw === "valor" && hospedagemNumerico > 0)
    ? hospedagemNumerico.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })
    : (hospedagemRaw === 'incluso' ? 'Incluso' : null);
  
  const total = valorCache + backlineNumerico + transporteNumerico + alimentacaoNumerico + hospedagemNumerico;
  const totalFormatado = total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });
  
  const logoMime = logo?.mime || 'image/png';
  const logoBase64 = logo?.base64 || '';
  
  const dataGerada = new Date();
  const dataGeradaFormatada = dataGerada.toLocaleDateString('pt-BR');
  
  const localCompleto = [d.local, d.cidade].filter(Boolean).join(' - ');
  
  const itensTabela = [
    { 
      numero: '01', 
      descricao: `<strong>Apresentação Musical (Cachê)</strong><br><span style="font-size: 12px; color: #888;">Show completo no formato combinado.</span>`, 
      duracao: `${d.horas || "2"}h`, 
      valor: valorCacheFormatado 
    }
  ];
  
  if (backlineFormatado) {
    itensTabela.push({
      numero: '02',
      descricao: '<strong>Backline</strong>',
      duracao: '-',
      valor: backlineFormatado
    });
  }
  
  if (transporteFormatado) {
    const num = String(itensTabela.length + 1).padStart(2, '0');
    itensTabela.push({
      numero: num,
      descricao: '<strong>Transporte e Deslocamento</strong>',
      duracao: '-',
      valor: transporteFormatado
    });
  }
  
  if (alimentacaoFormatado) {
    const num = String(itensTabela.length + 1).padStart(2, '0');
    itensTabela.push({
      numero: num,
      descricao: '<strong>Alimentação (Camarim)</strong>',
      duracao: '-',
      valor: alimentacaoFormatado
    });
  }
  
  if (hospedagemFormatado) {
    const num = String(itensTabela.length + 1).padStart(2, '0');
    itensTabela.push({
      numero: num,
      descricao: '<strong>Hospedagem da Equipe</strong>',
      duracao: '-',
      valor: hospedagemFormatado
    });
  }
  
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Orçamento de Apresentação</title>
  <style>
    /* Configurações de impressão e página */
    @page {
      size: A4;
      margin: 0;
    }
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      color: #333333;
      background-color: #f4f4f4;
      display: flex;
      justify-content: center;
      padding: 20px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* O container que simula a folha A4 */
    .page {
      background-color: #ffffff;
      width: 210mm;
      min-height: 297mm;
      padding: 50mm 20mm 30mm 20mm;
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
      position: relative;
      overflow: hidden;
    }

    /* Detalhes artísticos nos cantos */
    .page::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 15mm;
      background-color: ${primaryColor};
    }

    /* Cabeçalho do Documento */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 40px;
    }

    .header-left h1 {
      font-size: 32px;
      color: #4a5c6a;
      letter-spacing: 2px;
      margin-bottom: 15px;
      text-transform: uppercase;
    }

    .info-block {
      font-size: 13px;
      line-height: 1.6;
      color: #555;
    }

    .info-block strong {
      color: #333;
    }

    .header-right {
      text-align: right;
    }

    .logo {
      font-size: 20px;
      font-weight: bold;
      color: #2c3e50;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 10px;
    }

    .logo img {
      max-height: 60px;
      max-width: 150px;
      object-fit: contain;
    }

    .meta-info {
      display: grid;
      grid-template-columns: auto auto;
      gap: 5px 15px;
      text-align: left;
      font-size: 13px;
    }

    .meta-label {
      color: #777;
      font-weight: bold;
    }

    /* Tabela de Orçamento */
    .invoice-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 40px;
      font-size: 14px;
    }

    .invoice-table th {
      background-color: ${primaryColor};
      color: #ffffff;
      text-align: left;
      padding: 12px 15px;
      font-weight: bold;
      text-transform: uppercase;
      font-size: 12px;
      letter-spacing: 1px;
    }

    .invoice-table td {
      padding: 15px;
      border-bottom: 1px solid #eeeeee;
      color: #555;
    }

    .text-center { text-align: center !important; }
    .text-right { text-align: right !important; }

    /* Linha de Total */
    .summary-section {
      display: flex;
      justify-content: space-between;
      margin-bottom: 50px;
    }

    .terms-conditions {
      width: 50%;
      font-size: 12px;
      color: #777;
    }

    .terms-conditions h3 {
      color: #4a5c6a;
      font-size: 14px;
      margin-bottom: 8px;
      text-transform: uppercase;
    }

    .totals-box {
      width: 35%;
    }

    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 14px;
      color: #555;
    }

    .total-row.grand-total {
      background-color: ${primaryColor};
      color: #ffffff;
      font-weight: bold;
      padding: 12px 15px;
      font-size: 16px;
      margin-top: 10px;
    }

    /* Rodapé de Pagamento e Assinatura */
    .footer-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      font-size: 12px;
    }

    .payment-info {
      line-height: 1.6;
      color: #555;
    }

    .payment-info h3 {
      color: #4a5c6a;
      font-size: 14px;
      margin-bottom: 8px;
    }

    .signature-line {
      width: 200px;
      border-top: 1px solid #333;
      text-align: center;
      padding-top: 8px;
      margin-top: 40px;
      color: #555;
    }
  </style>
</head>
<body>

  <div class="page">
    <!-- Cabeçalho -->
    <div class="header">
      <div class="header-left">
        <h1>Orçamento</h1>
        <div class="info-block">
          ${d.contratante ? `<strong>Orçamento para:</strong><br>${escapeHtml(d.contratante)}` : ""}
        </div>
      </div>
      
      <div class="header-right">
        <div class="logo">
          ${logo ? `<img src="data:${logoMime};base64,${logoBase64}" alt="Logo" />` : ""}
        </div>
        <div class="meta-info">
          <span class="meta-label">Data gerada:</span>
          <span>${dataGeradaFormatada}</span>
          <span class="meta-label">Data do Evento:</span>
          <span>${formatData(d.data)}</span>
          ${d.tipoEvento ? `<span class="meta-label">Tipo:</span><span>${escapeHtml(d.tipoEvento)}</span>` : ""}
          ${localCompleto ? `<span class="meta-label">Local:</span><span>${escapeHtml(localCompleto)}</span>` : ""}
        </div>
      </div>
    </div>

    <!-- Tabela de Serviços e Logística -->
    <table class="invoice-table">
      <thead>
        <tr>
          <th>Item</th>
          <th>Descrição / Serviço</th>
          <th class="text-center">Duração</th>
          <th class="text-right">Valor Total</th>
        </tr>
      </thead>
      <tbody>
        ${itensTabela.map(item => `
          <tr>
            <td>${item.numero}</td>
            <td>${item.descricao}</td>
            <td class="text-center">${item.duracao}</td>
            <td class="text-right">${item.valor}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <!-- Resumo Financeiro -->
    <div class="summary-section">
      <div class="terms-conditions">
        <h3>Termos e Validade</h3>
        <p>O valor apresentado engloba o cachê da apresentação e as despesas listadas como "Inclusas" na tabela acima. Este orçamento possui validade comercial de 7 dias a partir da data de emissão.</p>
      </div>
      
      <div class="totals-box">
        <div class="total-row">
          <span>Subtotal</span>
          <span>${totalFormatado}</span>
        </div>
        <div class="total-row">
          <span>Taxas Extras</span>
          <span>R$ 0,00</span>
        </div>
        <div class="total-row grand-total">
          <span>TOTAL</span>
          <span>${totalFormatado}</span>
        </div>
      </div>
    </div>

    <!-- Rodapé e Assinatura -->
    <div class="footer-section">
      <div class="payment-info">
        <h3>Informações de Pagamento</h3>
        ${d.formaPagamento ? `<strong>Método:</strong> ${escapeHtml(d.formaPagamento)}<br>` : ""}
        ${artist.pixKey ? `<strong>Chave PIX:</strong> ${escapeHtml(artist.pixKey)}<br>` : ""}
        ${artist.bankInfo?.banco ? `<strong>Instituição:</strong> ${escapeHtml(artist.bankInfo.banco)}<br>` : ""}
        <strong>Favorecido:</strong> ${escapeHtml(artist.legalName || artist.name || "")}
      </div>

      <div class="signature">
        <div class="signature-line">
          Assinatura Autorizada (Artista)
        </div>
      </div>
    </div>
  </div>

</body>
</html>`;
}

import { escapeHtml, formatData } from "@/lib/templates/utils";
import type { ArtistTemplateData, AssetResult } from "@/lib/templates/types";

type ArtistData = ArtistTemplateData & Record<string, any>;

export async function buildOrc001(
  artist: ArtistData,
  data: Record<string, any>,
  pageSize?: { width: string; height: string },
  logo?: AssetResult | null,
  background?: AssetResult | null,
): Promise<string> {
  const d = data;
  
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
  const totalFormatado = total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 });
  
  const dataAtual = new Date();
  const mesAno = dataAtual.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const mesAnoFormatado = mesAno.charAt(0).toUpperCase() + mesAno.slice(1);
  
  const localCompleto = [d.local, d.cidade].filter(Boolean).join(' - ');
  
  
  const itensTabela = [
    { 
      numero: '1', 
      descricao: `Cachê de Apresentação (${d.horas || "2"} Horas)`, 
      preco: valorCacheFormatado,
      quantidade: '1',
      total: valorCacheFormatado
    }
  ];
  
  if (backlineFormatado) {
    itensTabela.push({
      numero: String(itensTabela.length + 1),
      descricao: 'Backline',
      preco: '-',
      quantidade: '-',
      total: backlineFormatado
    });
  }
  
  if (transporteFormatado) {
    itensTabela.push({
      numero: String(itensTabela.length + 1),
      descricao: 'Transporte Logístico',
      preco: '-',
      quantidade: '-',
      total: transporteFormatado
    });
  }
  
  if (alimentacaoFormatado) {
    itensTabela.push({
      numero: String(itensTabela.length + 1),
      descricao: 'Alimentação da Equipe',
      preco: '-',
      quantidade: '-',
      total: alimentacaoFormatado
    });
  }
  
  if (hospedagemFormatado) {
    itensTabela.push({
      numero: String(itensTabela.length + 1),
      descricao: 'Hospedagem',
      preco: '-',
      quantidade: '-',
      total: hospedagemFormatado
    });
  }
  
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Orçamento Minimalista</title>
  <style>
    /* Importando fonte limpa e geométrica */
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* ── Base: mobile primeiro ─────────────────────────────────── */
    body {
      font-family: 'Inter', Arial, sans-serif;
      background-color: #ffffff;
      color: #000000;
      font-size: 14px;
      padding: 24px 20px;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    /* Topo: Logo e Social */
    .top-bar {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
      margin-bottom: 32px;
    }

    .logo-box {
      background-color: #000000;
      color: #ffffff;
      padding: 8px 14px;
      font-weight: 600;
      letter-spacing: 2px;
      font-size: 11px;
      text-transform: uppercase;
    }

    .social-handle {
      font-style: italic;
      font-weight: 700;
      letter-spacing: 1px;
      font-size: 11px;
    }

    /* Título Principal e Mês */
    .title-section {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: flex-end;
      gap: 8px;
      margin-bottom: 28px;
    }

    .title-section h1 {
      font-size: 32px;
      font-weight: 800;
      letter-spacing: -1px;
      line-height: 1;
    }

    .title-section h2 {
      font-size: 14px;
      font-weight: 700;
    }

    /* Informações do Cliente e Número */
    .info-section {
      margin-bottom: 28px;
    }

    .client-info p {
      margin-bottom: 5px;
      color: #333333;
      font-size: 13px;
      line-height: 1.5;
    }

    /* ── Tabela de itens ──────────────────────────────────────────
       Em tela larga (tablet/desktop) é uma tabela normal. No celular
       vira uma lista de cards — 5 colunas espremidas ficam ilegíveis
       numa tela de ~380px, então mostramos só o que importa: descrição
       e valor. ── */
    table {
      width: 100%;
      border-collapse: collapse;
    }

    th {
      background-color: #000000;
      color: #ffffff;
      padding: 12px 15px;
      text-align: left;
      font-size: 10px;
      font-weight: 600;
    }

    th:last-child, td:last-child {
      text-align: right;
    }

    td {
      padding: 14px 15px;
      font-size: 13px;
    }

    tbody tr:nth-child(odd) {
      background-color: #F8F9FA;
    }

    td.bold-text {
      font-weight: 700;
    }

    @media screen and (max-width: 640px) {
      thead { display: none; }
      table, tbody, tr { display: block; width: 100%; }
      tbody tr {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 14px 4px;
        border-bottom: 1px solid #eee;
      }
      tbody tr:nth-child(odd) { background: none; }
      /* Nº, Preço unitário e Qt. somem no celular — redundantes com a
         descrição/total quando é sempre "1 item". */
      td:nth-child(1), td:nth-child(3), td:nth-child(4) { display: none; }
      td:nth-child(2) {
        padding: 0;
        font-size: 14px;
        font-weight: 600;
      }
      td:nth-child(5) {
        padding: 0;
        font-size: 15px;
        font-weight: 700;
        white-space: nowrap;
      }
    }

    /* Bloco de Total Final */
    .total-wrapper {
      display: flex;
      justify-content: flex-end;
      margin-top: 12px;
    }

    .total-box {
      background-color: #000000;
      color: #ffffff;
      padding: 12px 22px;
      font-weight: 700;
      font-size: 14px;
      min-width: 130px;
      text-align: right;
    }

    /* Rodapé fixo no layout flex */
    .footer {
      margin-top: auto;
      padding-top: 24px;
      font-weight: 700;
      font-size: 12px;
      line-height: 1.5;
    }

    /* ── Tela larga: volta ao respiro original de folha ──────────── */
    @media screen and (min-width: 640px) {
      body { padding: 60px; font-size: 12px; }
      .top-bar { margin-bottom: 60px; }
      .title-section { margin-bottom: 50px; }
      .title-section h1 { font-size: 42px; letter-spacing: -1.5px; }
      .title-section h2 { font-size: 18px; }
      .info-section { margin-bottom: 40px; }
      .client-info p { font-size: 11px; }
      td { font-size: 11px; }
      td.bold-text { font-size: 12px; }
      .footer { font-size: 11px; padding-top: 0; }
    }

    /* ── Impressão: sempre a folha A4 original, sem exceção ──────── */
    @media print {
      @page { size: A4; margin: 0; }
      body { padding: 60px; font-size: 12px; }
      .top-bar { margin-bottom: 60px; }
      .title-section { margin-bottom: 50px; }
      .title-section h1 { font-size: 42px; letter-spacing: -1.5px; }
      .title-section h2 { font-size: 18px; }
      .info-section { margin-bottom: 40px; }
      .client-info p { font-size: 11px; }
      thead { display: table-header-group; }
      table, tbody, tr { display: table; width: 100%; }
      tbody tr { display: table-row; }
      td { display: table-cell; font-size: 11px; padding: 16px 15px; }
      td:nth-child(1), td:nth-child(3), td:nth-child(4) { display: table-cell; }
      td.bold-text { font-size: 12px; }
      tr, .total-wrapper, .footer { break-inside: avoid; }
      .footer { font-size: 11px; padding-top: 0; }
    }
  </style>
</head>
<body>

    <!-- Topo da Página -->
    <div class="top-bar">
        <div class="logo-box">${escapeHtml(artist.name || "NOME DO ARTISTA")}</div>
        ${artist.instagram ? `<div class="social-handle">${artist.instagram.replace('https://www.instagram.com/', '@').replace('https://instagram.com/', '@').replace('/', '')}</div>` : ''}
    </div>

    <!-- Título Principal -->
    <div class="title-section">
        <h1>Orçamento</h1>
        <h2>${mesAnoFormatado}</h2>
    </div>

    <!-- Informações de Contato / Evento -->
    <div class="info-section">
        <div class="client-info">
            ${d.contratante ? `<p><strong>Para:</strong> ${escapeHtml(d.contratante)}</p>` : ''}
            <p><strong>Evento:</strong> ${escapeHtml(d.evento || '')} ${d.data ? `(${formatData(d.data)})` : ''}</p>
            ${localCompleto ? `<p><strong>Local:</strong> ${escapeHtml(localCompleto)}</p>` : ''}
        </div>
    </div>

    <!-- Tabela de Valores -->
    <table>
        <thead>
            <tr>
                <th width="10%">Nº</th>
                <th width="50%">Descrição do Serviço</th>
                <th width="15%">Preço</th>
                <th width="10%">Qt.</th>
                <th width="15%">Total</th>
            </tr>
        </thead>
        <tbody>
            ${itensTabela.map((item, index) => `
            <tr>
                <td class="bold-text">${item.numero}</td>
                <td>${item.descricao}</td>
                <td class="bold-text">${item.preco}</td>
                <td>${item.quantidade}</td>
                <td class="bold-text">${item.total}</td>
            </tr>
            `).join('')}
        </tbody>
    </table>

    <!-- Caixa de Total -->
    <div class="total-wrapper">
        <div class="total-box">
            ${totalFormatado}
        </div>
    </div>

    <!-- Rodapé -->
    <div class="footer">
        Pagamento: ${d.formaPagamento ? escapeHtml(d.formaPagamento) : 'PIX à vista'}
        ${artist.pixKey ? ` (Chave: ${escapeHtml(artist.pixKey)})` : ''}
    </div>

</body>
</html>`;
}

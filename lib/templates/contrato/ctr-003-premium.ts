import crypto from "crypto";
import { escapeHtml, formatData, valorPorExtenso } from "@/lib/templates/utils";
import type { ArtistTemplateData, AssetResult } from "@/lib/templates/types";
import { getTextosCategoria } from "@/lib/templates/contrato/artist-texts";

type ArtistData = ArtistTemplateData & Record<string, any>;

export async function buildCtr003(
  artist: ArtistData,
  data: Record<string, any>,
  _pageSize?: { width: string; height: string },
  logo?: AssetResult | null,
  _background?: AssetResult | null,
): Promise<string> {
  const d = data;
  const primary = artist.primaryColor || "#e59a18";
  const addr = (artist.address as any) || {};
  const bank = (artist.bankInfo as any) || {};
  
  const valorCache = (parseFloat(d.cache) || 0) / 100;
  const backlineN = d.backline === "valor" ? (parseFloat(d.backlineValor) || 0) / 100 : 0;
  const transporteN = d.transporte === "valor" ? (parseFloat(d.transporteValor) || 0) / 100 : 0;
  const valorTotal = valorCache + backlineN + transporteN;
  const totalFmt = valorTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });
  const cacheFmt = valorCache.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });

  const enderecoContratante = d.logradouro 
    ? `${d.logradouro} Nº ${d.numero || ""}, ${d.bairro || ""}, ${d.cidade || ""}/${d.uf || ""}`
    : "";
  const enderecoArtista = addr.rua
    ? `${addr.rua} Nº ${addr.numero || ""}, Bairro ${addr.bairro || ""}, ${addr.cidade || ""}/${addr.estado || ""}`
    : "Rua das Folhagens Nº 280, Campo Grande/MS";
  
  const dataEventoBr = formatData(d.data);
  const dataEventoEn = d.data ? new Date(d.data).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : dataEventoBr;
  
  const textos = getTextosCategoria(artist.categoria);
  const horasNum = d.horas || 3;
  const horasFormatado = horasNum % 1 !== 0 ? `${Math.floor(horasNum)}:30` : `${horasNum}:00`;
  const pessoasBanda = d.pessoasBanda || textos.pessoasDefault || 7;
  const instruments = artist.instruments || "Bateria, Percussão, Guitarra, Baixo e Sanfona";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Contrato de Prestação de Serviços Artísticos - ${escapeHtml(artist.name)}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800;900&family=Caveat:wght@700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            background-color: #f1f5f9;
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
            background-color: #06080f;
            border: 14px solid ${primary};
            padding: 10px;
            display: flex;
            flex-direction: column;
            box-shadow: 0 25px 60px rgba(0,0,0,0.5);
            flex-shrink: 0;
        }
        .inner-frame {
            border: 1.5px solid ${primary};
            height: 100%;
            width: 100%;
            padding: 30px 40px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            box-sizing: border-box;
        }
        @media print {
            @page { size: A4; margin: 0; }
            body { background-color: #ffffff; padding: 0; }
            .sheet { box-shadow: none; margin: 0; width: 210mm; height: 297mm; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }

        .header-section {
            display: flex;
            flex-direction: column;
            align-items: center;
            margin-bottom: 15px;
        }
        .logo-container {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 5px;
        }
        .logo-graphic {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }
        .logo-bar {
            width: 25px;
            height: 4px;
            background-color: #ffffff;
            border-radius: 1px;
        }
        .logo-bar.mid { width: 18px; }
        .logo-bar.short { width: 22px; }
        .logo-text {
            font-family: 'Montserrat', sans-serif;
            font-size: 20px;
            font-weight: 900;
            letter-spacing: 4px;
            color: #ffffff;
            line-height: 1;
        }
        .logo-tagline {
            font-family: 'Montserrat', sans-serif;
            font-size: 7px;
            font-weight: 600;
            letter-spacing: 2.5px;
            color: ${primary};
            text-transform: uppercase;
            margin-top: 2px;
        }
        .meta-container {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-bottom: 20px;
            font-family: 'Montserrat', sans-serif;
        }

        .meta-left { line-height: 1.4; }
        .meta-title-name {
            font-size: 11px;
            font-weight: 800;
            color: #ffffff;
            letter-spacing: 0.5px;
            text-transform: uppercase;
        }
        .meta-title-role {
            font-size: 8px;
            font-weight: 600;
            color: ${primary};
            text-transform: uppercase;
            margin-bottom: 8px;
            letter-spacing: 0.5px;
        }
        .meta-row {
            font-size: 8px;
            color: #b3b8c6;
            display: flex;
            gap: 5px;
        }
        .meta-row strong {
            color: ${primary};
            font-weight: 700;
        }
        .meta-right {
            text-align: right;
            font-size: 8.5px;
            font-weight: 700;
            color: #ffffff;
            letter-spacing: 0.5px;
            text-transform: uppercase;
        }
        .meta-right span {
            color: ${primary};
            margin-left: 4px;
        }
        .document-title {
            font-family: 'Montserrat', sans-serif;
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 2px;
            color: #ffffff;
            text-align: center;
            border-bottom: 1px solid rgba(229, 154, 24, 0.3);
            padding-bottom: 6px;
            margin-bottom: 12px;
        }

        .intro-paragraph {
            font-family: 'Montserrat', sans-serif;
            font-size: 7.5px;
            line-height: 1.4;
            color: #b3b8c6;
            text-align: justify;
            margin-bottom: 15px;
        }
        .intro-paragraph strong {
            color: #ffffff;
            font-weight: 700;
        }
        .clauses-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px 25px;
            flex-grow: 1;
            font-family: 'Montserrat', sans-serif;
        }
        .grid-full-width { grid-column: 1 / -1; }
        .clause-block { text-align: justify; }
        .clause-block h4 {
            font-size: 8px;
            font-weight: 800;
            color: #ffffff;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 3px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            padding-bottom: 2px;
        }
        .clause-block p {
            font-size: 7px;
            line-height: 1.35;
            color: #b3b8c6;
        }
        .clause-block strong {
            color: #ffffff;
            font-weight: 700;
        }
        .clause-highlight {
            font-size: 6.5px;
            font-style: italic;
            color: ${primary};
            margin-top: 1px;
            border-left: 1.5px solid ${primary};
            padding-left: 4px;
        }

        .financial-box {
            border: 1px solid rgba(229, 154, 24, 0.4);
            background-color: rgba(255, 255, 255, 0.02);
            padding: 5px;
            margin-top: 4px;
            font-size: 7px;
        }
        .financial-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 1.5px;
            color: #b3b8c6;
        }
        .financial-row.total {
            font-weight: 800;
            border-top: 1px dashed rgba(229, 154, 24, 0.4);
            padding-top: 1.5px;
            margin-top: 1.5px;
            color: #ffffff;
        }
        .signatures-section {
            display: flex;
            justify-content: space-between;
            margin-top: 20px;
            margin-bottom: 20px;
            padding: 0 10px;
            font-family: 'Montserrat', sans-serif;
        }
        .sig-card {
            width: 42%;
            text-align: center;
        }
        .sig-handwritten {
            font-family: 'Caveat', cursive;
            font-size: 18px;
            color: #ffffff;
            margin-bottom: -4px;
            height: 22px;
        }
        .sig-line {
            width: 100%;
            height: 1px;
            background-color: ${primary};
            margin-bottom: 4px;
        }
        .sig-card strong {
            font-size: 8px;
            font-weight: 800;
            color: #ffffff;
            text-transform: uppercase;
            display: block;
        }
        .sig-card span {
            font-size: 6.5px;
            color: ${primary};
            text-transform: uppercase;
            font-weight: 600;
        }

        .footer-bar {
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            padding-top: 12px;
            display: flex;
            justify-content: space-between;
            font-family: 'Montserrat', sans-serif;
        }
        .footer-col {
            display: flex;
            align-items: center;
            gap: 8px;
            width: 30%;
        }
        .footer-icon-box {
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .footer-icon {
            width: 12px;
            height: 12px;
            fill: ${primary};
        }
        .footer-text {
            display: flex;
            flex-direction: column;
        }
        .footer-text span {
            font-size: 7px;
            color: #b3b8c6;
            line-height: 1.3;
        }
    </style>
</head>
<body>
    <div class="sheet">
        <div class="inner-frame">
            <header class="header-section">
                <div class="logo-container">
                    <div class="logo-graphic">
                        <div class="logo-bar"></div>
                        <div class="logo-bar mid"></div>
                        <div class="logo-bar short"></div>
                    </div>
                    <div class="logo-text">${escapeHtml(artist.name).toUpperCase()}</div>
                </div>
                <div class="logo-tagline">Entertainment Services</div>
            </header>

            <div class="meta-container">
                <div class="meta-left">
                    <div class="meta-title-name">${escapeHtml(d.contratanteNome || "")}</div>
                    <div class="meta-title-role">CONTRATANTE</div>
                    <div class="meta-row"><strong>A :</strong> ${escapeHtml(enderecoContratante)}</div>
                    <div class="meta-row"><strong>E :</strong> ${escapeHtml(d.contratanteEmail || "")}</div>
                </div>
                <div class="meta-right">
                    Date: <span>${dataEventoEn}</span>
                </div>
            </div>
            
            <div class="document-title">
                CONTRATO DE PRESTAÇÃO DE SERVIÇOS MUSICAIS E ARTÍSTICOS
            </div>
            
            <div class="intro-paragraph">
                Pelo presente instrumento de prestação de serviços, de um lado qualificado como <strong>CONTRATANTE</strong>, <strong>${escapeHtml(d.contratanteNome || "")}</strong>, CPF: ${escapeHtml(d.contratanteCpfCnpj || "")}, e de outro lado como <strong>CONTRATADO</strong>, <strong>${escapeHtml(artist.name)}</strong>, inscrito sob o CNPJ: ${escapeHtml(artist.cnpj || "")}, residente na ${escapeHtml(enderecoArtista)}, celebram o presente termo mediante as cláusulas técnicas e operacionais dispostas abaixo:
            </div>
            
            <div class="clauses-grid">
                <div class="clause-block">
                    <h4>01. Cronograma e Horário</h4>
                    <p>O CONTRATADO compromete-se a executar a apresentação artística na data de <strong>${escapeHtml(dataEventoBr)}</strong>, iniciando às <strong>${escapeHtml(d.horario || "21:00")}h</strong>.</p>
                </div>
                
                <div class="clause-block">
                    <h4>02. Local e Duração</h4>
                    <p>O evento ocorrerá nas dependências do <strong>${escapeHtml(d.local || "")}, ${escapeHtml(d.cidadeEvento || "")}</strong>, com tempo total de <strong>${horasFormatado}hs</strong> de show.</p>
                </div>

                
                <div class="clause-block">
                    <h4>03. Formato do Show</h4>
                    <p>O artista se apresentará no formato de banda completa contendo: ${escapeHtml(instruments)} para suporte cênico.</p>
                </div>
                
                <div class="clause-block">
                    <h4>04. Logística e Camarim</h4>
                    <p>Deslocamento terrestre e logística do artista estão cobertos.</p>
                    <p class="clause-highlight">O fornecimento de alimentação e água para equipe (${pessoasBanda} pessoas) é de obrigação do CONTRATANTE.</p>
                </div>
                
                <div class="clause-block">
                    <h4>05. Honorários do Artista</h4>
                    <p>O show artístico é ajustado pelo valor global de ${escapeHtml(totalFmt)}.</p>
                    <div class="financial-box">
                        <div class="financial-row"><span>Cachê Artístico</span> <span>${escapeHtml(cacheFmt)}</span></div>
                        <div class="financial-row total"><span>Total Líquido</span> <span>${escapeHtml(totalFmt)}</span></div>
                    </div>
                </div>
                
                <div class="clause-block">
                    <h4>06. Rescisão Unilateral</h4>
                    <p>O cancelamento sem justa causa implicará em multa:</p>
                    <p style="font-size: 6.5px; color:#b3b8c6; margin-top: 2.5px;">• 10% do valor total com até 15 dias de antecedência.</p>
                    <p style="font-size: 6.5px; color:#b3b8c6;">• 50% do valor integral se cancelado no dia da apresentação.</p>
                </div>

                
                <div class="clause-block grid-full-width">
                    <h4>07. Condições de Faturamento e Chave PIX</h4>
                    <p>O faturamento dar-se-á em duas etapas: <strong>50% no fechamento deste instrumento e 50% até uma semana antes do evento.</strong></p>
                    <div class="financial-box" style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong style="font-size: 7px; color: #ffffff;">DADOS DE DEPÓSITO (PIX)</strong>
                            <p>Favorecido: ${escapeHtml(bank.titular || artist.legalName || artist.name || "")}  |  Chave CNPJ: ${escapeHtml(bank.pix || artist.pixKey || "")}</p>
                        </div>
                        <div style="text-align: right;">
                            <strong style="font-size: 7px; color: #ffffff;">CONTA DE LIQUIDAÇÃO</strong>
                            <p>${escapeHtml(bank.banco || "")}  |  Conta Corrente: ${escapeHtml(bank.conta || "")}</p>
                        </div>
                    </div>
                </div>
                
                <div class="clause-block">
                    <h4>08. ECAD e Licenciamento</h4>
                    <p>Alvarás de segurança física, bombeiros e licença de execução pública do ECAD competem exclusivamente ao CONTRATANTE.</p>
                </div>
                
                <div class="clause-block">
                    <h4>09. Legislação de Foro</h4>
                    <p>Fica eleito o foro da comarca de ${escapeHtml(addr.cidade || "Campo Grande")}-${escapeHtml(addr.estado || "MS")} para dirimir eventuais litígios oriundos da interpretação deste contrato.</p>
                </div>
            </div>

            
            <div class="signatures-section">
                <div class="sig-card">
                    <div class="sig-handwritten">${escapeHtml(d.contratanteNome || "")}</div>
                    <div class="sig-line"></div>
                    <strong>${escapeHtml(d.contratanteNome || "")}</strong>
                    <span>Contratante</span>
                </div>
                <div class="sig-card">
                    <div class="sig-handwritten">${escapeHtml(artist.name)}</div>
                    <div class="sig-line"></div>
                    <strong>${escapeHtml(artist.legalName || artist.name)}</strong>
                    <span>Contratado</span>
                </div>
            </div>
            
            <footer class="footer-bar">
                <div class="footer-col">
                    <div class="footer-icon-box">
                        <svg class="footer-icon" viewBox="0 0 24 24">
                            <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                        </svg>
                    </div>
                    <div class="footer-text">
                        <span>${escapeHtml(artist.whatsapp || "(67) 99999-1234")}</span>
                        <span>${escapeHtml(artist.phone || "(67) 3333-5678")}</span>
                    </div>
                </div>

                
                <div class="footer-col" style="justify-content: center;">
                    <div class="footer-icon-box">
                        <svg class="footer-icon" viewBox="0 0 24 24">
                            <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                        </svg>
                    </div>
                    <div class="footer-text">
                        <span>${escapeHtml(artist.email || "contato@artista.com.br")}</span>
                        <span>www.${escapeHtml(artist.name.toLowerCase().replace(/\s+/g, ""))}.com.br</span>
                    </div>
                </div>
                
                <div class="footer-col" style="justify-content: flex-end;">
                    <div class="footer-icon-box">
                        <svg class="footer-icon" viewBox="0 0 24 24">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                        </svg>
                    </div>
                    <div class="footer-text" style="text-align: right;">
                        <span>${escapeHtml(addr.rua || "Rua das Folhagens, 280, Carandá")}</span>
                        <span>${escapeHtml(addr.cidade || "Campo Grande")} - ${escapeHtml(addr.estado || "MS")}, ${escapeHtml(addr.cep || "79022-220")}</span>
                    </div>
                </div>
            </footer>
        </div>
    </div>
</body>
</html>`;
}

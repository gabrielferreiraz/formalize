"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { IconCheck, IconShare, IconX, IconDoc } from "./icons";

interface PdfReadyModalProps {
  pdfUrl: string;
  documentId: string;
  onClose: () => void;
  documentType: 'orcamento' | 'contrato';
}

export function PdfReadyModal({ pdfUrl, documentId, onClose, documentType }: PdfReadyModalProps) {
  const [mounted, setMounted] = useState(false);
  const [webUrl, setWebUrl] = useState<string | null>(null);
  const [webError, setWebError] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const label = documentType === 'contrato' ? 'Contrato' : 'Orçamento';

  // Gera (ou recupera) o link da página web assim que o modal abre — pronto
  // pra usar sem a pessoa precisar esperar depois de clicar.
  useEffect(() => {
    let cancelled = false;
    setWebUrl(null);
    setWebError(false);
    fetch(`/api/documents/${documentId}/share`, { method: "POST" })
      .then((res) => {
        if (!res.ok) throw new Error(`status ${res.status}`);
        return res.json();
      })
      .then((json) => { if (!cancelled && json.url) setWebUrl(json.url); })
      .catch(() => { if (!cancelled) setWebError(true); });
    return () => { cancelled = true; };
  }, [documentId]);

  useEffect(() => {
    // Bloquear scroll do body
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  const handleOpenWeb = () => {
    if (webUrl) window.open(webUrl, '_blank');
  };

  const handleShareWeb = async () => {
    if (!webUrl) return;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${label} gerado pelo Formalize`, url: webUrl });
      } else {
        await navigator.clipboard.writeText(webUrl);
        alert("Link copiado para a área de transferência!");
      }
    } catch {
      // usuário cancelou o share nativo — sem erro pra mostrar
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overlay-fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100dvh', overscrollBehavior: 'contain' }}>
      <div className="relative w-full max-w-md bg-stage-900 border border-stage-700 rounded-3xl overflow-hidden shadow-2xl modal-scale-in">

        {/* Botão Fechar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
        >
          <IconX size={20} />
        </button>

        <div className="p-8 text-center">
          {/* Ícone de Sucesso */}
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 bg-gold-500/20 rounded-full animate-pulse" />
            <div className="absolute inset-2 bg-gold-500 rounded-full flex items-center justify-center text-stage-950 shadow-[0_0_20px_rgba(245,200,66,0.4)] success-icon-pop">
              <IconCheck size={32} />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">
            {label} pronto!
          </h2>
          <p className="text-gray-400 text-sm mb-8">
            Envie a página web pro cliente ver — ou baixe o PDF, se preferir.
          </p>

          <div className="grid grid-cols-1 gap-3">
            {/* Primary: página web (link rastreável, sempre atualizado) */}
            <button
              onClick={handleOpenWeb}
              disabled={!webUrl}
              className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl bg-gold-500 font-bold hover:bg-gold-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-stage-950"
            >
              {webUrl ? (
                <>
                  <IconDoc size={20} />
                  Ver página web
                </>
              ) : webError ? (
                "Link indisponível"
              ) : (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-stage-950/30 border-t-stage-950 animate-spin inline-block" />
                  Preparando link...
                </>
              )}
            </button>

            <div className="grid grid-cols-3 gap-3">
              {/* Ver PDF diretamente */}
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-stage-800 border border-stage-700 text-white font-semibold hover:bg-stage-700 transition-colors no-underline text-sm"
              >
                PDF
              </a>

              {/* Download — works on all desktop/mobile browsers */}
              <a
                href={pdfUrl}
                download={`${label}_${new Date().getTime()}.pdf`}
                className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-stage-800 border border-stage-700 text-white font-semibold hover:bg-stage-700 transition-colors no-underline text-sm"
              >
                ↓ Baixar
              </a>

              <button
                onClick={handleShareWeb}
                disabled={!webUrl}
                className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-stage-800 border border-stage-700 text-white font-semibold hover:bg-stage-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <IconShare size={16} />
                Enviar
              </button>
            </div>
          </div>
        </div>

        {/* Rodapé decorativo */}
        <div className="bg-stage-800/50 p-4 border-t border-stage-700/50 text-center">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
            Formalize &bull; Entretenimento Musical
          </p>
        </div>
      </div>

      <style jsx>{`
        .overlay-fade-in {
          animation: fadeIn 0.3s ease-out both;
        }
        .modal-scale-in {
          animation: scaleIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .success-icon-pop {
          animation: iconPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s both;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes iconPop {
          from { opacity: 0; transform: scale(0.5); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>,
    document.body
  );
}

"use client";

import React from "react";
import { IconCheck, IconWhatsApp, IconShare, IconX, IconDoc } from "./icons";

interface PdfReadyModalProps {
  pdfUrl: string;
  onClose: () => void;
  documentType: 'orcamento' | 'contrato';
}

export function PdfReadyModal({ pdfUrl, onClose, documentType }: PdfReadyModalProps) {
  const label = documentType === 'contrato' ? 'Contrato' : 'Orçamento';

  const handleShare = async () => {
    try {
      const response = await fetch(pdfUrl);
      const blob = await response.blob();
      const fileName = `${label}_${new Date().getTime()}.pdf`;
      const file = new File([blob], fileName, { type: 'application/pdf' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `${label} gerado pelo Formalize`,
        });
      } else if (navigator.share) {
        await navigator.share({
          title: `${label} gerado pelo Formalize`,
          url: pdfUrl
        });
      } else {
        await navigator.clipboard.writeText(pdfUrl);
        alert("Link copiado para a área de transferência!");
      }
    } catch (err) {
      console.error("Erro ao compartilhar", err);
      // Fallback para link se der erro no download
      if (navigator.share) {
        navigator.share({ url: pdfUrl });
      } else {
        navigator.clipboard.writeText(pdfUrl);
        alert("Link copiado!");
      }
    }
  };

  const handleWhatsApp = async () => {
    try {
      const response = await fetch(pdfUrl);
      const blob = await response.blob();
      const fileName = `${label}_${new Date().getTime()}.pdf`;
      const file = new File([blob], fileName, { type: 'application/pdf' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `${label} gerado pelo Formalize`,
        });
      } else {
        // Fallback: Se não puder compartilhar o arquivo diretamente, abre o link
        const text = encodeURIComponent(`${label} gerado pelo Formalize:\n${pdfUrl}`);
        window.open(`https://wa.me/?text=${text}`, '_blank');
      }
    } catch (err) {
      console.error("Erro ao compartilhar arquivo no WhatsApp", err);
      // Fallback básico em caso de erro no fetch
      const text = encodeURIComponent(`${label} gerado pelo Formalize:\n${pdfUrl}`);
      window.open(`https://wa.me/?text=${text}`, '_blank');
    }
  };

  const handleOpen = () => {
    window.open(pdfUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overlay-fade-in">
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
            PDF gerado com sucesso!
          </h2>
          <p className="text-gray-400 text-sm mb-8">
            Seu {label.toLowerCase()} está pronto para ser enviado ou visualizado.
          </p>

          <div className="grid grid-cols-1 gap-3">
            <button
              onClick={handleOpen}
              className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl bg-white text-stage-950 font-bold hover:bg-gray-100 transition-colors"
            >
              <IconDoc size={20} />
              Abrir PDF
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleShare}
                className="flex items-center justify-center gap-3 py-4 rounded-2xl bg-stage-800 border border-stage-700 text-white font-semibold hover:bg-stage-700 transition-colors"
              >
                <IconShare size={18} />
                Compartilhar
              </button>

              <button
                onClick={handleWhatsApp}
                className="flex items-center justify-center gap-3 py-4 rounded-2xl bg-green-600/10 border border-green-600/30 text-green-500 font-semibold hover:bg-green-600/20 transition-colors"
              >
                <IconWhatsApp size={18} />
                WhatsApp
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
    </div>
  );
}

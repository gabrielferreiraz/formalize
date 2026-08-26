"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

interface Props {
  html: string;
  title: string;
  background?: string;
}

interface Fit {
  scale: number;
  width: number;
  height: number;
}

export interface ScaledIframeHandle {
  print: () => void;
}

/**
 * Renderiza HTML de tamanho fixo (folha A4, pensado pra virar PDF) dentro de
 * um iframe, ajustando a escala automaticamente pra caber no container —
 * sem exigir que o template tenha CSS responsivo próprio. Funciona igual
 * pra qualquer template, presente ou futuro.
 *
 * allow-scripts fica de fora do sandbox de propósito: o conteúdo vem de
 * dados preenchidos por terceiros (formulário do orçamento/contrato) — não
 * precisa rodar JS pra ser exibido, só medido/impresso (feito pelo pai via
 * ref, permitido por allow-same-origin).
 */
export const ScaledIframe = forwardRef<ScaledIframeHandle, Props>(function ScaledIframe(
  { html, title, background = "#4b4f57" },
  ref,
) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState<Fit | null>(null);

  useImperativeHandle(ref, () => ({
    print: () => iframeRef.current?.contentWindow?.print(),
  }));

  useEffect(() => {
    const iframe = iframeRef.current;
    const wrapper = wrapperRef.current;
    if (!iframe || !wrapper) return;

    function measure() {
      const doc = iframe!.contentDocument;
      if (!doc?.documentElement || !wrapper) return;
      const naturalWidth = doc.documentElement.scrollWidth;
      const naturalHeight = doc.documentElement.scrollHeight;
      if (!naturalWidth || !naturalHeight) return;
      const availableWidth = wrapper.clientWidth;
      const scale = availableWidth > 0 ? Math.min(1, availableWidth / naturalWidth) : 1;
      setFit({ scale, width: naturalWidth, height: naturalHeight });
    }

    iframe.addEventListener("load", measure);
    window.addEventListener("resize", measure);
    measure(); // srcDoc pode já estar carregado quando o efeito roda

    return () => {
      iframe.removeEventListener("load", measure);
      window.removeEventListener("resize", measure);
    };
  }, [html]);

  return (
    <div
      ref={wrapperRef}
      style={{ width: "100%", height: "100%", overflow: "auto", background, display: "flex", justifyContent: "center" }}
    >
      <div style={{ width: fit ? fit.width * fit.scale : "100%", height: fit ? fit.height * fit.scale : "100%", flexShrink: 0 }}>
        <iframe
          ref={iframeRef}
          srcDoc={html}
          title={title}
          sandbox="allow-same-origin allow-modals"
          style={{
            border: "none",
            display: "block",
            background: "#fff",
            width: fit ? fit.width : "100%",
            height: fit ? fit.height : "100%",
            transform: fit ? `scale(${fit.scale})` : undefined,
            transformOrigin: "top left",
          }}
        />
      </div>
    </div>
  );
});

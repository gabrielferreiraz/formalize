"use client";

import { useState, useEffect } from "react";

const PHRASES = [
  "Quer entender melhor?",
  "Fale com um especialista",
  "Tem alguma dúvida?",
  "A gente responde rápido",
  "Estamos no WhatsApp",
];

const WA_LINK = `https://wa.me/5567981783902?text=${encodeURIComponent("Olá! Vi a Formalize e quero saber mais sobre o acesso para artistas.")}`;

export function WhatsAppFloat() {
  const [idx, setIdx] = useState(0);
  const [show, setShow] = useState(false);    // entrada da bolinha
  const [bubble, setBubble] = useState(true); // visibilidade da bolinha
  const [fade, setFade] = useState(true);     // transição de frase

  // Entrada: aparece após 2.5s
  useEffect(() => {
    const t = setTimeout(() => setShow(true), 2500);
    return () => clearTimeout(t);
  }, []);

  // Após 22s visível, esconde a bolinha com fade-out
  useEffect(() => {
    if (!show) return;
    const t = setTimeout(() => setBubble(false), 22000);
    return () => clearTimeout(t);
  }, [show]);

  // Cicla frases a cada 4s com fade-out/in
  useEffect(() => {
    if (!bubble) return;
    const iv = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setIdx((i) => (i + 1) % PHRASES.length);
        setFade(true);
      }, 300);
    }, 4000);
    return () => clearInterval(iv);
  }, [bubble]);

  return (
    <div
      style={{
        position: "fixed",
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 20px)",
        right: 20,
        zIndex: 999,
        display: "flex",
        alignItems: "center",
        gap: 10,
        pointerEvents: "none",
      }}
    >
      {/* Bubble */}
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: "9px 14px",
          fontSize: 13,
          fontWeight: 600,
          fontFamily: "'Inter', system-ui, sans-serif",
          color: "#111",
          boxShadow: "0 4px 24px rgba(0,0,0,0.14)",
          whiteSpace: "nowrap",
          position: "relative",
          pointerEvents: "none",
          opacity: show && bubble ? 1 : 0,
          transform: show && bubble ? "translateX(0) scale(1)" : "translateX(16px) scale(0.95)",
          transition: "opacity 0.45s cubic-bezier(0.22,1,0.36,1), transform 0.45s cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        {/* phrase with own fade */}
        <span
          style={{
            display: "inline-block",
            opacity: fade ? 1 : 0,
            transform: fade ? "translateY(0)" : "translateY(-4px)",
            transition: "opacity 0.28s ease, transform 0.28s ease",
          }}
        >
          {PHRASES[idx]}
        </span>

        {/* triangle pointing right */}
        <span
          style={{
            position: "absolute",
            right: -7,
            top: "50%",
            transform: "translateY(-50%)",
            width: 0,
            height: 0,
            borderTop: "7px solid transparent",
            borderBottom: "7px solid transparent",
            borderLeft: "7px solid #fff",
            filter: "drop-shadow(2px 0 2px rgba(0,0,0,0.06))",
          }}
        />
      </div>

      {/* Button */}
      <a
        href={WA_LINK}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Falar no WhatsApp"
        style={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #2de072 0%, #20ba5a 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 20px rgba(37,211,102,0.4), 0 1px 0 rgba(255,255,255,0.2) inset",
          textDecoration: "none",
          flexShrink: 0,
          pointerEvents: "auto",
          transition: "transform 0.18s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.18s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.1)";
          e.currentTarget.style.boxShadow = "0 6px 28px rgba(37,211,102,0.55), 0 1px 0 rgba(255,255,255,0.2) inset";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "0 4px 20px rgba(37,211,102,0.4), 0 1px 0 rgba(255,255,255,0.2) inset";
        }}
      >
        <svg width="27" height="27" viewBox="0 0 24 24" fill="white">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.096.538 4.066 1.482 5.782L0 24l6.382-1.465A11.935 11.935 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.886 0-3.65-.502-5.17-1.38l-.37-.22-3.789.869.936-3.68-.242-.379A9.953 9.953 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
        </svg>
      </a>
    </div>
  );
}

import Link from "next/link";
import Image from "next/image";
import { RequestForm } from "@/components/RequestForm";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#07090e] font-body text-gray-100 overflow-x-hidden selection:bg-gold-500/30">
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(-3deg); }
          50% { transform: translateY(-18px) rotate(-3deg); }
        }
        @keyframes floatBadge {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInLeft {
          from { opacity: 0; transform: translateX(-28px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeInRight {
          from { opacity: 0; transform: translateX(28px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes glowPulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50%       { opacity: 0.6; transform: scale(1.08); }
        }
        @keyframes badgePop {
          from { opacity: 0; transform: scale(0.8) translateY(-8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }

        .anim-up   { animation: fadeInUp   0.7s cubic-bezier(0.22,1,0.36,1) both; }
        .anim-left { animation: fadeInLeft 0.7s cubic-bezier(0.22,1,0.36,1) both; }
        .anim-right{ animation: fadeInRight 0.7s cubic-bezier(0.22,1,0.36,1) both; }
        .anim-badge{ animation: badgePop   0.5s cubic-bezier(0.34,1.56,0.64,1) both; }
        .anim-glow { animation: glowPulse  4s ease-in-out infinite; }
        .anim-float{ animation: float      5s ease-in-out infinite; }
        .anim-float-badge { animation: floatBadge 4s ease-in-out infinite; }

        .d1 { animation-delay: 0.05s; }
        .d2 { animation-delay: 0.15s; }
        .d3 { animation-delay: 0.25s; }
        .d4 { animation-delay: 0.35s; }
        .d5 { animation-delay: 0.45s; }
        .d6 { animation-delay: 0.55s; }

        .shimmer-text {
          background: linear-gradient(90deg, #f5c842 0%, #fde68a 40%, #f5c842 60%, #dba000 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 3s linear infinite;
        }

        .card-lift {
          transition: transform 0.3s cubic-bezier(0.22,1,0.36,1), box-shadow 0.3s, border-color 0.3s;
        }
        .card-lift:hover {
          transform: translateY(-5px);
          box-shadow: 0 24px 64px rgba(0,0,0,0.45);
        }
      `}</style>

      {/* ── Navbar ── */}
      <header className="fixed top-0 left-0 right-0 z-50 w-full border-b border-white/5 bg-[#07090e]/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/icon-512.png" alt="Formalize" width={28} height={28} style={{ borderRadius: 7 }} priority />
            <span className="font-bold text-lg tracking-wide text-white">Formalize</span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="#solicitar"
              className="hidden sm:flex px-5 py-2 rounded-full bg-gold-500/10 border border-gold-500/20 text-gold-400 text-sm font-semibold transition-all hover:bg-gold-500/20"
            >
              Solicitar acesso
            </a>
            <Link
              href="/login"
              className="px-5 py-2 rounded-full bg-white/5 hover:bg-white/10 text-white text-sm font-semibold transition-all border border-white/8"
            >
              Entrar
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative pt-24 pb-16 px-6 overflow-hidden min-h-screen flex items-center">
        {/* Ambient glows */}
        <div className="anim-glow absolute top-1/4 left-1/4 w-[700px] h-[500px] bg-gold-500/8 rounded-full blur-[150px] pointer-events-none" />
        <div className="anim-glow d6 absolute bottom-1/4 right-1/3 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

            {/* Left — Copy */}
            <div>
              <div className="anim-badge mb-7 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold-500/10 border border-gold-500/20 text-gold-400 text-xs font-bold uppercase tracking-wider">
                <span>🎵</span> Para músicos e artistas
              </div>

              <h1 className="anim-up d1 text-5xl md:text-6xl lg:text-[4.2rem] font-black tracking-tight leading-[1.05] text-white mb-6">
                Seu trabalho merece<br />
                um documento<br />
                <span className="shimmer-text">profissional.</span>
              </h1>

              <p className="anim-up d2 text-lg text-gray-400 leading-relaxed mb-10 max-w-lg">
                Gere orçamentos em PDF com sua marca, contratos prontos para assinar e controle total da agenda. Em segundos, sem complicação.
              </p>

              <div className="anim-up d3 flex flex-col sm:flex-row gap-4 mb-10">
                <a
                  href="#solicitar"
                  className="group flex justify-center items-center gap-3 py-4 px-10 bg-gradient-to-r from-gold-500 to-yellow-600 hover:from-gold-400 hover:to-yellow-500 text-black font-extrabold text-base rounded-2xl shadow-[0_0_48px_-8px_rgba(230,184,0,0.5)] hover:shadow-[0_0_64px_-8px_rgba(230,184,0,0.7)] transition-all duration-300 hover:-translate-y-0.5"
                >
                  Quero meu acesso
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform">
                    <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
                  </svg>
                </a>
                <Link
                  href="/login"
                  className="flex justify-center items-center gap-2 py-4 px-8 rounded-2xl border border-white/10 text-gray-300 hover:text-white hover:border-white/20 font-semibold text-base transition-all"
                >
                  Já tenho conta
                </Link>
              </div>

              <div className="anim-up d4 flex flex-wrap gap-5">
                {["PDF com sua logo", "Contrato automático", "Agenda visual"].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm text-gray-500">
                    <div className="w-4 h-4 rounded-full bg-gold-500/15 border border-gold-500/30 flex items-center justify-center flex-shrink-0">
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#f5c842" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Animated PDF Mockup */}
            <div className="anim-right d3 relative flex items-center justify-center lg:justify-end py-16">
              {/* Glow behind doc */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-64 h-64 bg-gold-500/12 rounded-full blur-[80px]" />
              </div>

              {/* Shadow pages */}
              <div style={{
                position: "absolute", width: 280, height: 390,
                background: "rgba(255,255,255,0.02)",
                borderRadius: 12, border: "1px solid rgba(255,255,255,0.04)",
                transform: "rotate(7deg) translateY(16px)",
              }} />
              <div style={{
                position: "absolute", width: 280, height: 390,
                background: "rgba(255,255,255,0.03)",
                borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)",
                transform: "rotate(3.5deg) translateY(8px)",
              }} />

              {/* Main PDF */}
              <div className="anim-float" style={{
                background: "#ffffff", borderRadius: 12, padding: "26px 22px",
                width: 280, position: "relative",
                boxShadow: "0 48px 120px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.1)",
              }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, paddingBottom: 14, borderBottom: "1.5px solid #f3f4f6" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg,#f5c842,#dba000)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: 14, fontWeight: 900, color: "#1a1000" }}>B</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#111827" }}>Banda Sonora</div>
                    <div style={{ fontSize: 8.5, color: "#9ca3af" }}>contato@bandasonora.com.br</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 7.5, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em" }}>Orçamento</div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: "#111827" }}>#ORC-047</div>
                  </div>
                </div>

                {/* Client block */}
                <div style={{ marginBottom: 14, padding: "9px 11px", background: "#f9fafb", borderRadius: 8 }}>
                  <div style={{ fontSize: 7.5, color: "#6b7280", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>Para</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#111827" }}>Casamento Silva & Oliveira</div>
                  <div style={{ fontSize: 8.5, color: "#6b7280", marginTop: 1 }}>Espaço Jardim das Flores · 14/06/2025</div>
                </div>

                {/* Line items */}
                <div style={{ marginBottom: 14 }}>
                  {[
                    { desc: "Show ao vivo (4 horas)", val: "R$ 7.000" },
                    { desc: "Sonorização profissional", val: "R$ 1.500" },
                    { desc: "Iluminação cênica", val: "R$ 800" },
                  ].map((item, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: i < 2 ? "1px solid #f3f4f6" : "none" }}>
                      <span style={{ fontSize: 9, color: "#374151" }}>{item.desc}</span>
                      <span style={{ fontSize: 9, fontWeight: 700, color: "#111827" }}>{item.val}</span>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div style={{ background: "linear-gradient(135deg,#f5c842,#dba000)", borderRadius: 8, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 13 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: "#1a1000" }}>TOTAL</span>
                  <span style={{ fontSize: 15, fontWeight: 900, color: "#1a1000" }}>R$ 9.300</span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 7.5, color: "#9ca3af", marginBottom: 10 }}>
                  <span>Válido até 21/05/2025</span>
                  <span>PIX: 67 9 9999-9999</span>
                </div>

                <div style={{ paddingTop: 9, borderTop: "1px solid #f3f4f6", display: "flex", justifyContent: "center" }}>
                  <span style={{ fontSize: 7.5, color: "#d1d5db", letterSpacing: "0.07em" }}>✦ GERADO COM FORMALIZE</span>
                </div>
              </div>

              {/* Floating "show confirmado" badge */}
              <div className="anim-float-badge d4" style={{
                position: "absolute", bottom: 12, right: 0,
                background: "#0d1420", border: "1px solid rgba(74,222,128,0.3)",
                borderRadius: 12, padding: "8px 12px",
                display: "flex", alignItems: "center", gap: 8,
                boxShadow: "0 8px 32px rgba(0,0,0,0.6)", whiteSpace: "nowrap",
              }}>
                <div style={{ width: 26, height: 26, borderRadius: 8, background: "rgba(74,222,128,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#f1f5f9" }}>Show confirmado</div>
                  <div style={{ fontSize: 8, color: "#6b7280" }}>Contrato assinado · agora</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pain strip ── */}
      <section className="py-10 px-6 border-y border-white/5 bg-[#070b10]">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-gray-500 text-base md:text-lg font-medium leading-relaxed">
            Soa familiar? <span className="text-gray-300 font-semibold">"Qual o valor do show?"</span> → áudio de voz no WhatsApp → cliente some → show não fecha.
          </p>
        </div>
      </section>

      {/* ── Problema vs Solução ── */}
      <section className="py-20 px-6 relative">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-3">
              A diferença está no profissionalismo
            </h2>
            <p className="text-gray-500 text-base max-w-md mx-auto">
              Seus clientes decidem se contratam antes mesmo de ouvir você tocar.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="anim-left p-7 rounded-2xl bg-red-950/15 border border-red-900/25 card-lift">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-7 h-7 rounded-lg bg-red-500/15 flex items-center justify-center flex-shrink-0">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.8" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </div>
                <h3 className="text-xs font-bold text-red-400 uppercase tracking-widest">Sem Formalize</h3>
              </div>
              <ul className="space-y-4">
                {[
                  "Manda preço por mensagem de texto",
                  "Fecha shows de boca e toma calote",
                  "Agenda no caderno, eventos esquecidos",
                  "Passa insegurança para contratantes",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-gray-400">
                    <span className="text-red-500 font-bold flex-shrink-0 mt-0.5 text-xs">✗</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="anim-right d2 p-7 rounded-2xl border card-lift relative overflow-hidden" style={{ background: "rgba(245,200,66,0.06)", borderColor: "rgba(245,200,66,0.2)" }}>
              <div className="absolute top-0 right-0 w-40 h-40 bg-gold-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="flex items-center gap-2 mb-6">
                <div className="w-7 h-7 rounded-lg bg-gold-500/15 flex items-center justify-center flex-shrink-0">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f5c842" strokeWidth="2.8" strokeLinecap="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h3 className="text-xs font-bold text-gold-400 uppercase tracking-widest">Com Formalize</h3>
              </div>
              <ul className="space-y-4">
                {[
                  "PDF premium com sua logo em segundos",
                  "Contrato automático, sem advogado",
                  "Agenda visual com status de cada show",
                  "Transmite autoridade e fecha mais",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-gray-100 font-medium">
                    <span className="text-gold-500 flex-shrink-0 mt-0.5 text-xs">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Como funciona ── */}
      <section className="py-20 px-6 border-t border-white/5 bg-[#070b10]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="anim-up inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/8 text-gray-400 text-xs font-bold uppercase tracking-wider mb-5">
              Como funciona
            </div>
            <h2 className="anim-up d1 text-3xl md:text-4xl font-black text-white tracking-tight">
              Em 3 minutos você está operando
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                n: "01", title: "Configure seu perfil",
                desc: "Nome artístico, logo, cor da marca e dados jurídicos. Feito uma vez, aplicado em tudo.",
                color: "#f5c842", rgb: "245,200,66",
                icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M20 21a8 8 0 1 0-16 0" /></svg>,
              },
              {
                n: "02", title: "Preencha o show",
                desc: "Nome do evento, data, local, serviços e valores. O sistema monta o documento na hora.",
                color: "#60a5fa", rgb: "96,165,250",
                icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="9" y1="13" x2="15" y2="13" /><line x1="9" y1="17" x2="15" y2="17" /></svg>,
              },
              {
                n: "03", title: "Envie e feche",
                desc: "PDF pronto para compartilhar. Contratante recebe, lê, confia. Show fechado.",
                color: "#4ade80", rgb: "74,222,128",
                icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4z" /><path d="M22 2 11 13" /></svg>,
              },
            ].map((step, i) => (
              <div key={i} className={`anim-up d${i + 1} text-center`}>
                <div className="relative inline-flex mb-5">
                  <div style={{
                    width: 56, height: 56, borderRadius: 16,
                    background: `rgba(${step.rgb},0.1)`,
                    border: `1px solid rgba(${step.rgb},0.2)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: step.color,
                  }}>
                    {step.icon}
                  </div>
                  <div style={{
                    position: "absolute", top: -7, right: -7,
                    width: 20, height: 20, borderRadius: 10,
                    background: "#07090e", border: "1px solid rgba(255,255,255,0.1)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 8.5, fontWeight: 800, color: "#4b5563", letterSpacing: "0.02em",
                  }}>
                    {step.n}
                  </div>
                </div>
                <h3 className="text-base font-bold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed max-w-[240px] mx-auto">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-20 px-6 relative">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="anim-up text-3xl md:text-4xl font-black text-white tracking-tight mb-3">
              Tudo que você precisa,<br className="hidden sm:block" /> nada que não precisa
            </h2>
            <p className="anim-up d1 text-gray-500 text-base">Sem complexidade. Direto ao que importa.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                title: "Orçamentos que convencem",
                desc: "PDF com design premium, sua logo e marca. Apresente preços como as grandes produtoras fazem.",
                color: "#f5c842", rgb: "245,200,66",
                icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="12" y1="18" x2="12" y2="12" /><line x1="9" y1="15" x2="15" y2="15" /></svg>,
              },
              {
                title: "Contratos sem advogado",
                desc: "Template jurídico gerado automaticamente com os dados do show. Chega de fechar de boca.",
                color: "#60a5fa", rgb: "96,165,250",
                icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" /></svg>,
              },
              {
                title: "Agenda inteligente",
                desc: "Todos os shows, status de negociação e cachês em um lugar. Nunca perca uma data.",
                color: "#a78bfa", rgb: "167,139,250",
                icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>,
              },
            ].map((feat, i) => (
              <div
                key={i}
                className={`anim-up d${i + 1} p-7 rounded-2xl card-lift`}
                style={{ background: `rgba(${feat.rgb},0.06)`, border: `1px solid rgba(${feat.rgb},0.18)` }}
              >
                <div style={{
                  width: 48, height: 48, borderRadius: 14, marginBottom: 18,
                  background: `rgba(${feat.rgb},0.1)`, border: `1px solid rgba(${feat.rgb},0.2)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: feat.color,
                }}>
                  {feat.icon}
                </div>
                <h3 className="text-base font-bold text-white mb-2">{feat.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Form CTA ── */}
      <section id="solicitar" className="py-20 px-6 relative border-t border-white/5 bg-[#070b10]">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[280px] bg-gold-500/6 rounded-full blur-[100px] pointer-events-none" />
        <div className="max-w-lg mx-auto relative z-10">
          <div className="text-center mb-10">
            <div className="anim-badge inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold-500/10 border border-gold-500/20 text-gold-400 text-xs font-bold uppercase tracking-wider mb-6">
              🎯 Acesso exclusivo
            </div>
            <h2 className="anim-up text-3xl md:text-4xl font-black text-white mb-4 tracking-tight">
              Comece a fechar mais shows
            </h2>
            <p className="anim-up d1 text-gray-400 text-base leading-relaxed">
              Preencha seus dados. Entraremos em contato pelo WhatsApp para configurar seu perfil.
            </p>
          </div>
          <div className="anim-up d2 bg-white/3 rounded-3xl border border-white/8 p-8 backdrop-blur-xl">
            <RequestForm />
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-20 px-6 relative overflow-hidden">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="anim-up text-4xl md:text-5xl font-black text-white mb-5 tracking-tight leading-tight">
            O palco é seu.<br />
            <span className="shimmer-text">A burocracia é nossa.</span>
          </h2>
          <p className="anim-up d1 text-gray-500 text-lg mb-10 max-w-lg mx-auto">
            Enquanto você foca na música, o Formalize cuida dos documentos.
          </p>
          <a
            href="#solicitar"
            className="anim-up d2 inline-flex items-center gap-3 py-4 px-10 bg-white text-black font-extrabold text-base rounded-2xl hover:bg-gray-100 transition-all hover:-translate-y-0.5 shadow-2xl"
          >
            Quero meu acesso
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
            </svg>
          </a>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Image src="/icon-512.png" alt="Formalize" width={22} height={22} style={{ borderRadius: 6 }} />
            <span className="font-bold text-white tracking-wide">Formalize</span>
            <span className="text-gray-700 text-sm ml-1">— Feito para quem vive de música.</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-700">
            <Link href="/login" className="hover:text-gray-400 transition-colors">Entrar</Link>
            <a href="#solicitar" className="hover:text-gray-400 transition-colors">Solicitar acesso</a>
            <span>© {new Date().getFullYear()} Formalize</span>
          </div>
        </div>
      </footer>
    </main>
  );
}

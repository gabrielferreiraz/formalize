import Link from "next/link";
import { IconDoc, IconPen, IconFolder, IconCog } from "@/components/ui/icons";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#07090e] font-body text-gray-100 overflow-x-hidden selection:bg-gold-500/30">
      
      {/* ── Navbar ── */}
      <header className="fixed top-0 left-0 right-0 z-50 w-full border-b border-white/5 bg-[#07090e]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-lg shadow-gold-500/20">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6" />
              </svg>
            </div>
            <span className="font-bold text-xl tracking-wide text-white">Formalize</span>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              href="/login" 
              className="px-6 py-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white text-sm font-semibold transition-all"
            >
              Já tenho conta
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero Section ── */}
      <section className="relative pt-40 pb-20 px-6 overflow-hidden">
        {/* Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gold-500/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="relative z-10 max-w-5xl mx-auto text-center flex flex-col items-center">
          
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-stage-800/80 border border-stage-700/50 text-gray-300 text-xs font-bold uppercase tracking-wider mb-8 backdrop-blur-sm">
            <span className="text-gold-400">🎵</span> Exclusivo para Músicos, Bandas e Produtores
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-8 leading-[1.1] text-white">
            Pare de perder shows por <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-400 via-gold-300 to-yellow-600">
              falta de profissionalismo.
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mb-12 leading-relaxed">
            Enviar preço no WhatsApp não converte. <strong className="text-white font-semibold">Formalize</strong> é o seu escritório musical: gere orçamentos em PDF impecáveis, feche contratos com segurança e organize sua agenda.
          </p>

          <Link 
            href="/login" 
            className="group relative flex justify-center items-center gap-3 w-full sm:w-auto py-5 px-12 bg-gradient-to-r from-gold-500 to-yellow-600 hover:from-gold-400 hover:to-yellow-500 text-black font-extrabold text-lg rounded-full shadow-[0_0_40px_-10px_rgba(230,184,0,0.4)] hover:shadow-[0_0_60px_-15px_rgba(230,184,0,0.6)] transition-all duration-300 hover:-translate-y-1"
          >
            Começar a Usar Agora
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </Link>
          
          <p className="mt-6 text-sm text-gray-500">
            Aumente o valor percebido do seu trabalho imediatamente.
          </p>
        </div>
      </section>

      {/* ── Problem vs Solution ── */}
      <section className="py-24 px-6 relative border-t border-white/5 bg-stage-900/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">A diferença entre o amador e o profissional</h2>
            <p className="text-gray-400 text-lg">Seus clientes julgam a qualidade do seu show antes mesmo de você subir no palco.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Amador */}
            <div className="p-8 rounded-3xl bg-red-950/20 border border-red-900/30">
              <h3 className="text-xl font-bold text-red-400 mb-6 flex items-center gap-2">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                O Jeito Amador
              </h3>
              <ul className="space-y-4 text-gray-300">
                <li className="flex items-start gap-3">
                  <span className="text-red-500 mt-1">✗</span> Manda preços por mensagem de texto
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500 mt-1">✗</span> Fecha shows "de boca" e toma calote
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500 mt-1">✗</span> Anota a agenda no caderno ou no bloco de notas
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500 mt-1">✗</span> Passa insegurança para contratantes corporativos e noivas
                </li>
              </ul>
            </div>

            {/* Profissional (Formalize) */}
            <div className="p-8 rounded-3xl bg-gold-950/20 border border-gold-500/30 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 bg-gold-500/10 rounded-bl-2xl">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gold-400"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              </div>
              <h3 className="text-xl font-bold text-gold-400 mb-6 flex items-center gap-2">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                O Jeito Formalize
              </h3>
              <ul className="space-y-4 text-gray-100 font-medium">
                <li className="flex items-start gap-3">
                  <span className="text-gold-500 mt-1">✓</span> Orçamentos em PDF com design premium e sua logo em segundos
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-gold-500 mt-1">✓</span> Contratos gerados automaticamente, prontos para assinatura
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-gold-500 mt-1">✓</span> Calendário visual inteligente com caches e status dos shows
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-gold-500 mt-1">✓</span> Valoriza seu trabalho, cobrando mais caro e fechando mais
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 px-6 relative">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <div className="p-8 rounded-3xl bg-[#0e1118] border border-white/5 hover:border-gold-500/30 transition-colors">
              <div className="w-14 h-14 rounded-2xl bg-gold-500/10 flex items-center justify-center text-gold-400 mb-6">
                <IconDoc size={28} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Orçamentos que Convertem</h3>
              <p className="text-gray-400 leading-relaxed">
                Apresente seu trabalho como as grandes produtoras. O Formalize cria PDFs elegantes que justificam o seu cachê e deixam o contratante impressionado.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-[#0e1118] border border-white/5 hover:border-blue-500/30 transition-colors">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-6">
                <IconPen size={28} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Segurança com Contratos</h3>
              <p className="text-gray-400 leading-relaxed">
                Chega de dor de cabeça no dia do evento. Preencha os dados do show e deixe o sistema gerar um contrato jurídico padrão para você enviar na hora.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-[#0e1118] border border-white/5 hover:border-purple-500/30 transition-colors">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-6">
                <IconFolder size={28} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Sua Agenda no Bolso</h3>
              <p className="text-gray-400 leading-relaxed">
                Tenha total controle das suas datas. Visualize os eventos fechados, em negociação, os horários de cada show e gerencie sua agenda como um verdadeiro manager.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-24 px-6 relative overflow-hidden bg-gradient-to-b from-[#07090e] to-stage-900">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay" />
        <div className="max-w-4xl mx-auto text-center relative z-10 bg-stage-800/50 p-12 rounded-[3rem] border border-stage-700/50 backdrop-blur-xl shadow-2xl">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6">O palco é seu. A burocracia é nossa.</h2>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Junte-se a músicos profissionais que já abandonaram a desorganização e estão focando no que realmente importa: <span className="text-gold-400 font-bold">A Música</span>.
          </p>
          <Link 
            href="/login" 
            className="inline-flex items-center gap-3 py-5 px-12 bg-white text-black font-extrabold text-lg rounded-full hover:bg-gray-200 transition-all hover:scale-105 shadow-xl"
          >
            Acessar a Plataforma
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 py-10 px-6 text-center text-gray-500 text-sm">
        <div className="flex items-center justify-center gap-2 mb-4 text-gold-500">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M14 2v6h6" />
          </svg>
          <span className="font-bold text-lg text-white tracking-wide">Formalize</span>
        </div>
        <p>Feito para quem vive de música.</p>
        <p className="mt-2 text-xs">© {new Date().getFullYear()} Formalize. Todos os direitos reservados.</p>
      </footer>
    </main>
  );
}

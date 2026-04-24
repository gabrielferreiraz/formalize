import Link from "next/link";
import { IconDoc, IconPen, IconFolder, IconCog } from "@/components/ui/icons";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#090b10] flex flex-col font-body text-gray-100 overflow-x-hidden selection:bg-gold-500/30">
      
      {/* ── Background Effects ── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-gold-500/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[150px]" />
        <div className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[800px] h-[400px] bg-stage-800/30 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay" />
      </div>

      {/* ── Navbar ── */}
      <header className="relative z-50 w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-[0_0_20px_-5px_rgba(230,184,0,0.5)]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6" />
            </svg>
          </div>
          <span className="font-bold text-xl tracking-wide text-white">Formalize</span>
        </div>
        <Link 
          href="/login" 
          className="px-5 py-2 rounded-xl bg-stage-800/80 border border-stage-700 hover:border-gold-500/50 hover:bg-stage-800 text-sm font-semibold transition-all shadow-lg backdrop-blur-md"
        >
          Entrar
        </Link>
      </header>

      {/* ── Hero Section ── */}
      <section className="relative z-10 w-full max-w-6xl mx-auto px-6 pt-20 pb-32 flex flex-col items-center text-center animate-fade-in">
        
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold-500/10 border border-gold-500/20 text-gold-400 text-xs font-bold uppercase tracking-widest mb-8">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-gold-500"></span>
          </span>
          A Revolução na Gestão Musical
        </div>

        <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-[1.1] max-w-4xl">
          Sua carreira em <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-300 via-gold-500 to-yellow-600">
            Padrão de Excelência.
          </span>
        </h1>
        
        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mb-10 leading-relaxed">
          Esqueça planilhas confusas e PDFs manuais. Gere orçamentos impecáveis, feche contratos com assinatura digital e tenha sua agenda centralizada em uma única plataforma premium.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <Link 
            href="/login" 
            className="group relative flex justify-center items-center gap-3 w-full sm:w-auto py-4 px-10 bg-gradient-to-b from-gold-400 to-gold-600 hover:from-gold-300 hover:to-gold-500 text-black font-extrabold text-lg rounded-2xl shadow-[0_0_40px_-10px_rgba(230,184,0,0.6)] hover:shadow-[0_0_60px_-15px_rgba(230,184,0,0.8)] transition-all duration-300 hover:-translate-y-1"
          >
            Começar Agora
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </Link>
          <a href="#features" className="px-8 py-4 text-gray-300 hover:text-white font-semibold transition-colors">
            Conhecer os Recursos
          </a>
        </div>
      </section>

      {/* ── UI Preview Showcase ── */}
      <section className="relative z-10 w-full max-w-5xl mx-auto px-6 pb-32">
        <div className="relative rounded-3xl bg-stage-900/50 border border-stage-700/50 p-2 sm:p-4 backdrop-blur-xl shadow-2xl shadow-black">
          {/* Mac window controls */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-stage-800/50 mb-2">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-2 sm:p-4">
            
            <div className="col-span-1 space-y-4">
              <div className="card p-5 rounded-2xl bg-stage-800/80 border-stage-700 flex flex-col gap-3 group">
                <div className="w-10 h-10 rounded-xl bg-gold-500/10 flex items-center justify-center text-gold-400 group-hover:scale-110 transition-transform">
                  <IconDoc size={20} />
                </div>
                <h3 className="font-bold text-white">Orçamentos Impecáveis</h3>
                <p className="text-sm text-gray-400">Gere propostas em PDF com design premium que valorizam seu show na hora de vender.</p>
              </div>
            </div>
            
            <div className="col-span-1 space-y-4">
              <div className="card p-5 rounded-2xl bg-stage-800/80 border-stage-700 flex flex-col gap-3 group">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                  <IconPen size={20} />
                </div>
                <h3 className="font-bold text-white">Contratos Seguros</h3>
                <p className="text-sm text-gray-400">Emita contratos profissionais com preenchimento automático. Segurança jurídica para você.</p>
              </div>
            </div>

            <div className="col-span-1 space-y-4">
              <div className="card p-5 rounded-2xl bg-stage-800/80 border-stage-700 flex flex-col gap-3 group">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                  <IconFolder size={20} />
                </div>
                <h3 className="font-bold text-white">Agenda Centralizada</h3>
                <p className="text-sm text-gray-400">Calendário inteligente. Saiba exatamente quais datas estão fechadas e os caches de cada evento.</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 w-full border-t border-stage-800/50 bg-[#0e1118]/80 backdrop-blur-md mt-auto">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500 font-medium">
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gold-500">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6" />
            </svg>
            <span>Formalize © {new Date().getFullYear()}</span>
          </div>
          <div className="text-xs tracking-wider uppercase">
            Eleve o nível do seu negócio musical.
          </div>
        </div>
      </footer>
    </main>
  );
}

import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0e1118] flex flex-col items-center justify-center relative overflow-hidden font-body text-gray-100 p-6">
      {/* Background Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-yellow-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Content Container */}
      <div className="relative z-10 w-full max-w-lg flex flex-col items-center text-center space-y-8 animate-fade-in">
        
        {/* Logo Mark */}
        <div className="w-20 h-20 bg-[#141824]/80 border border-[#252d3d] rounded-3xl flex items-center justify-center shadow-2xl backdrop-blur-xl mb-4">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#e6b800]">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M14 2v6h6" />
            <path d="M16 13H8" />
            <path d="M16 17H8" />
            <path d="M10 9H8" />
          </svg>
        </div>

        {/* Title & Subtitle */}
        <div className="space-y-4">
          <h1 className="text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-400">
            Formalize
          </h1>
          <p className="text-lg text-gray-400 max-w-sm mx-auto leading-relaxed">
            A plataforma definitiva para gestão de orçamentos, contratos e agenda para músicos.
          </p>
        </div>

        {/* Action Button */}
        <div className="pt-8 w-full max-w-xs mx-auto">
          <Link 
            href="/login" 
            className="group relative w-full flex justify-center items-center gap-3 py-4 px-6 bg-gradient-to-b from-[#f5c842] to-[#b8860b] hover:from-[#ffe066] hover:to-[#cca300] text-black font-bold text-lg rounded-2xl shadow-[0_0_40px_-10px_rgba(230,184,0,0.5)] hover:shadow-[0_0_60px_-15px_rgba(230,184,0,0.6)] transition-all duration-300 hover:-translate-y-1"
          >
            Acessar Conta
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </Link>
        </div>
        
      </div>
      
      {/* Simple Footer */}
      <div className="absolute bottom-6 text-center text-xs text-gray-600 font-medium tracking-wider uppercase">
        © {new Date().getFullYear()} Formalize. Todos os direitos reservados.
      </div>
    </main>
  );
}

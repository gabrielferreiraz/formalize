"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

interface Props {
  artistName: string;
  logoUrl: string | null;
}

const nav = [
  {
    href: "/admin/orcamento",
    label: "Orçamento",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    href: "/admin/contrato",
    label: "Contrato",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
      </svg>
    ),
  },
  {
    href: "/admin/documentos",
    label: "Documentos",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    href: "/admin/configuracoes",
    label: "Config.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
];

export function AdminHeader({ artistName, logoUrl }: Props) {
  const pathname = usePathname();

  return (
    <>
      {/* ── Header (top) ───────────────────────────────────────── */}
      <header className="bg-stage-800/80 backdrop-blur border-b border-stage-600 px-4 h-14 flex items-center sticky top-0 z-40">
        <div className="max-w-4xl mx-auto w-full flex items-center justify-between">

          {/* Logo / identidade */}
          <div className="flex items-center gap-2.5 min-w-0">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={artistName}
                width={120}
                height={48}
                priority
                style={{ width: "auto", height: 44 }}
                className="object-contain shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-full flex items-center justify-center bg-gold-500 text-stage-900 text-sm font-black shrink-0">
                {artistName.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-sm font-semibold text-gray-200 truncate hidden sm:block">
              {artistName}
            </span>
          </div>

          {/* Nav — só aparece em desktop (md+) */}
          <nav className="hidden md:flex items-center gap-1">
            {nav.map(({ href, label }) => {
              const active = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  prefetch
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                    active
                      ? "bg-gold-500 text-stage-900"
                      : "text-gray-400 hover:text-gray-200 hover:bg-stage-700/50"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Ações */}
          <div className="flex items-center gap-1">
            {/* Config — só no desktop (já está no bottom nav mobile) */}
            <Link
              href="/admin/configuracoes"
              prefetch
              className="hidden md:flex p-2 text-gray-400 hover:text-gold-400 transition-colors rounded-lg hover:bg-stage-700"
              title="Configurações"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="p-2 text-gray-400 hover:text-gold-400 transition-colors rounded-lg hover:bg-stage-700"
              title="Sair"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* ── Bottom nav — só mobile (abaixo de md) ──────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-stage-800/95 backdrop-blur border-t border-stage-600 flex items-stretch h-16 safe-area-pb">
        {nav.map(({ href, label, icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              prefetch
              className={`flex-1 flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors ${
                active ? "text-gold-400" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              <span className={active ? "text-gold-400" : "text-gray-500"}>{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}

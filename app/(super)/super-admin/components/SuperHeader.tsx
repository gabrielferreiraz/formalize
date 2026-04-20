"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

export function SuperHeader({ userName }: { userName: string }) {
  const pathname = usePathname();

  const nav = [
    { href: "/super-admin", label: "Dashboard" },
    { href: "/super-admin/artistas", label: "Artistas" },
  ];

  return (
    <header className="bg-stage-800/80 backdrop-blur border-b border-stage-600 px-4 h-14 flex items-center sticky top-0 z-40">
      <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="text-sm font-black tracking-widest text-gold-500 uppercase">
            Formalize
          </span>
          <nav className="flex items-center gap-1">
            {nav.map(({ href, label }) => {
              const active = href === "/super-admin"
                ? pathname === "/super-admin"
                : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
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
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 hidden sm:block">{userName}</span>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="p-2 text-gray-400 hover:text-gold-400 transition-colors rounded-lg hover:bg-stage-700"
            title="Sair"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}

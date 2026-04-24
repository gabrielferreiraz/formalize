"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { IconDoc, IconPen, IconFolder, IconCog, IconLogout } from "@/components/ui/icons";

interface Props {
  artistName: string;
  logoUrl: string | null;
}

const nav = [
  { id: "orc", label: "Orçamento", href: "/admin/orcamento", icon: <IconDoc size={22} /> },
  { id: "ctr", label: "Contrato",   href: "/admin/contrato",   icon: <IconPen size={22} /> },
  { id: "docs", label: "Documentos", href: "/admin/documentos", icon: <IconFolder size={22} /> },
  { id: "cfg",  label: "Config.",    href: "/admin/configuracoes", icon: <IconCog size={22} /> },
];

export function AdminHeader({ artistName, logoUrl }: Props) {
  const pathname = usePathname();
  const [showNav, setShowNav] = useState(true);

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        // Scrolling down
        setShowNav(false);
      } else {
        // Scrolling up
        setShowNav(true);
      }
      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  function isActive(href: string) {
    return pathname.startsWith(href);
  }

  return (
    <>
      {/* ── App Bar (top) ── */}
      <header style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 20px 14px",
        borderBottom: "1px solid #252d3d",
        background: "#0e1118",
        flexShrink: 0,
        position: "sticky",
        top: 0,
        zIndex: 40,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}>
        {/* Logo / identidade */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={artistName}
              width={120}
              height={44}
              priority
              style={{ width: "auto", height: 38, objectFit: "contain" }}
            />
          ) : (
            <div style={{
              fontFamily: "'Cinzel', 'Trajan Pro', serif",
              fontWeight: 700,
              fontSize: 18,
              letterSpacing: "0.08em",
              background: "linear-gradient(180deg, #f5c842 0%, #b8860b 60%, #8b6508 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              lineHeight: 1,
            }}>
              {artistName}
            </div>
          )}
        </div>

        {/* Logout button */}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          title="Sair"
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            border: "1px solid #252d3d",
            background: "#141824",
            color: "#94a3b8",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}>
          <IconLogout size={18} />
        </button>
      </header>

      {/* ── Bottom Nav (mobile) ── */}
      <nav style={{
        position: "fixed" as const,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(14,17,24,0.92)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderTop: "1px solid #252d3d",
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        padding: "10px 4px 24px",
        zIndex: 50,
        transform: showNav ? "translateY(0)" : "translateY(100%)",
        transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      }}>
        {nav.map(it => {
          const on = isActive(it.href);
          return (
            <Link key={it.id} href={it.href} style={{
              display: "flex",
              flexDirection: "column" as const,
              alignItems: "center",
              gap: 5,
              color: on ? "#e6b800" : "#6b7280",
              position: "relative" as const,
              padding: "4px 0",
              textDecoration: "none",
            }}>
              {it.icon}
              <span style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.02em",
              }}>{it.label}</span>
              {on && (
                <div style={{
                  position: "absolute",
                  bottom: -10,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: 24,
                  height: 2,
                  borderRadius: 2,
                  background: "#e6b800",
                }} />
              )}
            </Link>
          );
        })}
      </nav>
    </>
  );
}

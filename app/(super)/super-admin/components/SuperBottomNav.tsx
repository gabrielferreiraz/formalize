"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const GOLD = "#e6b800";
const MUTED = "#6b7280";

function isActive(pathname: string, href: string, exact: boolean) {
  if (exact) return pathname === href;
  return pathname?.startsWith(href) ?? false;
}

export default function SuperBottomNav() {
  const pathname = usePathname();
  const [pending, setPending] = useState(0);

  useEffect(() => {
    fetch("/api/super/requests")
      .then(r => r.json())
      .then((data: unknown) => {
        if (Array.isArray(data)) {
          setPending(data.filter((r: { status: string }) => r.status === "PENDING").length);
        }
      })
      .catch(() => {});
  }, [pathname]);

  const items = [
    {
      href: "/super-admin",
      exact: true,
      label: "Dashboard",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
          <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
        </svg>
      ),
    },
    {
      href: "/super-admin/artistas",
      exact: false,
      label: "Artistas",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
    },
    {
      href: "/super-admin/solicitacoes",
      exact: false,
      label: "Solicitações",
      badge: pending,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
      ),
    },
    {
      href: "/super-admin/templates",
      exact: false,
      label: "Templates",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
        </svg>
      ),
    },
    {
      href: "/super-admin/whatsapp",
      exact: false,
      label: "WhatsApp",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
        </svg>
      ),
    },
  ];

  return (
    <nav
      className="md:hidden grid"
      style={{
        position: "fixed", left: 0, right: 0, bottom: 0,
        background: "rgba(14,17,24,0.96)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderTop: "1px solid #252d3d",
        gridTemplateColumns: "repeat(5, 1fr)",
        padding: "10px 4px calc(10px + env(safe-area-inset-bottom, 0px))",
        zIndex: 50,
      }}
    >
      {items.map(item => {
        const active = isActive(pathname, item.href, item.exact);
        const color = active ? GOLD : MUTED;
        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
              color, textDecoration: "none", position: "relative", padding: "4px 0",
            }}
          >
            {item.icon}
            {"badge" in item && (item.badge ?? 0) > 0 && (
              <span style={{
                position: "absolute", top: 0, right: "calc(50% - 18px)",
                background: "#facc15", color: "#0e1118",
                fontSize: 9, fontWeight: 800,
                borderRadius: 999, minWidth: 15, height: 15,
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: "0 3px", lineHeight: 1,
              }}>
                {(item.badge ?? 0) > 9 ? "9+" : item.badge}
              </span>
            )}
            <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 9, fontWeight: 600, letterSpacing: "0.02em" }}>
              {item.label}
            </span>
            {active && (
              <div style={{
                position: "absolute", bottom: -10, left: "50%", transform: "translateX(-50%)",
                width: 20, height: 2, borderRadius: 2, background: GOLD,
              }} />
            )}
          </Link>
        );
      })}
    </nav>
  );
}

"use client";

import { useState } from "react";
import SystemTemplatesSection from "./_SystemTemplates";
import ArtistTemplatesSection from "./_ArtistTemplates";

type Tab = "system" | "artists";

export default function TemplatesPage() {
  const [tab, setTab] = useState<Tab>("system");

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      // stretch to fill the main container's remaining height
      minHeight: tab === "artists" ? "calc(100dvh - 56px - 64px)" : undefined,
    }}>
      {/* Page header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#3d5066", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 6 }}>
          Super Admin
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: "#f1f5f9", margin: "0 0 6px", letterSpacing: "-0.03em" }}>
          Templates
        </h1>
        <p style={{ fontSize: 13, color: "#4a6275", margin: 0 }}>
          Gerencie os templates HTML padrão do sistema e os templates PDF individuais de cada artista.
        </p>
      </div>

      {/* Top-level tabs */}
      <div style={{ display: "flex", gap: 2, borderBottom: "1px solid #1e2a3a", marginBottom: 0, flexShrink: 0 }}>
        {([
          { id: "system" as Tab, label: "Templates Padrão", desc: "HTML/CSS · disponíveis para todos" },
          { id: "artists" as Tab, label: "Templates dos Artistas", desc: "PDFs personalizados por artista" },
        ]).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              height: 44, padding: "0 20px",
              borderRadius: "10px 10px 0 0",
              border: "none",
              borderBottom: tab === t.id ? "2px solid #e6b800" : "2px solid transparent",
              background: "transparent",
              color: tab === t.id ? "#f1f5f9" : "#4a6888",
              fontSize: 13, fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit",
              display: "flex", alignItems: "center", gap: 8,
              transition: "color 0.15s",
            }}
          >
            {t.id === "system" ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            )}
            {t.label}
          </button>
        ))}
      </div>

      {/* Section content */}
      {tab === "system" && (
        <div style={{ paddingTop: 24 }}>
          <SystemTemplatesSection />
        </div>
      )}

      {tab === "artists" && (
        <div style={{
          flex: 1,
          display: "flex",
          margin: "0 -1rem",
          overflow: "hidden",
          height: "calc(100dvh - 56px - 64px - 44px)",
        }}>
          <ArtistTemplatesSection />
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Doc = {
  id: string;
  type: string;
  title: string;
  data?: Record<string, unknown>;
  createdAt: string;
};

type UpcomingEvent = {
  id: string;
  name: string;
  dateStr: string;
  daysAway: number;
  horario: string;
  type: string;
};

function todayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dy = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dy}`;
}

function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatDay(iso: string) {
  const d = parseLocalDate(iso);
  return d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" });
}

const DISMISS_KEY = "upcoming-banner-dismissed-";

export function UpcomingEventsBanner() {
  const [events, setEvents] = useState<UpcomingEvent[]>([]);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const storageKey = DISMISS_KEY + todayKey();
    if (sessionStorage.getItem(storageKey)) return;

    fetch("/api/documents?type=all&calendar=1&includeData=1")
      .then(r => r.json())
      .then(data => {
        const docs: Doc[] = data?.documents ?? [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const limit = new Date(today);
        limit.setDate(today.getDate() + 7);

        const seen = new Set<string>();
        const upcoming: UpcomingEvent[] = [];

        for (const doc of docs) {
          const d = doc.data ?? {};
          const dateStr = d.data as string | undefined;
          if (!dateStr || dateStr.length < 10) continue;

          const date = parseLocalDate(dateStr);
          date.setHours(0, 0, 0, 0);
          if (date < today || date > limit) continue;

          const name =
            (d.contratanteNome as string) ||
            (d.contratante as string) ||
            (doc.type === "GENERIC_EVENT" ? doc.title : "") ||
            "Evento";
          const key = `${dateStr}|${name.toLowerCase()}`;
          if (seen.has(key)) continue;
          seen.add(key);

          const daysAway = Math.round((date.getTime() - today.getTime()) / 864e5);
          upcoming.push({
            id: doc.id,
            name,
            dateStr,
            daysAway,
            horario: (d.horario as string) || "",
            type: doc.type,
          });
        }

        upcoming.sort((a, b) => a.daysAway - b.daysAway);
        if (upcoming.length > 0) {
          setEvents(upcoming.slice(0, 3));
          setDismissed(false);
        }
      })
      .catch(() => {});
  }, []);

  function dismiss() {
    sessionStorage.setItem(DISMISS_KEY + todayKey(), "1");
    setDismissed(true);
  }

  if (dismissed || events.length === 0) return null;

  const next = events[0];
  const typeColor =
    next.type === "CONTRACT"
      ? { border: "#3b82f6", bg: "rgba(59,130,246,0.08)", dot: "#60a5fa" }
      : next.type === "BUDGET"
      ? { border: "#e6b800", bg: "rgba(230,184,0,0.08)", dot: "#e6b800" }
      : { border: "#10b981", bg: "rgba(16,185,129,0.08)", dot: "#34d399" };

  return (
    <div
      style={{
        margin: "0 0 16px",
        borderRadius: 14,
        border: `1px solid ${typeColor.border}33`,
        background: typeColor.bg,
        padding: "12px 14px",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      {/* Dot */}
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: typeColor.dot,
          flexShrink: 0,
          boxShadow: `0 0 6px ${typeColor.dot}88`,
        }}
      />

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontFamily: "'Inter',sans-serif", fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>
          {next.daysAway === 0
            ? "Show hoje"
            : next.daysAway === 1
            ? "Show amanhã"
            : `Show em ${next.daysAway} dias`}
          {" "}
          <span style={{ fontWeight: 400, color: "#94a3b8" }}>
            · {next.name}
          </span>
        </p>
        <p style={{ margin: "2px 0 0", fontFamily: "'Inter',sans-serif", fontSize: 11, color: "#64748b" }}>
          {formatDay(next.dateStr)}
          {next.horario ? ` às ${next.horario}` : ""}
          {events.length > 1 ? ` · +${events.length - 1} mais esta semana` : ""}
        </p>
      </div>

      {/* CTA */}
      <Link
        href="/admin/documentos"
        style={{
          flexShrink: 0,
          fontSize: 11,
          fontWeight: 700,
          fontFamily: "'Inter',sans-serif",
          color: typeColor.dot,
          textDecoration: "none",
          padding: "4px 10px",
          borderRadius: 8,
          border: `1px solid ${typeColor.border}55`,
          whiteSpace: "nowrap",
        }}
      >
        Ver agenda
      </Link>

      {/* Dismiss */}
      <button
        type="button"
        onClick={dismiss}
        style={{
          flexShrink: 0,
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "#4b5563",
          padding: 4,
          lineHeight: 1,
          fontSize: 14,
        }}
        aria-label="Fechar"
      >
        ✕
      </button>
    </div>
  );
}

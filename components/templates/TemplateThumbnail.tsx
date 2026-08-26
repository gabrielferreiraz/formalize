"use client";

import type { TemplateInfo } from "@/lib/templates/registry";

interface Props {
  tpl: TemplateInfo;
  isActive: boolean;
  primaryColor: string;
}

function Checkmark({ primaryColor, top = 8, right = 8 }: { primaryColor: string; top?: number; right?: number }) {
  return (
    <div style={{
      position: "absolute", top, right,
      width: 22, height: 22, borderRadius: "50%",
      background: primaryColor, color: "#111",
      fontSize: 12, fontWeight: 700,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>✓</div>
  );
}

/**
 * Fake CSS mockup of a template's layout — instant, no PDF render needed.
 * Used for browsing/selecting; the real PDF is only generated on demand ("Ver PDF").
 */
export function TemplateThumbnail({ tpl, isActive, primaryColor }: Props) {
  return (
    <div style={{ height: 160, background: tpl.previewBg, position: "relative", overflow: "hidden" }}>
      {tpl.style === "dark" ? (
        <>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 6, background: tpl.previewAccent }} />
          <div style={{ position: "absolute", top: 20, left: 20, right: 20 }}>
            <div style={{ height: 28, width: "55%", background: `${tpl.previewAccent}22`, borderRadius: 4, marginBottom: 8 }} />
            <div style={{ height: 10, width: "80%", background: "#ffffff12", borderRadius: 3, marginBottom: 5 }} />
            <div style={{ height: 10, width: "65%", background: "#ffffff0d", borderRadius: 3, marginBottom: 5 }} />
            <div style={{ height: 10, width: "70%", background: "#ffffff0d", borderRadius: 3, marginBottom: 14 }} />
            <div style={{ height: 28, background: `${tpl.previewAccent}22`, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 10 }}>
              <div style={{ width: 60, height: 14, background: tpl.previewAccent, borderRadius: 2, opacity: 0.9 }} />
            </div>
          </div>
          {isActive && <Checkmark primaryColor={primaryColor} top={10} right={10} />}
        </>
      ) : tpl.id === "ctr-003" || tpl.id === "orc-006" ? (
        <>
          <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 5, background: tpl.previewAccent }} />
          <div style={{ position: "absolute", top: 14, left: 18, right: 12 }}>
            <div style={{ height: 10, width: "45%", background: "#11111120", borderRadius: 2, marginBottom: 6 }} />
            <div style={{ height: 7, width: "90%", background: "#11111112", borderRadius: 2, marginBottom: 4 }} />
            <div style={{ height: 7, width: "75%", background: "#11111112", borderRadius: 2, marginBottom: 4 }} />
            <div style={{ height: 7, width: "85%", background: "#11111112", borderRadius: 2, marginBottom: 4 }} />
            <div style={{ height: 7, width: "60%", background: "#11111112", borderRadius: 2, marginBottom: 4 }} />
            <div style={{ height: 7, width: "80%", background: "#11111112", borderRadius: 2, marginBottom: 10 }} />
            <div style={{ height: 20, background: "#f5f5f0", border: "1px solid #e5e5e0", borderRadius: 4, paddingLeft: 8, display: "flex", alignItems: "center" }}>
              <div style={{ width: 40, height: 8, background: `${tpl.previewAccent}44`, borderRadius: 2 }} />
            </div>
          </div>
          {isActive && <Checkmark primaryColor={primaryColor} top={10} right={10} />}
        </>
      ) : tpl.id === "orc-007" ? (
        <>
          <div style={{ position: "absolute", top: 8, left: 10, right: 10, height: 30, background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", borderRadius: 6, display: "flex", alignItems: "center", padding: "0 10px", justifyContent: "space-between" }}>
            <div style={{ height: 12, width: 40, background: "#ffffff22", borderRadius: 2 }} />
            <div style={{ height: 14, width: 34, background: tpl.previewAccent, borderRadius: 4 }} />
          </div>
          <div style={{ position: "absolute", top: 46, left: 10, right: 10 }}>
            <div style={{ background: "#fff", borderRadius: 4, padding: "8px 10px", marginBottom: 4, borderLeft: `3px solid ${tpl.previewAccent}` }}>
              <div style={{ height: 6, width: "70%", background: "#11111115", borderRadius: 2, marginBottom: 3 }} />
              <div style={{ height: 6, width: "50%", background: "#11111110", borderRadius: 2 }} />
            </div>
            <div style={{ background: "#fff", borderRadius: 4, padding: "8px 10px", marginBottom: 4 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <div style={{ fontSize: 12 }}>🎤</div>
                  <div style={{ height: 6, width: 50, background: "#11111115", borderRadius: 2 }} />
                </div>
                <div style={{ height: 8, width: 36, background: `${tpl.previewAccent}44`, borderRadius: 2 }} />
              </div>
            </div>
            <div style={{ background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", borderRadius: 6, padding: "10px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ height: 8, width: 30, background: "#ffffff33", borderRadius: 2 }} />
              <div style={{ height: 14, width: 60, background: "#fff", borderRadius: 3 }} />
            </div>
          </div>
          {isActive && <Checkmark primaryColor={primaryColor} top={8} right={8} />}
        </>
      ) : tpl.id === "ctr-004" ? (
        <>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 30, background: tpl.previewAccent, display: "flex", alignItems: "center", paddingLeft: 10 }}>
            <div style={{ height: 12, width: "40%", background: "#00000033", borderRadius: 2 }} />
          </div>
          <div style={{ position: "absolute", top: 30, left: 0, right: 0, height: 14, background: "#111", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ height: 6, width: "50%", background: "#ffffff22", borderRadius: 2 }} />
          </div>
          <div style={{ position: "absolute", top: 56, left: 14, right: 14 }}>
            <div style={{ height: 7, width: "90%", background: "#11111112", borderRadius: 2, marginBottom: 3 }} />
            <div style={{ height: 7, width: "75%", background: "#11111112", borderRadius: 2, marginBottom: 3 }} />
            <div style={{ height: 7, width: "80%", background: "#11111112", borderRadius: 2, marginBottom: 8 }} />
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
              <div style={{ width: 16, height: 12, background: "#111", borderRadius: 2 }} />
              <div style={{ height: 7, width: "50%", background: "#11111120", borderRadius: 2 }} />
            </div>
            <div style={{ height: 7, width: "85%", background: "#11111112", borderRadius: 2, marginBottom: 3, paddingLeft: 20 }} />
          </div>
          {isActive && <Checkmark primaryColor={primaryColor} top={44} right={10} />}
        </>
      ) : (
        // Light default (orc-002, orc-003, ctr-001, ctr-002)
        <>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: tpl.id === "orc-003" ? 36 : 22, background: tpl.id === "orc-003" ? "#f2f2ee" : "#fff", borderBottom: `2px solid ${tpl.previewAccent}`, display: "flex", alignItems: "center", paddingInline: 10, justifyContent: "space-between" }}>
            <div style={{ height: 10, width: 40, background: `${tpl.previewAccent}44`, borderRadius: 2 }} />
            <div style={{ height: 8, width: 60, background: "#11111115", borderRadius: 2 }} />
          </div>
          <div style={{ position: "absolute", top: tpl.id === "orc-003" ? 50 : 34, left: 12, right: 12 }}>
            <div style={{ background: "#fff", borderRadius: 4, border: "1px solid #e8e8e2", padding: "6px 8px", marginBottom: 5 }}>
              <div style={{ height: 6, width: "90%", background: "#11111110", borderRadius: 2, marginBottom: 3 }} />
              <div style={{ height: 6, width: "70%", background: "#11111110", borderRadius: 2, marginBottom: 3 }} />
              <div style={{ height: 6, width: "80%", background: "#11111110", borderRadius: 2 }} />
            </div>
            <div style={{ background: "#111", borderRadius: 4, padding: "6px 8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ height: 6, width: 30, background: "#ffffff44", borderRadius: 2 }} />
              <div style={{ height: 10, width: 50, background: tpl.previewAccent, borderRadius: 2, opacity: 0.9 }} />
            </div>
          </div>
          {isActive && <Checkmark primaryColor={primaryColor} top={8} right={8} />}
        </>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export function LogoCropModal({
  file,
  onConfirm,
  onCancel,
}: {
  file: File;
  onConfirm: (blob: Blob) => void;
  onCancel: () => void;
}) {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [dims, setDims] = useState({ natW: 0, natH: 0, dispW: 0, dispH: 0 });
  const [crop, setCrop] = useState({ x: 0, y: 0, w: 0, h: 0 });
  const [confirming, setConfirming] = useState(false);
  const [ratio, setRatio] = useState<number | null>(null);
  const dragRef = useRef<null | {
    type: "move" | "nw" | "ne" | "sw" | "se";
    startX: number; startY: number;
    startCrop: { x: number; y: number; w: number; h: number };
  }>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setImgSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    const stop = () => { dragRef.current = null; };
    window.addEventListener("mouseup", stop);
    window.addEventListener("touchend", stop);
    return () => {
      window.removeEventListener("mouseup", stop);
      window.removeEventListener("touchend", stop);
    };
  }, []);

  function onImgLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const img = e.currentTarget;
    const nw = img.naturalWidth;
    const nh = img.naturalHeight;
    if (!nw || !nh) return;
    const maxW = Math.min(window.innerWidth - 48, 500);
    const maxH = Math.min(window.innerHeight * 0.48, 360);
    const scale = Math.min(maxW / nw, maxH / nh, 1);
    const dw = Math.round(nw * scale);
    const dh = Math.round(nh * scale);
    setDims({ natW: nw, natH: nh, dispW: dw, dispH: dh });
    const p = 0.08;
    setCrop({
      x: Math.round(dw * p), y: Math.round(dh * p),
      w: Math.round(dw * (1 - 2 * p)), h: Math.round(dh * (1 - 2 * p)),
    });
  }

  function getPos(e: React.MouseEvent | React.TouchEvent) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    const pt = "touches" in e && e.touches.length > 0
      ? e.touches[0]
      : "changedTouches" in e
        ? (e as React.TouchEvent).changedTouches[0]
        : (e as unknown as MouseEvent);
    return {
      x: (pt as { clientX: number }).clientX - rect.left,
      y: (pt as { clientY: number }).clientY - rect.top,
    };
  }

  function startDrag(type: "move" | "nw" | "ne" | "sw" | "se") {
    return (e: React.MouseEvent | React.TouchEvent) => {
      e.stopPropagation();
      const pos = getPos(e);
      dragRef.current = { type, startX: pos.x, startY: pos.y, startCrop: { ...crop } };
    };
  }

  function onMove(e: React.MouseEvent | React.TouchEvent) {
    const d = dragRef.current;
    if (!d) return;
    const { dispW, dispH } = dims;
    if (!dispW) return;
    const pos = getPos(e);
    const dx = pos.x - d.startX;
    const dy = pos.y - d.startY;
    const s = d.startCrop;
    const MIN = 40;
    let { x, y, w, h } = s;

    if (d.type === "move") {
      x = Math.max(0, Math.min(dispW - w, s.x + dx));
      y = Math.max(0, Math.min(dispH - h, s.y + dy));
    } else if (d.type === "se") {
      w = Math.max(MIN, Math.min(dispW - s.x, s.w + dx));
      h = ratio ? w / ratio : Math.max(MIN, Math.min(dispH - s.y, s.h + dy));
    } else if (d.type === "sw") {
      const nx = Math.max(0, Math.min(s.x + s.w - MIN, s.x + dx));
      w = s.w + (s.x - nx); x = nx;
      h = ratio ? w / ratio : Math.max(MIN, Math.min(dispH - s.y, s.h + dy));
    } else if (d.type === "ne") {
      const ny = Math.max(0, Math.min(s.y + s.h - MIN, s.y + dy));
      h = s.h + (s.y - ny); y = ny;
      w = ratio ? h * ratio : Math.max(MIN, Math.min(dispW - s.x, s.w + dx));
    } else if (d.type === "nw") {
      const nx = Math.max(0, Math.min(s.x + s.w - MIN, s.x + dx));
      const ny = Math.max(0, Math.min(s.y + s.h - MIN, s.y + dy));
      w = s.w + (s.x - nx); x = nx;
      h = ratio ? w / ratio : s.h + (s.y - ny); y = ratio ? y : ny;
    }
    setCrop({ x, y, w, h });
  }

  async function handleConfirm() {
    if (!imgSrc || !dims.dispW || confirming) return;
    setConfirming(true);
    const { natW, natH, dispW, dispH } = dims;
    const scaleX = natW / dispW;
    const scaleY = natH / dispH;
    const sx = Math.round(crop.x * scaleX);
    const sy = Math.round(crop.y * scaleY);
    const sw = Math.max(1, Math.round(crop.w * scaleX));
    const sh = Math.max(1, Math.round(crop.h * scaleY));
    const canvas = document.createElement("canvas");
    canvas.width = sw; canvas.height = sh;
    const ctx = canvas.getContext("2d")!;
    const img = new Image();
    await new Promise<void>((res, rej) => {
      img.onload = () => res();
      img.onerror = () => rej(new Error("img load failed"));
      img.src = imgSrc;
    }).catch(() => { setConfirming(false); });
    if (!img.complete) return;
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
    canvas.toBlob(blob => {
      if (blob) onConfirm(blob);
      else setConfirming(false);
    }, "image/png");
  }

  function applyRatio(r: number | null) {
    setRatio(r);
    if (!r || !dims.dispW) return;
    const { dispW, dispH } = dims;
    const maxW = dispW * 0.84;
    const maxH = dispH * 0.84;
    let w = maxW, h = w / r;
    if (h > maxH) { h = maxH; w = h * r; }
    w = Math.round(w); h = Math.round(h);
    setCrop({ x: Math.round((dispW - w) / 2), y: Math.round((dispH - h) / 2), w, h });
  }

  const { dispW, dispH } = dims;
  const ready = dispW > 0;
  const H = 22;

  return createPortal(
    <div style={{
      position: "fixed", inset: 0, zIndex: 99999,
      background: "rgba(0,0,0,0.93)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "calc(24px + env(safe-area-inset-top, 0px)) 16px calc(24px + env(safe-area-inset-bottom, 0px))",
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      <style>{`@keyframes lcm-spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ width: "100%", maxWidth: 560 }}>
        <p style={{
          fontSize: 10, fontWeight: 700, color: "#e6b800",
          letterSpacing: "0.14em", textTransform: "uppercase",
          margin: "0 0 14px",
        }}>
          Ajustar logo
        </p>

        {imgSrc && (
          <img src={imgSrc} alt="" onLoad={onImgLoad} draggable={false} style={{ display: "none" }} />
        )}

        <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
          {([
            { label: "Livre", value: null },
            { label: "1:1", value: 1 },
            { label: "5:2", value: 2.5, hint: "máx sistema" },
          ] as { label: string; value: number | null; hint?: string }[]).map(p => (
            <button
              key={p.label}
              onClick={() => applyRatio(p.value)}
              style={{
                height: 28, padding: "0 12px", borderRadius: 8,
                border: `1px solid ${ratio === p.value ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.1)"}`,
                background: ratio === p.value ? "rgba(255,255,255,0.1)" : "transparent",
                color: ratio === p.value ? "#e8edf5" : "#5a7896",
                fontSize: 11, fontWeight: 600, fontFamily: "inherit", cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {p.label}{p.hint ? <span style={{ marginLeft: 4, opacity: 0.5, fontWeight: 400 }}>({p.hint})</span> : null}
            </button>
          ))}
        </div>

        {!ready ? (
          <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{
              width: 24, height: 24, borderRadius: "50%",
              border: "2px solid rgba(255,255,255,0.08)",
              borderTopColor: "#e6b800",
              animation: "lcm-spin 0.8s linear infinite",
            }} />
          </div>
        ) : (
          <div
            ref={containerRef}
            style={{
              position: "relative", width: dispW, height: dispH,
              margin: "0 auto", userSelect: "none", touchAction: "none",
              borderRadius: 8,
            }}
            onMouseMove={onMove}
            onTouchMove={onMove}
          >
            <img
              src={imgSrc ?? ""}
              alt=""
              width={dispW}
              height={dispH}
              draggable={false}
              style={{ display: "block", borderRadius: 8 }}
            />

            {([
              { left: 0, top: 0, width: dispW, height: crop.y },
              { left: 0, top: crop.y + crop.h, width: dispW, height: dispH - crop.y - crop.h },
              { left: 0, top: crop.y, width: crop.x, height: crop.h },
              { left: crop.x + crop.w, top: crop.y, width: dispW - crop.x - crop.w, height: crop.h },
            ] as React.CSSProperties[]).map((r, i) => (
              <div key={i} style={{ position: "absolute", background: "rgba(0,0,0,0.65)", pointerEvents: "none", ...r }} />
            ))}

            <div
              onMouseDown={startDrag("move")}
              onTouchStart={startDrag("move")}
              style={{
                position: "absolute",
                left: crop.x, top: crop.y, width: crop.w, height: crop.h,
                border: "1.5px solid rgba(255,255,255,0.9)",
                cursor: "move", boxSizing: "border-box",
                overflow: "visible",
              }}
            >
              {(["nw", "ne", "sw", "se"] as const).map(dir => (
                <div
                  key={dir}
                  onMouseDown={startDrag(dir)}
                  onTouchStart={startDrag(dir)}
                  style={{
                    position: "absolute",
                    width: H, height: H,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    ...(dir[0] === "n" ? { top: -H / 2 } : { bottom: -H / 2 }),
                    ...(dir[1] === "w" ? { left: -H / 2 } : { right: -H / 2 }),
                    cursor: `${dir}-resize`,
                    zIndex: 3,
                  }}
                >
                  <div style={{
                    width: 10, height: 10,
                    background: "#fff",
                    borderRadius: 2,
                    boxShadow: "0 1px 4px rgba(0,0,0,0.6)",
                    pointerEvents: "none",
                  }} />
                </div>
              ))}
            </div>
          </div>
        )}

        <p style={{ fontSize: 11, color: "#5a7896", margin: "10px 0 0", textAlign: "center" }}>
          Arraste para mover · Alças nos cantos para redimensionar
        </p>

        <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, height: 46, borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "transparent", color: "#7090b0",
              fontSize: 14, fontWeight: 600, fontFamily: "inherit", cursor: "pointer",
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!ready || confirming}
            style={{
              flex: 2, height: 46, borderRadius: 12, border: "none",
              background: "linear-gradient(135deg, #f5c842, #d4a017)",
              color: "#07090e", fontSize: 14, fontWeight: 700,
              fontFamily: "inherit",
              cursor: ready && !confirming ? "pointer" : "not-allowed",
              opacity: ready && !confirming ? 1 : 0.5,
            }}
          >
            {confirming ? "Processando..." : "Usar recorte"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

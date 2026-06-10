"use client";

import { useEffect, useRef, useState, useReducer, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  DndContext, DragEndEvent, DragStartEvent, DragOverlay,
  useDraggable, useDroppable,
  PointerSensor, TouchSensor, useSensor, useSensors,
} from "@dnd-kit/core";
import type { FieldPlacement } from "@/lib/pdf-overlay";

// ─── Shape types ──────────────────────────────────────────────────────────────

type ToolMode = "select" | "rect" | "eraser" | "textbox";

export interface ShapeAnnotation {
  id: string;
  kind: "rect" | "eraser" | "textbox";
  page: number;
  x: number; y: number; w: number; h: number;
  fill: string;
  opacity: number;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
}

type DocState = { placements: FieldPlacement[]; shapes: ShapeAnnotation[] };

// ─── Field catalogue ─────────────────────────────────────────────────────────

type FieldDef = { key: string; label: string };

const FIELD_CATEGORIES: { category: string; fields: FieldDef[] }[] = [
  {
    category: "Evento",
    fields: [
      { key: "evento", label: "Nome do Evento" },
      { key: "dataEventoBr", label: "Data do Evento" },
      { key: "horario", label: "Horário" },
      { key: "local", label: "Local" },
      { key: "cidadeEvento", label: "Cidade do Evento" },
      { key: "horasFormatado", label: "Duração (ex: 2h)" },
    ],
  },
  {
    category: "Contratante",
    fields: [
      { key: "contratanteNome", label: "Nome" },
      { key: "contratanteCpfCnpj", label: "CPF/CNPJ" },
      { key: "contratanteRg", label: "RG" },
      { key: "cidadeEstadoContratante", label: "Cidade/UF" },
      { key: "contratante", label: "Contratante (orç.)" },
    ],
  },
  {
    category: "Financeiro",
    fields: [
      { key: "valorCacheFormatado", label: "Cachê" },
      { key: "valorTotalFormatado", label: "Total" },
      { key: "valorTotalExtenso", label: "Total por extenso" },
      { key: "formaPagamento", label: "Forma de Pagamento" },
      { key: "backlineFmt", label: "Backline" },
      { key: "transporteFmt", label: "Transporte" },
      { key: "alimentacaoFmt", label: "Alimentação" },
      { key: "hospedagemFmt", label: "Hospedagem" },
    ],
  },
  {
    category: "Artista",
    fields: [
      { key: "artistaNome", label: "Nome do Artista" },
      { key: "artistaLegalNome", label: "Razão Social" },
      { key: "artistaCnpj", label: "CNPJ" },
      { key: "pixKey", label: "Chave PIX" },
      { key: "artistaInstrumentos", label: "Instrumentos" },
    ],
  },
  {
    category: "Assinatura",
    fields: [
      { key: "dataAssinaturaBr", label: "Data de Assinatura" },
      { key: "foro", label: "Foro" },
      { key: "hashContrato", label: "Cód. Certificado" },
    ],
  },
];

// ─── Font mapping ─────────────────────────────────────────────────────────────

type CssFontDef = { fontFamily: string; fontWeight: number; fontStyle?: string };

const CSS_FONT: Record<string, CssFontDef> = {
  "Helvetica": { fontFamily: "Helvetica, Arial, sans-serif", fontWeight: 400 },
  "Helvetica-Bold": { fontFamily: "Helvetica, Arial, sans-serif", fontWeight: 700 },
  "Helvetica-Oblique": { fontFamily: "Helvetica, Arial, sans-serif", fontWeight: 400, fontStyle: "italic" },
  "Helvetica-BoldOblique": { fontFamily: "Helvetica, Arial, sans-serif", fontWeight: 700, fontStyle: "italic" },
  "Times-Roman": { fontFamily: "'Times New Roman', Times, serif", fontWeight: 400 },
  "Times-Bold": { fontFamily: "'Times New Roman', Times, serif", fontWeight: 700 },
  "Times-Italic": { fontFamily: "'Times New Roman', Times, serif", fontWeight: 400, fontStyle: "italic" },
  "Times-BoldItalic": { fontFamily: "'Times New Roman', Times, serif", fontWeight: 700, fontStyle: "italic" },
  "Courier": { fontFamily: "'Courier New', Courier, monospace", fontWeight: 400 },
  "Courier-Bold": { fontFamily: "'Courier New', Courier, monospace", fontWeight: 700 },
  "Courier-Oblique": { fontFamily: "'Courier New', Courier, monospace", fontWeight: 400, fontStyle: "italic" },
  "Courier-BoldOblique": { fontFamily: "'Courier New', Courier, monospace", fontWeight: 700, fontStyle: "italic" },
  "Roboto": { fontFamily: "'Roboto', sans-serif", fontWeight: 400 },
  "Roboto-Bold": { fontFamily: "'Roboto', sans-serif", fontWeight: 700 },
  "Roboto-Italic": { fontFamily: "'Roboto', sans-serif", fontWeight: 400, fontStyle: "italic" },
  "OpenSans": { fontFamily: "'Open Sans', sans-serif", fontWeight: 400 },
  "OpenSans-Bold": { fontFamily: "'Open Sans', sans-serif", fontWeight: 700 },
  "Montserrat": { fontFamily: "'Montserrat', sans-serif", fontWeight: 400 },
  "Montserrat-Bold": { fontFamily: "'Montserrat', sans-serif", fontWeight: 700 },
  "Lato": { fontFamily: "'Lato', sans-serif", fontWeight: 400 },
  "Lato-Bold": { fontFamily: "'Lato', sans-serif", fontWeight: 700 },
  "Inter": { fontFamily: "'Inter', sans-serif", fontWeight: 400 },
  "Inter-Bold": { fontFamily: "'Inter', sans-serif", fontWeight: 700 },
  "Raleway": { fontFamily: "'Raleway', sans-serif", fontWeight: 400 },
  "Raleway-Bold": { fontFamily: "'Raleway', sans-serif", fontWeight: 700 },
  "Playfair": { fontFamily: "'Playfair Display', serif", fontWeight: 400 },
  "Playfair-Bold": { fontFamily: "'Playfair Display', serif", fontWeight: 700 },
  "Merriweather": { fontFamily: "'Merriweather', serif", fontWeight: 400 },
  "Merriweather-Bold": { fontFamily: "'Merriweather', serif", fontWeight: 700 },
  "PTSans": { fontFamily: "'PT Sans', sans-serif", fontWeight: 400 },
  "PTSans-Bold": { fontFamily: "'PT Sans', sans-serif", fontWeight: 700 },
  "SourceSans": { fontFamily: "'Source Sans 3', sans-serif", fontWeight: 400 },
  "SourceSans-Bold": { fontFamily: "'Source Sans 3', sans-serif", fontWeight: 700 },
};

const GOOGLE_FONTS_URL =
  "https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,400;0,700;1,400" +
  "&family=Open+Sans:wght@400;700" +
  "&family=Montserrat:wght@400;700" +
  "&family=Lato:wght@400;700" +
  "&family=Inter:wght@400;700" +
  "&family=Raleway:wght@400;700" +
  "&family=Playfair+Display:wght@400;700" +
  "&family=Merriweather:wght@400;700" +
  "&family=PT+Sans:wght@400;700" +
  "&family=Source+Sans+3:wght@400;700" +
  "&display=block"; // block = FOIT until font ready (prevents fallback flash)

// Standard PDF fonts — always available, no async loading needed
const STANDARD_FONT_KEYS = new Set([
  "Helvetica", "Helvetica-Bold", "Helvetica-Oblique", "Helvetica-BoldOblique",
  "Times-Roman", "Times-Bold", "Times-Italic", "Times-BoldItalic",
  "Courier", "Courier-Bold", "Courier-Oblique", "Courier-BoldOblique",
]);

function cssFontProps(family: string): CssFontDef {
  return CSS_FONT[family] ?? { fontFamily: "Helvetica, Arial, sans-serif", fontWeight: 400 };
}

// ─── Font picker ──────────────────────────────────────────────────────────────

const FONT_GROUPS: { group: string; fonts: { value: string; label: string; variant: string }[] }[] = [
  {
    group: "Padrão PDF",
    fonts: [
      { value: "Helvetica", label: "Helvetica", variant: "Regular" },
      { value: "Helvetica-Bold", label: "Helvetica", variant: "Bold" },
      { value: "Helvetica-Oblique", label: "Helvetica", variant: "Itálico" },
      { value: "Helvetica-BoldOblique", label: "Helvetica", variant: "Bold Itálico" },
      { value: "Times-Roman", label: "Times New Roman", variant: "Regular" },
      { value: "Times-Bold", label: "Times New Roman", variant: "Bold" },
      { value: "Times-Italic", label: "Times New Roman", variant: "Itálico" },
      { value: "Times-BoldItalic", label: "Times New Roman", variant: "Bold Itálico" },
      { value: "Courier", label: "Courier New", variant: "Regular" },
      { value: "Courier-Bold", label: "Courier New", variant: "Bold" },
      { value: "Courier-Oblique", label: "Courier New", variant: "Itálico" },
      { value: "Courier-BoldOblique", label: "Courier New", variant: "Bold Itálico" },
    ],
  },
  {
    group: "Google Fonts",
    fonts: [
      { value: "Roboto", label: "Roboto", variant: "Regular" },
      { value: "Roboto-Bold", label: "Roboto", variant: "Bold" },
      { value: "Roboto-Italic", label: "Roboto", variant: "Itálico" },
      { value: "OpenSans", label: "Open Sans", variant: "Regular" },
      { value: "OpenSans-Bold", label: "Open Sans", variant: "Bold" },
      { value: "Montserrat", label: "Montserrat", variant: "Regular" },
      { value: "Montserrat-Bold", label: "Montserrat", variant: "Bold" },
      { value: "Lato", label: "Lato", variant: "Regular" },
      { value: "Lato-Bold", label: "Lato", variant: "Bold" },
      { value: "Inter", label: "Inter", variant: "Regular" },
      { value: "Inter-Bold", label: "Inter", variant: "Bold" },
      { value: "Raleway", label: "Raleway", variant: "Regular" },
      { value: "Raleway-Bold", label: "Raleway", variant: "Bold" },
      { value: "Playfair", label: "Playfair Display", variant: "Regular" },
      { value: "Playfair-Bold", label: "Playfair Display", variant: "Bold" },
      { value: "Merriweather", label: "Merriweather", variant: "Regular" },
      { value: "Merriweather-Bold", label: "Merriweather", variant: "Bold" },
      { value: "PTSans", label: "PT Sans", variant: "Regular" },
      { value: "PTSans-Bold", label: "PT Sans", variant: "Bold" },
      { value: "SourceSans", label: "Source Sans 3", variant: "Regular" },
      { value: "SourceSans-Bold", label: "Source Sans 3", variant: "Bold" },
    ],
  },
];

function FontPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const current = FONT_GROUPS.flatMap((g) => g.fonts).find((f) => f.value === value);
  const def = cssFontProps(value);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="input-field w-full flex items-center justify-between gap-2 text-left cursor-pointer"
        style={{ fontFamily: def.fontFamily, fontWeight: def.fontWeight, fontStyle: def.fontStyle ?? "normal" }}
      >
        <span className="truncate">{current?.label ?? value}</span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0 text-gray-400" style={{ transform: open ? "rotate(180deg)" : undefined, transition: "transform 0.15s" }}>
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-[200] left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-[#0e1118] border border-gray-700/80 rounded-lg shadow-2xl">
          {FONT_GROUPS.map(({ group, fonts }) => (
            <div key={group}>
              <div className="px-3 py-1 text-[10px] text-gray-500 uppercase tracking-wider bg-[#0e1118] sticky top-0 border-b border-gray-800">
                {group}
              </div>
              {fonts.map((f) => {
                const css = cssFontProps(f.value);
                const isSelected = f.value === value;
                return (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => { onChange(f.value); setOpen(false); }}
                    className={`w-full px-3 py-1.5 flex items-center justify-between gap-2 text-left transition-colors ${isSelected ? "bg-yellow-500/10 text-yellow-400" : "text-white hover:bg-white/5"}`}
                  >
                    <span style={{ fontFamily: css.fontFamily, fontWeight: css.fontWeight, fontStyle: css.fontStyle ?? "normal", fontSize: "13px", lineHeight: 1.4 }}>
                      {f.label}
                    </span>
                    <span className="text-[10px] text-gray-500 shrink-0">{f.variant}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── History reducer ──────────────────────────────────────────────────────────

type HA =
  | { type: "push"; s: DocState }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "reset"; s: DocState };

type HS = { past: DocState[]; cur: DocState; future: DocState[] };

const EMPTY_DOC: DocState = { placements: [], shapes: [] };

function hReducer(s: HS, a: HA): HS {
  if (a.type === "push")
    return { past: [...s.past, s.cur].slice(-50), cur: a.s, future: [] };
  if (a.type === "undo" && s.past.length)
    return { past: s.past.slice(0, -1), cur: s.past[s.past.length - 1], future: [s.cur, ...s.future] };
  if (a.type === "redo" && s.future.length)
    return { past: [...s.past, s.cur], cur: s.future[0], future: s.future.slice(1) };
  if (a.type === "reset")
    return { past: [], cur: a.s, future: [] };
  return s;
}

// ─── MappingData type ─────────────────────────────────────────────────────────

type MappingData = {
  id: string;
  name: string;
  type: string;
  pdfUrl: string;
  pageCount: number;
  isActive: boolean;
  fields: FieldPlacement[];
  artistId: string;
  artist?: { name: string; legalName?: string | null; cnpj?: string | null; pixKey?: string | null };
};

function buildExampleValues(artist?: MappingData["artist"]): Record<string, string> {
  return {
    evento: "Show de Verão 2025",
    dataEventoBr: "15/08/2025",
    horario: "21:00",
    local: "Arena Music Hall",
    cidadeEvento: "São Paulo - SP",
    horasFormatado: "2h",
    contratanteNome: "João da Silva",
    contratanteCpfCnpj: "123.456.789-00",
    contratanteRg: "12.345.678-9",
    cidadeEstadoContratante: "São Paulo - SP",
    contratante: "Empresa de Eventos Ltda.",
    valorCacheFormatado: "R$ 5.000,00",
    valorTotalFormatado: "R$ 6.200,00",
    valorTotalExtenso: "seis mil e duzentos reais",
    formaPagamento: "50% entrada + 50% no dia",
    backlineFmt: "Incluso",
    transporteFmt: "R$ 800,00",
    alimentacaoFmt: "Incluso",
    hospedagemFmt: "R$ 400,00",
    artistaNome: artist?.name ?? "Nome do Artista",
    artistaLegalNome: artist?.legalName ?? "Artista LTDA",
    artistaCnpj: artist?.cnpj ?? "12.345.678/0001-90",
    pixKey: artist?.pixKey ?? "12.345.678/0001-90",
    artistaInstrumentos: "Guitarra, Baixo, Bateria, Voz",
    dataAssinaturaBr: "29/05/2025",
    foro: "São Paulo - SP",
    hashContrato: "a1b2c3d4e5f6",
  };
}

// ─── SidebarField ─────────────────────────────────────────────────────────────

function SidebarField({
  field,
  count,
  onAdd,
}: {
  field: FieldDef;
  count: number;
  onAdd: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `sidebar-${field.key}`,
    data: { type: "new-field", field },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      title={`Arraste ou clique para adicionar`}
      style={{ opacity: isDragging ? 0.15 : 1, transition: "opacity 0.15s, transform 0.15s", transform: isDragging ? "scale(0.95)" : "scale(1)" }}
      onClick={(e) => { e.stopPropagation(); onAdd(); }}
      className="flex items-center gap-1 text-xs px-2 py-1.5 rounded-lg bg-stage-700 border border-stage-600 text-gray-300 cursor-grab active:cursor-grabbing hover:border-gold-500/40 hover:bg-stage-600/60 hover:text-white transition-all select-none"
    >
      <span className="flex-1 truncate">{field.label}</span>
      {count > 0 && (
        <span className="shrink-0 min-w-[18px] text-center px-1 rounded-full bg-gold-500/25 text-gold-400 text-[10px] font-bold leading-[18px]">
          {count}
        </span>
      )}
    </div>
  );
}

// ─── FieldToken ───────────────────────────────────────────────────────────────

function FieldToken({
  placement,
  isSelected,
  isLocating,
  containerW,
  containerH,
  pageNaturalH,
  exampleValue,
  onClick,
}: {
  placement: FieldPlacement;
  isSelected: boolean;
  isLocating: boolean;
  containerW: number;
  containerH: number;
  /** Natural page height in PDF points at scale=1. Used to scale font sizes to match PDF output. */
  pageNaturalH: number;
  exampleValue: string;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging, transform } = useDraggable({
    id: `token-${placement.id}`,
    data: { type: "token", placementId: placement.id },
  });

  const font = cssFontProps(placement.fontFamily);
  const x = (placement.x / 100) * containerW + (transform?.x ?? 0);
  const y = (placement.y / 100) * containerH + (transform?.y ?? 0);
  // Scale font size: PDF uses points, canvas renders at containerH/pageNaturalH scale.
  // Without this, a 14pt font appears as 14px but should appear as 14 * scale px.
  const renderScale = pageNaturalH > 0 ? containerH / pageNaturalH : 1;
  const fontSizePx = placement.fontSize * renderScale;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      title={`${placement.label} · ${placement.key}`}
      style={{
        position: "absolute",
        left: x,
        top: y,
        fontSize: `${fontSizePx}px`,
        lineHeight: 1,
        color: placement.color,
        fontFamily: font.fontFamily,
        fontWeight: font.fontWeight,
        fontStyle: font.fontStyle ?? "normal",
        opacity: isDragging ? 0 : 1,
        zIndex: isSelected ? 20 : 10,
        cursor: isDragging ? "grabbing" : "grab",
        userSelect: "none",
        whiteSpace: "nowrap",
        padding: "2px 4px",
        borderRadius: 3,
        transition: "opacity 0.1s, box-shadow 0.15s",
        ...(isSelected
          ? {
            outline: "1.5px solid #e6b800",
            outlineOffset: "3px",
            background: "rgba(230,184,0,0.08)",
            boxShadow: "0 2px 14px rgba(230,184,0,0.25)",
          }
          : { outline: "1px dashed transparent" }),
      }}
      className={isSelected ? "" : "hover:outline hover:outline-1 hover:outline-blue-400/50 hover:bg-white/5"}
    >
      {exampleValue || `[${placement.label}]`}
      {isLocating && (
        <>
          <span style={{ position: "absolute", inset: -10, borderRadius: 6, border: "2px solid rgba(230,184,0,0.9)", pointerEvents: "none", animation: "locate-ring 0.55s ease-out 3" }} />
          <span style={{ position: "absolute", inset: -20, borderRadius: 10, border: "1.5px solid rgba(230,184,0,0.45)", pointerEvents: "none", animation: "locate-ring 0.55s ease-out 0.1s 3" }} />
        </>
      )}
    </div>
  );
}

// ─── ShapeLayer ───────────────────────────────────────────────────────────────

function ShapeLayer({
  shapes,
  page,
  selectedId,
  containerW,
  containerH,
  onSelect,
  onMove,
  onResize,
  toolMode,
}: {
  shapes: ShapeAnnotation[];
  page: number;
  selectedId: string | null;
  containerW: number;
  containerH: number;
  onSelect: (id: string) => void;
  onMove: (id: string, dx: number, dy: number) => void;
  onResize: (id: string, patch: Partial<ShapeAnnotation>) => void;
  toolMode: ToolMode;
}) {
  const dragRef = useRef<{ id: string; startX: number; startY: number; origX: number; origY: number } | null>(null);
  const resizeRef = useRef<{
    id: string; pos: string;
    startX: number; startY: number;
    origX: number; origY: number; origW: number; origH: number;
  } | null>(null);

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (dragRef.current) {
        const { id, startX, startY } = dragRef.current;
        const dxPx = e.clientX - startX;
        const dyPx = e.clientY - startY;
        const dx = containerW > 0 ? (dxPx / containerW) * 100 : 0;
        const dy = containerH > 0 ? (dyPx / containerH) * 100 : 0;
        onMove(id, dx, dy);
        dragRef.current.startX = e.clientX;
        dragRef.current.startY = e.clientY;
      }
      if (resizeRef.current) {
        const { id, pos, startX, startY, origX, origY, origW, origH } = resizeRef.current;
        const dxPx = e.clientX - startX;
        const dyPx = e.clientY - startY;
        const dx = containerW > 0 ? (dxPx / containerW) * 100 : 0;
        const dy = containerH > 0 ? (dyPx / containerH) * 100 : 0;
        const patch: Partial<ShapeAnnotation> = {};
        if (pos.includes("e")) { patch.w = Math.max(1, origW + dx); }
        if (pos.includes("s")) { patch.h = Math.max(1, origH + dy); }
        if (pos.includes("w")) { patch.x = Math.min(origX + origW - 1, origX + dx); patch.w = Math.max(1, origW - dx); }
        if (pos.includes("n")) { patch.y = Math.min(origY + origH - 1, origY + dy); patch.h = Math.max(1, origH - dy); }
        onResize(id, patch);
      }
    }
    function onMouseUp() {
      dragRef.current = null;
      resizeRef.current = null;
    }
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [containerW, containerH, onMove, onResize]);

  const pageShapes = shapes.filter((s) => s.page === page);

  return (
    <>
      {pageShapes.map((shape) => {
        const isSelected = selectedId === shape.id;
        const fontDef = cssFontProps(shape.fontFamily ?? "Helvetica");
        return (
          <div
            key={shape.id}
            style={{
              position: "absolute",
              left: `${shape.x}%`, top: `${shape.y}%`,
              width: `${shape.w}%`, height: `${shape.h}%`,
              background: shape.kind === "eraser" ? "#fff" : shape.fill,
              opacity: shape.kind === "textbox" ? 1 : shape.opacity,
              border: isSelected ? "2px solid #e6b800" : "1.5px solid transparent",
              cursor: toolMode === "select" ? "move" : "crosshair",
              boxSizing: "border-box",
              pointerEvents: toolMode === "select" ? "auto" : "none",
              display: "flex", alignItems: "center", justifyContent: "flex-start",
              padding: "2px 4px",
              overflow: "hidden",
            }}
            onMouseDown={(e) => {
              if (toolMode !== "select") return;
              e.stopPropagation();
              onSelect(shape.id);
              dragRef.current = { id: shape.id, startX: e.clientX, startY: e.clientY, origX: shape.x, origY: shape.y };
            }}
          >
            {shape.kind === "textbox" && (
              <span style={{
                fontSize: `${(shape.fontSize ?? 12) * (containerH / 841)}px`,
                color: shape.color ?? "#000",
                fontFamily: fontDef.fontFamily,
                fontWeight: fontDef.fontWeight,
                fontStyle: fontDef.fontStyle ?? "normal",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                pointerEvents: "none",
              }}>
                {shape.text || ""}
              </span>
            )}
            {isSelected && toolMode === "select" && (["nw", "ne", "sw", "se"] as const).map((pos) => (
              <div
                key={pos}
                style={{
                  position: "absolute", width: 8, height: 8,
                  background: "#e6b800", border: "1px solid #0e1118", borderRadius: 2,
                  top: pos.includes("n") ? -4 : "auto",
                  bottom: pos.includes("s") ? -4 : "auto",
                  left: pos.includes("w") ? -4 : "auto",
                  right: pos.includes("e") ? -4 : "auto",
                  cursor: pos === "nw" || pos === "se" ? "nwse-resize" : "nesw-resize",
                  zIndex: 30,
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  resizeRef.current = {
                    id: shape.id, pos,
                    startX: e.clientX, startY: e.clientY,
                    origX: shape.x, origY: shape.y, origW: shape.w, origH: shape.h,
                  };
                }}
              />
            ))}
          </div>
        );
      })}
    </>
  );
}

// ─── PdfCanvas ────────────────────────────────────────────────────────────────

function PdfCanvas({
  pdfUrl,
  currentPage,
  placements,
  selectedId,
  locatingId,
  fontsReady,
  exampleValues,
  onSelectField,
  onScaleChange,
  shapes,
  selectedShapeId,
  toolMode,
  drawColor,
  drawOpacity,
  onSelectShape,
  onShapeDrawn,
  onShapeMoved,
  onShapeResized,
}: {
  pdfUrl: string;
  currentPage: number;
  placements: FieldPlacement[];
  selectedId: string | null;
  locatingId: string | null;
  fontsReady: boolean;
  exampleValues: Record<string, string>;
  onSelectField: (id: string | null) => void;
  onScaleChange?: (scale: number) => void;
  shapes: ShapeAnnotation[];
  selectedShapeId: string | null;
  toolMode: ToolMode;
  drawColor: string;
  drawOpacity: number;
  onSelectShape: (id: string) => void;
  onShapeDrawn: (shape: ShapeAnnotation) => void;
  onShapeMoved: (id: string, dx: number, dy: number) => void;
  onShapeResized: (id: string, patch: Partial<ShapeAnnotation>) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });
  const drawRef = useRef<{ startX: number; startY: number } | null>(null);
  const [drawPreview, setDrawPreview] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  // Cache do documento pdfjs — evita re-download a cada troca de página
  const pdfDocCache = useRef<{ url: string; doc: import("pdfjs-dist").PDFDocumentProxy } | null>(null);
  // Natural page height in PDF points at scale=1 — used to scale font sizes correctly
  const [pageNaturalH, setPageNaturalH] = useState(0);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [rendering, setRendering] = useState(false);
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: "pdf-canvas-drop" });

  // Track actual rendered container size — fixes intrinsic vs CSS-size mismatch
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setContainerSize({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Active pdfjs render task — cancelled when page/url changes before render completes
  const renderTaskRef = useRef<{ cancel: () => void } | null>(null);

  // Render PDF page via pdfjs-dist
  useEffect(() => {
    let cancelled = false;
    setRenderError(null);
    setRendering(true);

    (async () => {
      if (!canvasRef.current || !pdfUrl) { setRendering(false); return; }
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

        // Reutiliza documento já carregado se a URL não mudou
        let doc: import("pdfjs-dist").PDFDocumentProxy;
        if (pdfDocCache.current?.url === pdfUrl) {
          doc = pdfDocCache.current.doc;
        } else {
          const proxyUrl = `/api/super/pdf-proxy?url=${encodeURIComponent(pdfUrl)}`;
          doc = await pdfjs.getDocument({ url: proxyUrl, disableAutoFetch: false, disableStream: false }).promise;
          if (cancelled) return;
          pdfDocCache.current = { url: pdfUrl, doc };
        }

        const page = await doc.getPage(currentPage);
        if (cancelled) return;

        const containerWidth = containerRef.current?.clientWidth ?? 672;
        const viewport = page.getViewport({ scale: 1 });
        if (!cancelled) {
          setPageNaturalH(viewport.height);
          const renderedH = viewport.height * (containerWidth / viewport.width);
          onScaleChange?.(renderedH / viewport.height);
        }
        const scale = containerWidth / viewport.width;
        const sv = page.getViewport({ scale });

        const canvas = canvasRef.current;
        if (!canvas || cancelled) return;
        canvas.width = sv.width;
        canvas.height = sv.height;

        const task = page.render({ canvasContext: canvas.getContext("2d")!, canvas, viewport: sv });
        renderTaskRef.current = task;
        await task.promise;
        renderTaskRef.current = null;
      } catch (e: any) {
        // RenderingCancelledException is expected on rapid page switches — not an error
        if (!cancelled && e?.name !== "RenderingCancelledException") {
          setRenderError(e instanceof Error ? e.message : "Erro ao renderizar PDF");
        }
      } finally {
        if (!cancelled) setRendering(false);
      }
    })();

    return () => {
      cancelled = true;
      renderTaskRef.current?.cancel();
      renderTaskRef.current = null;
    };
  }, [pdfUrl, currentPage]);

  const pagePlacements = placements.filter((p) => p.page === currentPage - 1);

  const cursorStyle =
    toolMode === "rect" ? "crosshair" :
    toolMode === "eraser" ? "crosshair" :
    toolMode === "textbox" ? "text" :
    "default";

  return (
    <div
      ref={(el) => {
        setDropRef(el);
        containerRef.current = el;
      }}
      data-canvas-container
      className="relative bg-white rounded-xl overflow-hidden select-none"
      style={{
        minHeight: 200,
        cursor: cursorStyle,
        boxShadow: isOver
          ? "0 0 0 2px rgba(230,184,0,0.8), 0 20px 60px rgba(230,184,0,0.18), 0 8px 32px rgba(0,0,0,0.4)"
          : "0 20px 60px rgba(0,0,0,0.35), 0 4px 16px rgba(0,0,0,0.2)",
        transition: "box-shadow 0.2s ease",
      }}
      onClick={() => { if (toolMode === "select") { onSelectField(null); } }}
      onPointerDown={(e) => {
        if (toolMode === "select") return;
        const rect = containerRef.current!.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width * 100;
        const y = (e.clientY - rect.top) / rect.height * 100;
        drawRef.current = { startX: x, startY: y };
        setDrawPreview({ x, y, w: 0, h: 0 });
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (!drawRef.current) return;
        const rect = containerRef.current!.getBoundingClientRect();
        const cx = Math.max(0, Math.min(100, (e.clientX - rect.left) / rect.width * 100));
        const cy = Math.max(0, Math.min(100, (e.clientY - rect.top) / rect.height * 100));
        const { startX, startY } = drawRef.current;
        setDrawPreview({
          x: Math.min(startX, cx), y: Math.min(startY, cy),
          w: Math.abs(cx - startX), h: Math.abs(cy - startY),
        });
      }}
      onPointerUp={(e) => {
        if (!drawRef.current || !drawPreview) return;
        if (drawPreview.w > 0.5 && drawPreview.h > 0.5) {
          const kind = toolMode === "eraser" ? "eraser" : toolMode === "textbox" ? "textbox" : "rect";
          onShapeDrawn({
            id: `sh-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            kind,
            page: currentPage - 1,
            x: parseFloat(drawPreview.x.toFixed(2)),
            y: parseFloat(drawPreview.y.toFixed(2)),
            w: parseFloat(drawPreview.w.toFixed(2)),
            h: parseFloat(drawPreview.h.toFixed(2)),
            fill: toolMode === "eraser" ? "#ffffff" : drawColor,
            opacity: toolMode === "eraser" ? 1 : drawOpacity,
            text: kind === "textbox" ? "" : undefined,
            fontSize: kind === "textbox" ? 12 : undefined,
            fontFamily: kind === "textbox" ? "Helvetica" : undefined,
            color: kind === "textbox" ? "#000000" : undefined,
          });
        }
        drawRef.current = null;
        setDrawPreview(null);
      }}
    >
      {(rendering || !fontsReady) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-30 rounded-xl gap-2">
          <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin" />
          {!rendering && !fontsReady && (
            <span className="text-[10px] text-gray-400 font-medium">Carregando fontes…</span>
          )}
        </div>
      )}
      {renderError && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-50 z-20 p-6 rounded-xl">
          <p className="text-xs text-red-500 text-center">{renderError}</p>
        </div>
      )}
      <canvas ref={canvasRef} style={{ display: "block", width: "100%", height: "auto" }} />
      {/* Shape layer */}
      <div className="absolute inset-0" style={{ pointerEvents: "none" }}>
        <ShapeLayer
          shapes={shapes}
          page={currentPage - 1}
          selectedId={selectedShapeId}
          containerW={containerSize.w}
          containerH={containerSize.h}
          onSelect={onSelectShape}
          onMove={onShapeMoved}
          onResize={onShapeResized}
          toolMode={toolMode}
        />
      </div>
      {/* Draw preview */}
      {drawPreview && toolMode !== "select" && (
        <div style={{
          position: "absolute",
          left: `${drawPreview.x}%`, top: `${drawPreview.y}%`,
          width: `${drawPreview.w}%`, height: `${drawPreview.h}%`,
          background: toolMode === "eraser" ? "#fff" : drawColor,
          opacity: toolMode === "eraser" ? 0.9 : drawOpacity * 0.8,
          border: "2px dashed rgba(230,184,0,0.8)",
          pointerEvents: "none",
          boxSizing: "border-box",
        }} />
      )}
      {/* Token overlay — hidden until fonts are confirmed loaded to prevent wrong-font flash */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ opacity: fontsReady ? 1 : 0, transition: fontsReady ? "opacity 0.18s ease" : "none" }}
      >
        <div className="relative w-full h-full pointer-events-auto">
          {pagePlacements.map((p) => (
            <FieldToken
              key={p.id}
              placement={p}
              isSelected={selectedId === p.id}
              isLocating={locatingId === p.id}
              containerW={containerSize.w}
              containerH={containerSize.h}
              pageNaturalH={pageNaturalH}
              exampleValue={exampleValues[p.key] ?? ""}
              onClick={() => { onSelectField(p.id); }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Trash zone (appears at bottom when dragging a placed token) ──────────────

function TrashZone({ visible }: { visible: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: "trash-zone" });
  return (
    <div
      ref={setNodeRef}
      style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 500,
        height: visible ? 68 : 0,
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "auto" : "none",
        transition: "height 0.22s cubic-bezier(0.4,0,0.2,1), opacity 0.18s",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
        background: isOver ? "rgba(239,68,68,0.22)" : "rgba(14,17,24,0.9)",
        borderTop: `1.5px solid ${isOver ? "rgba(239,68,68,0.55)" : "rgba(55,65,81,0.5)"}`,
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
      }}
    >
      <svg
        width="17" height="17" viewBox="0 0 24 24" fill="none"
        stroke={isOver ? "#f87171" : "#6b7280"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        style={{ transition: "stroke 0.15s, transform 0.15s", transform: isOver ? "scale(1.25)" : "scale(1)" }}
      >
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
      </svg>
      <span style={{ fontSize: 13, fontWeight: 600, color: isOver ? "#f87171" : "#6b7280", transition: "color 0.15s" }}>
        {isOver ? "Soltar para remover" : "Arraste aqui para remover"}
      </span>
    </div>
  );
}

// ─── Drag overlay preview ─────────────────────────────────────────────────────

function FieldDragPreview({
  sourceType,
  label,
  placement,
  exampleValues,
  renderScale,
}: {
  sourceType: "chip" | "token";
  label: string;
  placement?: FieldPlacement;
  exampleValues: Record<string, string>;
  renderScale: number;
}) {
  if (sourceType === "chip") {
    return (
      <div style={{
        padding: "7px 14px",
        borderRadius: 10,
        background: "linear-gradient(135deg, #e6b800 0%, #f5c842 100%)",
        color: "#0e1118",
        fontWeight: 700,
        fontSize: 13,
        lineHeight: 1,
        whiteSpace: "nowrap",
        userSelect: "none",
        cursor: "grabbing",
        boxShadow: "0 16px 40px rgba(230,184,0,0.5), 0 4px 16px rgba(0,0,0,0.35)",
        transform: "rotate(-2deg) scale(1.06)",
        transformOrigin: "center",
      }}>
        {label}
      </div>
    );
  }
  if (!placement) return null;
  const font = cssFontProps(placement.fontFamily);
  const value = exampleValues[placement.key] ?? `[${label}]`;
  return (
    <div style={{
      padding: "3px 6px",
      borderRadius: 4,
      background: "rgba(14,17,24,0.9)",
      border: "1.5px solid #e6b800",
      color: placement.color,
      fontSize: `${placement.fontSize * renderScale}px`,
      fontFamily: font.fontFamily,
      fontWeight: font.fontWeight,
      fontStyle: font.fontStyle ?? "normal",
      lineHeight: 1.3,
      whiteSpace: "nowrap",
      userSelect: "none",
      cursor: "grabbing",
      boxShadow: "0 10px 28px rgba(0,0,0,0.7), 0 0 0 3px rgba(230,184,0,0.18)",
      transform: "rotate(-1.5deg) scale(1.1)",
      transformOrigin: "center",
    }}>
      {value}
    </div>
  );
}

// ─── Main editor page ─────────────────────────────────────────────────────────

export default function PdfTemplateEditor() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [history, dispatch] = useReducer(hReducer, { past: [], cur: EMPTY_DOC, future: [] });
  const placements = history.cur.placements;
  const shapes = history.cur.shapes;
  const placementsRef = useRef<FieldPlacement[]>([]);
  const shapesRef = useRef<ShapeAnnotation[]>([]);
  useEffect(() => { placementsRef.current = placements; }, [placements]);
  useEffect(() => { shapesRef.current = shapes; }, [shapes]);

  function pushDoc(next: DocState | ((prev: DocState) => DocState)) {
    const s = typeof next === "function" ? next(history.cur) : next;
    dispatch({ type: "push", s });
  }
  function pushPlacements(fn: (p: FieldPlacement[]) => FieldPlacement[]) {
    pushDoc((prev) => ({ ...prev, placements: fn(prev.placements) }));
  }
  function pushShapes(fn: (s: ShapeAnnotation[]) => ShapeAnnotation[]) {
    pushDoc((prev) => ({ ...prev, shapes: fn(prev.shapes) }));
  }
  // Keep existing `push` as alias
  function push(next: FieldPlacement[] | ((prev: FieldPlacement[]) => FieldPlacement[])) {
    const p = typeof next === "function" ? next(placementsRef.current) : next;
    pushPlacements(() => p);
  }

  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  const [toolMode, setToolMode] = useState<ToolMode>("select");
  const [drawColor, setDrawColor] = useState("#ffff00");
  const [drawOpacity, setDrawOpacity] = useState(1.0);

  const [mapping, setMapping] = useState<MappingData | null>(null);
  const [exampleValues, setExampleValues] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedIdRef = useRef<string | null>(null);
  useEffect(() => { selectedIdRef.current = selectedId; }, [selectedId]);
  const selectedShapeIdRef = useRef<string | null>(null);
  useEffect(() => { selectedShapeIdRef.current = selectedShapeId; }, [selectedShapeId]);

  const [zoom, setZoom] = useState(1.0);
  const [saving, setSaving] = useState(false);
  const [activating, setActivating] = useState(false);
  const [showSavedModal, setShowSavedModal] = useState(false);
  const [lastSaved, setLastSaved] = useState<string>(JSON.stringify(EMPTY_DOC));
  const curSerialized = JSON.stringify({ placements, shapes });
  const hasUnsaved = curSerialized !== lastSaved && !saving;

  const [isMobile, setIsMobile] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<null | "fields" | "properties">(null);
  const [locatingId, setLocatingId] = useState<string | null>(null);
  const locatingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const canvasScrollRef = useRef<HTMLDivElement | null>(null);
  const [showExitModal, setShowExitModal] = useState(false);
  const [testingPdf, setTestingPdf] = useState(false);

  // Font loading state — tokens are hidden until their fonts are confirmed loaded
  const [fontsReady, setFontsReady] = useState(false);
  const [gFontsCssReady, setGFontsCssReady] = useState(false);
  const loadedFontKeys = useRef<Set<string>>(new Set(Array.from(STANDARD_FONT_KEYS)));
  // renderScale = containerH / pageNaturalH — needed to scale drag preview font sizes
  const [renderScale, setRenderScale] = useState(1);
  const [activeDrag, setActiveDrag] = useState<{
    sourceType: "chip" | "token";
    label: string;
    placement?: FieldPlacement;
  } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
  );

  // Mobile detection
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Auto-open properties panel when a field is selected on mobile
  useEffect(() => {
    if (isMobile && selectedId) setMobilePanel("properties");
  }, [selectedId, isMobile]);

  // Load Google Fonts CSS — notifies when @font-face rules are in the document
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = GOOGLE_FONTS_URL;
    link.onload = () => setGFontsCssReady(true);
    link.onerror = () => setGFontsCssReady(true); // proceed with fallback fonts on error
    document.head.appendChild(link);
    return () => { if (document.head.contains(link)) document.head.removeChild(link); };
  }, []);

  // Set of unique font families currently in use (stable string for useEffect dep)
  const usedFontKey = useMemo(
    () => Array.from(new Set(placements.map((p) => p.fontFamily))).sort().join("|"),
    [placements],
  );

  // When CSS is ready AND placements are known, load any new Google Fonts explicitly
  useEffect(() => {
    if (!gFontsCssReady) return; // wait for @font-face rules to be in the document

    const needed = Array.from(new Set(placements.map((p) => p.fontFamily))).filter(
      (k) => !loadedFontKeys.current.has(k),
    );

    if (!needed.length) {
      setFontsReady(true);
      return;
    }

    setFontsReady(false);
    let cancelled = false;

    Promise.allSettled(
      needed.map((k) => {
        const def = CSS_FONT[k];
        if (!def) return Promise.resolve();
        // Strip quotes and fallbacks to get the exact font family name
        const fam = def.fontFamily.split(",")[0].trim().replace(/['"]/g, "");
        return document.fonts.load(`${def.fontStyle ?? "normal"} ${def.fontWeight} 16px "${fam}"`);
      }),
    ).then(() => {
      if (cancelled) return;
      needed.forEach((k) => loadedFontKeys.current.add(k));
      setFontsReady(true);
    });

    return () => { cancelled = true; };
  }, [usedFontKey, gFontsCssReady]);

  // Load mapping data
  useEffect(() => {
    fetch(`/api/super/pdf-templates/${id}`)
      .then((r) => r.json())
      .then((data: MappingData) => {
        setMapping(data);
        const raw = data.fields as any;
        let state: DocState;
        if (Array.isArray(raw)) {
          state = { placements: raw as FieldPlacement[], shapes: [] };
        } else {
          state = {
            placements: Array.isArray(raw?.placements) ? raw.placements : [],
            shapes: Array.isArray(raw?.shapes) ? raw.shapes : [],
          };
        }
        dispatch({ type: "reset", s: state });
        setLastSaved(JSON.stringify(state));
        setExampleValues(buildExampleValues(data.artist));
      });
  }, [id]);

  // Ctrl+scroll zoom
  useEffect(() => {
    function onWheel(e: WheelEvent) {
      if (!e.ctrlKey) return;
      e.preventDefault();
      setZoom((z) => parseFloat(Math.max(0.4, Math.min(2.5, z - e.deltaY * 0.001)).toFixed(2)));
    }
    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (document.activeElement as HTMLElement)?.tagName ?? "";
      const inInput = ["INPUT", "SELECT", "TEXTAREA"].includes(tag);

      // Undo / Redo
      if (e.ctrlKey && !e.shiftKey && (e.key === "z" || e.key === "Z") && !inInput) {
        e.preventDefault(); dispatch({ type: "undo" }); return;
      }
      if ((e.ctrlKey && (e.key === "y" || e.key === "Y")) || (e.ctrlKey && e.shiftKey && (e.key === "z" || e.key === "Z"))) {
        if (!inInput) { e.preventDefault(); dispatch({ type: "redo" }); return; }
      }

      // Escape
      if (e.key === "Escape") { setSelectedId(null); setSelectedShapeId(null); setToolMode("select"); return; }

      // Tool shortcuts
      if (!inInput) {
        if (e.key === "v" || e.key === "V") { setToolMode("select"); return; }
        if (e.key === "r" || e.key === "R") { setToolMode("rect"); return; }
        if (e.key === "e" || e.key === "E") { setToolMode("eraser"); return; }
        if (e.key === "t" || e.key === "T") { setToolMode("textbox"); return; }
      }

      // Delete / Backspace
      if ((e.key === "Delete" || e.key === "Backspace") && !inInput) {
        if (selectedIdRef.current) {
          e.preventDefault();
          const sid = selectedIdRef.current;
          push((prev) => prev.filter((p) => p.id !== sid));
          setSelectedId(null);
          return;
        }
        if (selectedShapeIdRef.current) {
          e.preventDefault();
          const ssid = selectedShapeIdRef.current;
          pushShapes((prev) => prev.filter((s) => s.id !== ssid));
          setSelectedShapeId(null);
          return;
        }
      }

      // Arrow nudge (when field selected and not in input)
      if (!inInput && selectedIdRef.current && ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
        e.preventDefault();
        const step = e.ctrlKey ? 1 : e.shiftKey ? 0.5 : 0.1;
        const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
        const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
        const sid = selectedIdRef.current;
        push((prev) =>
          prev.map((p) =>
            p.id === sid
              ? { ...p, x: parseFloat(Math.max(0, Math.min(100, p.x + dx)).toFixed(2)), y: parseFloat(Math.max(0, Math.min(100, p.y + dy)).toFixed(2)) }
              : p
          )
        );
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Drag start — capture active item for DragOverlay
  function handleDragStart(event: DragStartEvent) {
    const data = event.active.data.current as { type: string; field?: FieldDef; placementId?: string };
    if (data.type === "new-field" && data.field) {
      setActiveDrag({ sourceType: "chip", label: data.field.label });
    } else if (data.type === "token" && data.placementId) {
      const p = placementsRef.current.find((x) => x.id === data.placementId);
      if (p) setActiveDrag({ sourceType: "token", label: p.label, placement: p });
    }
  }

  // Drag end handler
  function handleDragEnd(event: DragEndEvent) {
    setActiveDrag(null);
    const { active, over, delta } = event;
    const activeData = active.data.current as { type: string; field?: FieldDef; placementId?: string };

    // Token dropped outside canvas (including on trash zone) → delete
    if (activeData.type === "token" && activeData.placementId) {
      if (over?.id !== "pdf-canvas-drop") {
        push((prev) => prev.filter((p) => p.id !== activeData.placementId));
        if (selectedIdRef.current === activeData.placementId) setSelectedId(null);
        return;
      }
    }

    if (!over || over.id !== "pdf-canvas-drop") return;
    const canvasEl = document.querySelector("[data-canvas-container]");
    if (!canvasEl) return;
    const rect = canvasEl.getBoundingClientRect();

    if (activeData.type === "new-field" && activeData.field) {
      const activatorEvent = (event as any).activatorEvent as PointerEvent;
      if (!activatorEvent) return;

      const rawX = activatorEvent.clientX + delta.x - rect.left;
      const rawY = activatorEvent.clientY + delta.y - rect.top;
      const xPct = parseFloat(Math.max(0, Math.min(100, (rawX / rect.width) * 100)).toFixed(2));
      const yPct = parseFloat(Math.max(0, Math.min(100, (rawY / rect.height) * 100)).toFixed(2));

      const newP: FieldPlacement = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        key: activeData.field.key,
        label: activeData.field.label,
        page: currentPage - 1,
        x: xPct,
        y: yPct,
        fontSize: 12,
        fontFamily: "Helvetica",
        color: "#000000",
      };
      push((prev) => [...prev, newP]);
      setSelectedId(newP.id);
    }

    if (activeData.type === "token" && activeData.placementId) {
      push((prev) =>
        prev.map((p) => {
          if (p.id !== activeData.placementId) return p;
          return {
            ...p,
            x: parseFloat(Math.max(0, Math.min(100, p.x + (delta.x / rect.width) * 100)).toFixed(2)),
            y: parseFloat(Math.max(0, Math.min(100, p.y + (delta.y / rect.height) * 100)).toFixed(2)),
          };
        })
      );
    }
  }

  function updatePlacement(id: string, patch: Partial<FieldPlacement>) {
    push((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }

  function removePlacement(id: string) {
    push((prev) => prev.filter((p) => p.id !== id));
    setSelectedId(null);
  }

  function duplicatePlacement(id: string) {
    const src = placementsRef.current.find((p) => p.id === id);
    if (!src) return;
    const dup: FieldPlacement = {
      ...src,
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      x: parseFloat(Math.min(100, src.x + 2).toFixed(2)),
      y: parseFloat(Math.min(100, src.y + 2).toFixed(2)),
    };
    push((prev) => [...prev, dup]);
    setSelectedId(dup.id);
  }

  function addShape(s: ShapeAnnotation) {
    pushShapes((prev) => [...prev, s]);
    setSelectedShapeId(s.id);
    setToolMode("select");
  }

  function updateShape(id: string, patch: Partial<ShapeAnnotation>) {
    pushShapes((prev) => prev.map((s) => s.id === id ? { ...s, ...patch } : s));
  }

  function removeShape(id: string) {
    pushShapes((prev) => prev.filter((s) => s.id !== id));
    setSelectedShapeId(null);
  }

  function handleShapeMoved(id: string, dx: number, dy: number) {
    pushShapes((prev) => prev.map((s) => s.id === id ? {
      ...s,
      x: parseFloat(Math.max(0, Math.min(100 - s.w, s.x + dx)).toFixed(2)),
      y: parseFloat(Math.max(0, Math.min(100 - s.h, s.y + dy)).toFixed(2)),
    } : s));
  }

  function handleShapeResized(id: string, patch: Partial<ShapeAnnotation>) {
    pushShapes((prev) => prev.map((s) => s.id === id ? { ...s, ...patch } : s));
  }

  function selectShape(id: string) {
    setSelectedShapeId(id);
    setSelectedId(null);
  }

  const locate = useCallback((p: FieldPlacement) => {
    const targetPage = p.page + 1;
    if (targetPage !== currentPage) setCurrentPage(targetPage);
    setSelectedId(p.id);
    if (locatingTimerRef.current) clearTimeout(locatingTimerRef.current);
    setLocatingId(p.id);
    locatingTimerRef.current = setTimeout(() => setLocatingId(null), 1900);
    // Scroll canvas to center on the field (wait for page change to render)
    setTimeout(() => {
      const scrollEl = canvasScrollRef.current;
      const canvasEl = document.querySelector("[data-canvas-container]") as HTMLElement | null;
      if (!scrollEl || !canvasEl) return;
      const fieldY = (p.y / 100) * canvasEl.offsetHeight;
      const fieldX = (p.x / 100) * canvasEl.offsetWidth;
      const targetTop = canvasEl.offsetTop + fieldY - scrollEl.clientHeight / 2;
      const targetLeft = canvasEl.offsetLeft + fieldX - scrollEl.clientWidth / 2;
      scrollEl.scrollTo({ top: Math.max(0, targetTop), left: Math.max(0, targetLeft), behavior: "smooth" });
    }, targetPage !== currentPage ? 320 : 40);
  }, [currentPage]);

  function addFieldAtCenter(field: FieldDef) {
    const newP: FieldPlacement = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      key: field.key,
      label: field.label,
      page: currentPage - 1,
      x: 40,
      y: 45,
      fontSize: 12,
      fontFamily: "Helvetica",
      color: "#000000",
    };
    push((prev) => [...prev, newP]);
    setSelectedId(newP.id);
  }

  // Warn on browser close/refresh when unsaved
  useEffect(() => {
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (JSON.stringify({ placements: placementsRef.current, shapes: shapesRef.current }) !== lastSaved) {
        e.preventDefault();
        e.returnValue = "";
      }
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [lastSaved]);

  // Test PDF with current (possibly unsaved) state
  async function handleTestPdf() {
    setTestingPdf(true);
    try {
      const res = await fetch(`/api/super/pdf-templates/${id}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields: placementsRef.current, shapes: shapesRef.current }),
      });
      if (!res.ok) throw new Error("Erro ao gerar PDF");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      alert("Erro ao gerar prévia do PDF. Tente novamente.");
    } finally {
      setTestingPdf(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/super/pdf-templates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields: { placements: placementsRef.current, shapes: shapesRef.current } }),
      });
      if (!res.ok) throw new Error();
      setLastSaved(JSON.stringify({ placements: placementsRef.current, shapes: shapesRef.current }));
      setShowSavedModal(true);
    } catch {
      alert("Erro ao salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  async function handleActivate() {
    setActivating(true);
    try {
      await fetch(`/api/super/pdf-templates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields: { placements: placementsRef.current, shapes: shapesRef.current }, isActive: true }),
      });
      setMapping((m) => m ? { ...m, isActive: true } : m);
      setLastSaved(JSON.stringify({ placements: placementsRef.current, shapes: shapesRef.current }));
    } finally {
      setActivating(false);
      setShowSavedModal(false);
    }
  }

  const selectedPlacement = placements.find((p) => p.id === selectedId) ?? null;
  const selectedShape = shapes.find((s) => s.id === selectedShapeId) ?? null;

  // Placed count per key
  const placedCounts = placements.reduce<Record<string, number>>((acc, p) => {
    acc[p.key] = (acc[p.key] ?? 0) + 1;
    return acc;
  }, {});

  if (!mapping) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-2 border-stage-500 border-t-gold-500 rounded-full animate-spin" />
      </div>
    );
  }

  // ── Saved modal ──────────────────────────────────────────────────────────────
  const savedModal = showSavedModal && (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 px-4">
      <div className="bg-stage-800 border border-stage-600 rounded-2xl p-6 w-full max-w-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/30 flex items-center justify-center shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-gray-100">Template salvo</p>
            <p className="text-xs text-gray-500">{mapping.name} · {placements.length} campo{placements.length !== 1 ? "s" : ""}</p>
          </div>
        </div>

        <div className="space-y-2">
          <button
            onClick={() => setShowSavedModal(false)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-stage-500 bg-stage-700/50 hover:bg-stage-700 text-left transition-colors"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-gray-200">Continuar editando</p>
              <p className="text-xs text-gray-500">Voltar ao canvas</p>
            </div>
          </button>

          <button
            onClick={() => handleTestPdf()}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-stage-500 bg-stage-700/50 hover:bg-stage-700 text-left transition-colors"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
              <line x1="9" y1="13" x2="15" y2="13" /><line x1="9" y1="17" x2="13" y2="17" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-gray-200">Testar PDF</p>
              <p className="text-xs text-gray-500">Prévia com dados reais de exemplo</p>
            </div>
          </button>

          {!mapping.isActive ? (
            <button
              onClick={handleActivate}
              disabled={activating}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-gold-500/40 bg-gold-500/5 hover:bg-gold-500/10 text-left transition-colors disabled:opacity-50"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#e6b800" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-gold-400">{activating ? "Ativando…" : "Ativar template"}</p>
                <p className="text-xs text-gray-500">Usar este PDF na geração de documentos</p>
              </div>
            </button>
          ) : (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-green-500/25 bg-green-500/5">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
              <p className="text-sm text-green-400 font-semibold">Template já está ativo</p>
            </div>
          )}
        </div>

        <button
          onClick={() => { setShowSavedModal(false); router.push("/super-admin/pdf-templates"); }}
          className="w-full py-2.5 rounded-xl border border-stage-600 text-gray-500 hover:text-gray-300 text-sm transition-colors"
        >
          Voltar para lista
        </button>
      </div>
    </div>
  );

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveDrag(null)}
    >
      <DragOverlay
        dropAnimation={{ duration: 180, easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)" }}
        style={{ cursor: "grabbing" }}
      >
        {activeDrag ? (
          <FieldDragPreview
            sourceType={activeDrag.sourceType}
            label={activeDrag.label}
            placement={activeDrag.placement}
            exampleValues={exampleValues}
            renderScale={renderScale}
          />
        ) : null}
      </DragOverlay>

      <TrashZone visible={activeDrag?.sourceType === "token"} />

      {savedModal}

      {/* ── Exit without saving modal ──────────────────────────────────────── */}
      {showExitModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 px-4">
          <div className="bg-stage-800 border border-stage-600 rounded-2xl p-6 w-full max-w-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-100">Alterações não salvas</p>
                <p className="text-xs text-gray-500 mt-0.5">O que deseja fazer antes de sair?</p>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={async () => {
                  setShowExitModal(false);
                  await handleSave();
                  router.push("/super-admin/pdf-templates");
                }}
                disabled={saving}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-gold-500/40 bg-gold-500/5 hover:bg-gold-500/10 text-left transition-colors disabled:opacity-50"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#e6b800" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-gold-400">{saving ? "Salvando…" : "Salvar e sair"}</p>
                  <p className="text-xs text-gray-500">Guardar posicionamentos e voltar</p>
                </div>
              </button>

              <button
                onClick={() => { setShowExitModal(false); router.push("/super-admin/pdf-templates"); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-stage-500 bg-stage-700/40 hover:bg-stage-700 text-left transition-colors"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-gray-300">Sair sem salvar</p>
                  <p className="text-xs text-gray-500">Descartar alterações desta sessão</p>
                </div>
              </button>

              <button
                onClick={() => setShowExitModal(false)}
                className="w-full py-2.5 rounded-xl border border-stage-600 text-gray-500 hover:text-gray-300 text-sm transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col h-[calc(100vh-64px)]">
        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-stage-600 bg-stage-800 shrink-0">
          <button
            onClick={() => hasUnsaved ? setShowExitModal(true) : router.push("/super-admin/pdf-templates")}
            className="text-gray-500 hover:text-gray-200 text-sm transition-colors"
          >
            ←
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-gray-200 truncate">{mapping.name}</p>
              {hasUnsaved && (
                <span title="Alterações não salvas" className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
              )}
            </div>
            <p className="text-xs text-gray-500 capitalize">{mapping.type} · {mapping.pageCount} pág. · {placements.length} campo{placements.length !== 1 ? "s" : ""}</p>
          </div>

          {/* Undo / Redo */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => dispatch({ type: "undo" })}
              disabled={!history.past.length}
              title="Desfazer (Ctrl+Z)"
              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-200 hover:bg-stage-700 disabled:opacity-25 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 14 4 9 9 4" /><path d="M20 20v-7a4 4 0 0 0-4-4H4" />
              </svg>
            </button>
            <button
              onClick={() => dispatch({ type: "redo" })}
              disabled={!history.future.length}
              title="Refazer (Ctrl+Y)"
              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-200 hover:bg-stage-700 disabled:opacity-25 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 14 20 9 15 4" /><path d="M4 20v-7a4 4 0 0 1 4-4h12" />
              </svg>
            </button>
          </div>

          {mapping.isActive && (
            <span className="text-xs px-2 py-1 rounded-full bg-green-500/15 text-green-400 border border-green-500/30 shrink-0">
              Ativo
            </span>
          )}

          <button
            onClick={handleTestPdf}
            disabled={testingPdf}
            className="hidden md:inline-flex px-3 py-1.5 rounded-xl border border-stage-500 text-gray-400 text-xs hover:text-white hover:border-stage-400 transition-colors shrink-0 disabled:opacity-50"
          >
            {testingPdf ? "Gerando…" : "Testar PDF"}
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-1.5 rounded-xl border border-stage-500 text-gray-300 text-sm hover:text-white hover:border-stage-400 transition-colors disabled:opacity-50 shrink-0"
          >
            {saving ? "Salvando…" : "Salvar"}
          </button>

          {!mapping.isActive && (
            <button
              onClick={handleActivate}
              disabled={activating}
              className="px-4 py-1.5 rounded-xl bg-gold-500 text-stage-900 text-sm font-bold hover:bg-gold-400 transition-colors disabled:opacity-50 shrink-0"
            >
              {activating ? "Ativando…" : "Ativar"}
            </button>
          )}
        </div>

        {/* ── Body ────────────────────────────────────────────────────────────── */}
        <div className="flex flex-1 overflow-hidden">

          {/* Left sidebar */}
          <div className="hidden md:flex w-48 shrink-0 border-r border-stage-600 bg-stage-800 overflow-y-auto flex-col">
            <div className="p-3 space-y-4 flex-1">
              {FIELD_CATEGORIES.map((cat) => (
                <div key={cat.category}>
                  <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest mb-1.5">
                    {cat.category}
                  </p>
                  <div className="space-y-1">
                    {cat.fields.map((f) => (
                      <SidebarField
                        key={f.key}
                        field={f}
                        count={placedCounts[f.key] ?? 0}
                        onAdd={() => addFieldAtCenter(f)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {/* Placed fields — locate shortcut */}
            {placements.length > 0 && (
              <div className="border-t border-stage-700 pt-3 space-y-0.5">
                <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest mb-1.5 px-1 flex items-center gap-1.5">
                  Posicionados
                  <span className="px-1.5 py-0.5 rounded-full bg-stage-600 text-gray-400 text-[10px] font-bold leading-none">{placements.length}</span>
                </p>
                {placements.map((p) => (
                  <div
                    key={p.id}
                    className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition-all ${selectedId === p.id
                      ? "bg-gold-500/12 border border-gold-500/30 text-yellow-400"
                      : "border border-transparent text-gray-500 hover:bg-stage-700 hover:text-gray-200"
                      }`}
                  >
                    <span
                      onClick={() => setSelectedId(p.id)}
                      className="flex-1 truncate text-[11px] cursor-pointer"
                    >{p.label}</span>
                    <span className="shrink-0 text-[10px] opacity-40">p{p.page + 1}</span>
                    <button
                      onClick={() => locate(p)}
                      title={`Localizar "${p.label}" na pág. ${p.page + 1}`}
                      className="p-1 text-gray-600 hover:text-yellow-400 transition-colors shrink-0"
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="px-3 pb-3 pt-1 border-t border-stage-700 space-y-1">
              <p className="text-[10px] text-gray-600">Clique ou arraste para adicionar</p>
              <p className="text-[10px] text-gray-600">Setas = mover 0.1% · Ctrl+Seta = 1%</p>
              <p className="text-[10px] text-gray-600">Delete = remover · Ctrl+Z = desfazer</p>
            </div>
          </div>

          {/* Center — canvas */}
          <div className="flex-1 flex flex-col overflow-auto bg-stage-900">
            {/* Toolbar: page nav + zoom */}
            <div className="flex items-center justify-between px-4 py-2 shrink-0 border-b border-stage-700/50">
              {/* Page nav */}
              {mapping.pageCount > 1 ? (
                <div className="flex items-center gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                    className="px-2.5 py-1 rounded-lg border border-stage-600 text-gray-400 text-xs disabled:opacity-30 hover:text-white transition-colors"
                  >
                    ←
                  </button>
                  <span className="text-xs text-gray-500">
                    {currentPage} / {mapping.pageCount}
                  </span>
                  <button
                    disabled={currentPage === mapping.pageCount}
                    onClick={() => setCurrentPage((p) => p + 1)}
                    className="px-2.5 py-1 rounded-lg border border-stage-600 text-gray-400 text-xs disabled:opacity-30 hover:text-white transition-colors"
                  >
                    →
                  </button>
                </div>
              ) : <div />}

              {/* Zoom control */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setZoom((z) => parseFloat(Math.max(0.4, z - 0.1).toFixed(1)))}
                  className="w-6 h-6 rounded-md border border-stage-600 text-gray-400 hover:text-white text-sm flex items-center justify-center transition-colors"
                >−</button>
                <span className="text-xs text-gray-500 w-10 text-center">{Math.round(zoom * 100)}%</span>
                <button
                  onClick={() => setZoom((z) => parseFloat(Math.min(2.5, z + 0.1).toFixed(1)))}
                  className="w-6 h-6 rounded-md border border-stage-600 text-gray-400 hover:text-white text-sm flex items-center justify-center transition-colors"
                >+</button>
                {zoom !== 1 && (
                  <button
                    onClick={() => setZoom(1)}
                    className="text-[10px] text-gray-600 hover:text-gray-400 transition-colors ml-1"
                  >
                    reset
                  </button>
                )}
              </div>
            </div>

            {/* ── Shape tool bar ───────────────────────────────────────────── */}
            <div className="flex items-center gap-1.5 px-4 py-2 shrink-0 border-b border-stage-700/30 bg-stage-800/50">
              {([
                { mode: "select" as ToolMode, title: "Selecionar (V)", icon: (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 3l14 9-7 1-3 7z" />
                  </svg>
                )},
                { mode: "rect" as ToolMode, title: "Retângulo / cobertura (R)", icon: (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                  </svg>
                )},
                { mode: "eraser" as ToolMode, title: "Borracha — cobre com branco (E)", icon: (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 20H7L3 16l11-11 7 7-1 8z" /><line x1="6" y1="14" x2="14" y2="6" />
                  </svg>
                )},
                { mode: "textbox" as ToolMode, title: "Caixa de texto (T)", icon: (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="4 7 4 4 20 4 20 7" /><line x1="9" y1="20" x2="15" y2="20" /><line x1="12" y1="4" x2="12" y2="20" />
                  </svg>
                )},
              ] as { mode: ToolMode; title: string; icon: React.ReactNode }[]).map(({ mode, title, icon }) => (
                <button
                  key={mode}
                  onClick={() => setToolMode(mode)}
                  title={title}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${toolMode === mode ? "bg-gold-500/20 border border-gold-500/50 text-yellow-400" : "border border-transparent text-gray-500 hover:text-gray-200 hover:border-stage-600"}`}
                >
                  {icon}
                </button>
              ))}

              <div className="w-px h-5 bg-stage-700 mx-1" />

              {(toolMode === "rect" || toolMode === "textbox") && (
                <>
                  <input
                    type="color"
                    value={drawColor}
                    onChange={(e) => setDrawColor(e.target.value)}
                    title="Cor da forma"
                    className="w-8 h-8 rounded-lg border border-stage-600 cursor-pointer p-0.5 bg-stage-700"
                  />
                  {toolMode === "rect" && (
                    <div className="flex items-center gap-1.5 ml-1">
                      <span className="text-[10px] text-gray-600">Opacidade</span>
                      <input
                        type="range" min={0.05} max={1} step={0.05}
                        value={drawOpacity}
                        onChange={(e) => setDrawOpacity(parseFloat(e.target.value))}
                        className="w-20 accent-yellow-500"
                      />
                      <span className="text-[10px] text-gray-500 tabular-nums w-7">{Math.round(drawOpacity * 100)}%</span>
                    </div>
                  )}
                </>
              )}

              {toolMode !== "select" && (
                <span className="ml-auto text-[10px] text-gray-600">
                  {toolMode === "eraser" ? "Clique e arraste para apagar" :
                   toolMode === "textbox" ? "Clique e arraste para criar caixa de texto" :
                   "Clique e arraste para desenhar"}
                </span>
              )}
            </div>

            {/* Canvas scroll area */}
            <div ref={canvasScrollRef} className="flex-1 overflow-auto p-4 md:p-6">
              <div
                style={{ width: `${Math.round(zoom * 672)}px`, margin: "0 auto" }}
              >
                <PdfCanvas
                  pdfUrl={mapping.pdfUrl}
                  currentPage={currentPage}
                  placements={placements}
                  selectedId={selectedId}
                  locatingId={locatingId}
                  fontsReady={fontsReady}
                  exampleValues={exampleValues}
                  onSelectField={(id) => { setSelectedId(id); if (id) setSelectedShapeId(null); }}
                  onScaleChange={setRenderScale}
                  shapes={shapes}
                  selectedShapeId={selectedShapeId}
                  toolMode={toolMode}
                  drawColor={drawColor}
                  drawOpacity={drawOpacity}
                  onSelectShape={selectShape}
                  onShapeDrawn={addShape}
                  onShapeMoved={handleShapeMoved}
                  onShapeResized={handleShapeResized}
                />
              </div>
            </div>

            {/* Mobile action bar */}
            <div className="flex md:hidden items-center gap-2 px-3 py-2 border-t border-stage-700 bg-stage-800 shrink-0">
              <button
                onClick={() => { setSelectedId(null); setMobilePanel("fields"); }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-stage-700 border border-stage-600 text-white text-sm font-semibold"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Campo
              </button>
              {selectedPlacement && (
                <button
                  onClick={() => setMobilePanel("properties")}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gold-500/10 border border-gold-500/30 text-gold-400 text-sm font-semibold"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                  Editar
                </button>
              )}
            </div>
          </div>

          {/* Right — properties panel */}
          <div className="hidden md:block w-52 shrink-0 border-l border-stage-600 bg-stage-800 overflow-y-auto">
            {selectedShape && !selectedPlacement ? (
              <div className="p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Forma</p>
                  <button
                    onClick={() => removeShape(selectedShape.id)}
                    title="Remover forma (Delete)"
                    className="p-1 rounded-lg text-red-500/60 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                    </svg>
                  </button>
                </div>

                <div className="rounded-lg bg-stage-700/50 border border-stage-600 px-2.5 py-2">
                  <p className="text-xs font-semibold text-gray-200 capitalize">{selectedShape.kind === "eraser" ? "Borracha" : selectedShape.kind === "textbox" ? "Caixa de texto" : "Retângulo"}</p>
                </div>

                {selectedShape.kind === "textbox" && (
                  <>
                    <div>
                      <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">Texto</label>
                      <textarea
                        className="input-field text-xs w-full p-1.5 resize-none"
                        rows={3}
                        value={selectedShape.text ?? ""}
                        onChange={(e) => updateShape(selectedShape.id, { text: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">Tamanho</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="range" min={5} max={200} step={0.5}
                          value={selectedShape.fontSize ?? 12}
                          onChange={(e) => updateShape(selectedShape.id, { fontSize: Number(e.target.value) })}
                          className="flex-1 accent-yellow-500"
                        />
                        <input
                          type="number" min={5} max={200} step={0.5}
                          value={selectedShape.fontSize ?? 12}
                          onChange={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v)) updateShape(selectedShape.id, { fontSize: v }); }}
                          className="input-field w-14 text-xs text-center p-1"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">Fonte</label>
                      <FontPicker
                        value={selectedShape.fontFamily ?? "Helvetica"}
                        onChange={(v) => updateShape(selectedShape.id, { fontFamily: v })}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">Cor do texto</label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={selectedShape.color ?? "#000000"}
                          onChange={(e) => updateShape(selectedShape.id, { color: e.target.value })}
                          className="w-8 h-8 rounded-lg border border-stage-500 bg-stage-700 cursor-pointer p-0.5 shrink-0" />
                        <input className="input-field font-mono uppercase text-xs flex-1 p-1.5"
                          value={selectedShape.color ?? "#000000"} maxLength={7}
                          onChange={(e) => { const v = e.target.value; if (/^#[0-9a-fA-F]{0,6}$/.test(v)) updateShape(selectedShape.id, { color: v }); }} />
                      </div>
                    </div>
                  </>
                )}

                {selectedShape.kind === "rect" && (
                  <>
                    <div>
                      <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">Cor</label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={selectedShape.fill}
                          onChange={(e) => updateShape(selectedShape.id, { fill: e.target.value })}
                          className="w-8 h-8 rounded-lg border border-stage-500 bg-stage-700 cursor-pointer p-0.5 shrink-0" />
                        <input className="input-field font-mono uppercase text-xs flex-1 p-1.5"
                          value={selectedShape.fill} maxLength={7}
                          onChange={(e) => { const v = e.target.value; if (/^#[0-9a-fA-F]{0,6}$/.test(v)) updateShape(selectedShape.id, { fill: v }); }} />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">Opacidade</label>
                      <div className="flex items-center gap-2">
                        <input type="range" min={0.05} max={1} step={0.05}
                          value={selectedShape.opacity}
                          onChange={(e) => updateShape(selectedShape.id, { opacity: parseFloat(e.target.value) })}
                          className="flex-1 accent-yellow-500" />
                        <span className="text-[10px] text-gray-500 w-7 tabular-nums">{Math.round(selectedShape.opacity * 100)}%</span>
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">Página</label>
                  <select
                    className="input-field text-xs w-full"
                    value={selectedShape.page}
                    onChange={(e) => updateShape(selectedShape.id, { page: Number(e.target.value) })}
                  >
                    {Array.from({ length: mapping.pageCount }, (_, i) => (
                      <option key={i} value={i}>Página {i + 1}</option>
                    ))}
                  </select>
                </div>
              </div>
            ) : selectedPlacement ? (
              <div className="p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Propriedades</p>
                  <button
                    onClick={() => removePlacement(selectedPlacement.id)}
                    title="Remover campo (Delete)"
                    className="p-1 rounded-lg text-red-500/60 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                    </svg>
                  </button>
                </div>

                {/* Field label */}
                <div className="rounded-lg bg-stage-700/50 border border-stage-600 px-2.5 py-2">
                  <p className="text-xs font-semibold text-gray-200 truncate">{selectedPlacement.label}</p>
                  <p className="text-[10px] text-gray-600 font-mono truncate">{selectedPlacement.key}</p>
                </div>

                {/* Font size */}
                <div>
                  <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">Tamanho</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range" min={5} max={500} step={0.5}
                      value={selectedPlacement.fontSize}
                      onChange={(e) => updatePlacement(selectedPlacement.id, { fontSize: Number(e.target.value) })}
                      className="flex-1 accent-gold-500"
                    />
                    <input
                      type="number" min={5} max={500} step={0.5}
                      value={selectedPlacement.fontSize}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value);
                        if (!isNaN(v)) updatePlacement(selectedPlacement.id, { fontSize: Math.max(5, Math.min(200, v)) });
                      }}
                      className="input-field w-14 text-xs text-center p-1"
                    />
                  </div>
                </div>

                {/* Font family */}
                <div>
                  <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">Fonte</label>
                  <FontPicker
                    value={selectedPlacement.fontFamily}
                    onChange={(v) => updatePlacement(selectedPlacement.id, { fontFamily: v })}
                  />
                </div>

                {/* Color */}
                <div>
                  <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">Cor</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={selectedPlacement.color}
                      onChange={(e) => updatePlacement(selectedPlacement.id, { color: e.target.value })}
                      className="w-8 h-8 rounded-lg border border-stage-500 bg-stage-700 cursor-pointer p-0.5 shrink-0"
                    />
                    <input
                      className="input-field font-mono uppercase text-xs flex-1 p-1.5"
                      value={selectedPlacement.color}
                      maxLength={7}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (/^#[0-9a-fA-F]{0,6}$/.test(v)) updatePlacement(selectedPlacement.id, { color: v });
                      }}
                    />
                  </div>
                </div>

                {/* X / Y inputs */}
                <div>
                  <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">Posição</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <div>
                      <span className="text-[10px] text-gray-600 block mb-0.5">X (%)</span>
                      <input
                        type="number" min={0} max={100} step={0.1}
                        value={selectedPlacement.x}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value);
                          if (!isNaN(v)) updatePlacement(selectedPlacement.id, { x: parseFloat(Math.max(0, Math.min(100, v)).toFixed(2)) });
                        }}
                        className="input-field text-xs w-full p-1.5 font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-600 block mb-0.5">Y (%)</span>
                      <input
                        type="number" min={0} max={100} step={0.1}
                        value={selectedPlacement.y}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value);
                          if (!isNaN(v)) updatePlacement(selectedPlacement.id, { y: parseFloat(Math.max(0, Math.min(100, v)).toFixed(2)) });
                        }}
                        className="input-field text-xs w-full p-1.5 font-mono"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-700 mt-1">Setas do teclado para ajuste fino</p>
                </div>

                {/* Página */}
                <div>
                  <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">Página</label>
                  <select
                    className="input-field text-xs w-full"
                    value={selectedPlacement.page}
                    onChange={(e) => updatePlacement(selectedPlacement.id, { page: Number(e.target.value) })}
                  >
                    {Array.from({ length: mapping.pageCount }, (_, i) => (
                      <option key={i} value={i}>Página {i + 1}</option>
                    ))}
                  </select>
                </div>

                {/* Duplicate */}
                <button
                  onClick={() => duplicatePlacement(selectedPlacement.id)}
                  className="w-full py-2 rounded-xl border border-stage-500 text-gray-400 text-xs hover:text-white hover:border-stage-400 transition-colors flex items-center justify-center gap-2"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  Duplicar campo
                </button>
              </div>
            ) : (
              <div className="p-4 pt-8 text-center space-y-2">
                <svg className="mx-auto text-gray-700" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
                </svg>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Clique em um campo no canvas para editar suas propriedades
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Animations ───────────────────────────────────────────────────────── */}
      <style>{`
        @keyframes _sheet-up {
          from { transform: translateY(100%); }
          to   { transform: translateY(0);    }
        }
        @keyframes _backdrop-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes locate-ring {
          0%   { opacity: 1; transform: scale(1);    }
          70%  { opacity: 0.4; transform: scale(1.2); }
          100% { opacity: 0; transform: scale(1.4);  }
        }
      `}</style>

      {/* ── Mobile fields bottom sheet ─────────────────────────────────────── */}
      {isMobile && mobilePanel === "fields" && (
        <div
          className="fixed inset-0 z-[200] flex flex-col justify-end"
          style={{ background: "rgba(0,0,0,0.5)", animation: "_backdrop-in 0.2s ease-out both" }}
          onClick={() => setMobilePanel(null)}
        >
          <div
            className="bg-stage-800 border-t border-stage-600 rounded-t-2xl max-h-[72vh] flex flex-col"
            style={{ animation: "_sheet-up 0.32s cubic-bezier(0.25, 1, 0.5, 1) both" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center py-2 shrink-0">
              <div className="w-10 h-1 rounded-full bg-stage-600" />
            </div>
            <div className="flex items-center justify-between px-4 pb-3 shrink-0">
              <p className="text-sm font-bold text-gray-200">Adicionar Campo</p>
              <button onClick={() => setMobilePanel(null)} className="text-gray-500 p-1">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto px-4 pb-8 space-y-4">
              {FIELD_CATEGORIES.map((cat) => (
                <div key={cat.category}>
                  <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest mb-2">{cat.category}</p>
                  <div className="flex flex-wrap gap-2">
                    {cat.fields.map((f) => (
                      <button
                        key={f.key}
                        onClick={() => { addFieldAtCenter(f); setMobilePanel(null); }}
                        className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl bg-stage-700 border border-stage-600 text-gray-300 active:bg-stage-600 active:text-white transition-colors"
                      >
                        {f.label}
                        {(placedCounts[f.key] ?? 0) > 0 && (
                          <span className="min-w-[18px] text-center px-1 rounded-full bg-gold-500/25 text-gold-400 text-[10px] font-bold leading-[18px]">
                            {placedCounts[f.key]}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Mobile properties bottom sheet ────────────────────────────────── */}
      {isMobile && mobilePanel === "properties" && selectedPlacement && (
        <div
          className="fixed inset-0 z-[200] flex flex-col justify-end"
          style={{ background: "rgba(0,0,0,0.5)", animation: "_backdrop-in 0.2s ease-out both" }}
          onClick={() => setMobilePanel(null)}
        >
          <div
            className="bg-stage-800 border-t border-stage-600 rounded-t-2xl max-h-[78vh] flex flex-col"
            style={{ animation: "_sheet-up 0.32s cubic-bezier(0.25, 1, 0.5, 1) both" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center py-2 shrink-0">
              <div className="w-10 h-1 rounded-full bg-stage-600" />
            </div>
            <div className="flex items-center justify-between px-4 pb-3 shrink-0">
              <div>
                <p className="text-sm font-bold text-gray-200">{selectedPlacement.label}</p>
                <p className="text-[10px] text-gray-600 font-mono">{selectedPlacement.key}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { removePlacement(selectedPlacement.id); setMobilePanel(null); }}
                  className="p-2 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                  </svg>
                </button>
                <button onClick={() => setMobilePanel(null)} className="text-gray-500 p-1">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="overflow-y-auto px-4 pb-10 space-y-4">
              {/* Font size */}
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5 block">Tamanho</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range" min={5} max={120} step={0.5}
                    value={selectedPlacement.fontSize}
                    onChange={(e) => updatePlacement(selectedPlacement.id, { fontSize: Number(e.target.value) })}
                    className="flex-1 accent-gold-500"
                    style={{ height: "8px" }}
                  />
                  <input
                    type="number" min={5} max={120} step={0.5}
                    value={selectedPlacement.fontSize}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      if (!isNaN(v)) updatePlacement(selectedPlacement.id, { fontSize: Math.max(5, Math.min(120, v)) });
                    }}
                    className="input-field w-16 text-sm text-center py-2"
                  />
                </div>
              </div>
              {/* Font family */}
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5 block">Fonte</label>
                <FontPicker
                  value={selectedPlacement.fontFamily}
                  onChange={(v) => updatePlacement(selectedPlacement.id, { fontFamily: v })}
                />
              </div>
              {/* Color */}
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5 block">Cor</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={selectedPlacement.color}
                    onChange={(e) => updatePlacement(selectedPlacement.id, { color: e.target.value })}
                    className="w-10 h-10 rounded-xl border border-stage-500 bg-stage-700 cursor-pointer p-0.5 shrink-0"
                  />
                  <input
                    className="input-field font-mono uppercase text-sm flex-1 py-2.5"
                    value={selectedPlacement.color}
                    maxLength={7}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (/^#[0-9a-fA-F]{0,6}$/.test(v)) updatePlacement(selectedPlacement.id, { color: v });
                    }}
                  />
                </div>
              </div>
              {/* Page selector (only if multiple pages) */}
              {mapping.pageCount > 1 && (
                <div>
                  <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5 block">Página</label>
                  <select
                    className="input-field text-sm w-full py-2.5"
                    value={selectedPlacement.page}
                    onChange={(e) => updatePlacement(selectedPlacement.id, { page: Number(e.target.value) })}
                  >
                    {Array.from({ length: mapping.pageCount }, (_, i) => (
                      <option key={i} value={i}>Página {i + 1}</option>
                    ))}
                  </select>
                </div>
              )}
              {/* Duplicate */}
              <button
                onClick={() => { duplicatePlacement(selectedPlacement.id); setMobilePanel("properties"); }}
                className="w-full py-3 rounded-xl border border-stage-500 text-gray-400 text-sm font-semibold active:text-white flex items-center justify-center gap-2 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                Duplicar campo
              </button>
            </div>
          </div>
        </div>
      )}

    </DndContext>
  );
}

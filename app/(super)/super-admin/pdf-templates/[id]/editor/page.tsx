"use client";

import { useEffect, useRef, useState, useReducer, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  DndContext, DragEndEvent, useDraggable, useDroppable,
  PointerSensor, useSensor, useSensors,
} from "@dnd-kit/core";
import type { FieldPlacement } from "@/lib/pdf-overlay";

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
  "Helvetica":             { fontFamily: "Helvetica, Arial, sans-serif",         fontWeight: 400 },
  "Helvetica-Bold":        { fontFamily: "Helvetica, Arial, sans-serif",         fontWeight: 700 },
  "Helvetica-Oblique":     { fontFamily: "Helvetica, Arial, sans-serif",         fontWeight: 400, fontStyle: "italic" },
  "Helvetica-BoldOblique": { fontFamily: "Helvetica, Arial, sans-serif",         fontWeight: 700, fontStyle: "italic" },
  "Times-Roman":           { fontFamily: "'Times New Roman', Times, serif",       fontWeight: 400 },
  "Times-Bold":            { fontFamily: "'Times New Roman', Times, serif",       fontWeight: 700 },
  "Times-Italic":          { fontFamily: "'Times New Roman', Times, serif",       fontWeight: 400, fontStyle: "italic" },
  "Times-BoldItalic":      { fontFamily: "'Times New Roman', Times, serif",       fontWeight: 700, fontStyle: "italic" },
  "Courier":               { fontFamily: "'Courier New', Courier, monospace",     fontWeight: 400 },
  "Courier-Bold":          { fontFamily: "'Courier New', Courier, monospace",     fontWeight: 700 },
  "Courier-Oblique":       { fontFamily: "'Courier New', Courier, monospace",     fontWeight: 400, fontStyle: "italic" },
  "Courier-BoldOblique":   { fontFamily: "'Courier New', Courier, monospace",     fontWeight: 700, fontStyle: "italic" },
  "Roboto":            { fontFamily: "'Roboto', sans-serif",            fontWeight: 400 },
  "Roboto-Bold":       { fontFamily: "'Roboto', sans-serif",            fontWeight: 700 },
  "Roboto-Italic":     { fontFamily: "'Roboto', sans-serif",            fontWeight: 400, fontStyle: "italic" },
  "OpenSans":          { fontFamily: "'Open Sans', sans-serif",         fontWeight: 400 },
  "OpenSans-Bold":     { fontFamily: "'Open Sans', sans-serif",         fontWeight: 700 },
  "Montserrat":        { fontFamily: "'Montserrat', sans-serif",        fontWeight: 400 },
  "Montserrat-Bold":   { fontFamily: "'Montserrat', sans-serif",        fontWeight: 700 },
  "Lato":              { fontFamily: "'Lato', sans-serif",              fontWeight: 400 },
  "Lato-Bold":         { fontFamily: "'Lato', sans-serif",              fontWeight: 700 },
  "Inter":             { fontFamily: "'Inter', sans-serif",             fontWeight: 400 },
  "Inter-Bold":        { fontFamily: "'Inter', sans-serif",             fontWeight: 700 },
  "Raleway":           { fontFamily: "'Raleway', sans-serif",           fontWeight: 400 },
  "Raleway-Bold":      { fontFamily: "'Raleway', sans-serif",           fontWeight: 700 },
  "Playfair":          { fontFamily: "'Playfair Display', serif",       fontWeight: 400 },
  "Playfair-Bold":     { fontFamily: "'Playfair Display', serif",       fontWeight: 700 },
  "Merriweather":      { fontFamily: "'Merriweather', serif",           fontWeight: 400 },
  "Merriweather-Bold": { fontFamily: "'Merriweather', serif",           fontWeight: 700 },
  "PTSans":            { fontFamily: "'PT Sans', sans-serif",           fontWeight: 400 },
  "PTSans-Bold":       { fontFamily: "'PT Sans', sans-serif",           fontWeight: 700 },
  "SourceSans":        { fontFamily: "'Source Sans 3', sans-serif",     fontWeight: 400 },
  "SourceSans-Bold":   { fontFamily: "'Source Sans 3', sans-serif",     fontWeight: 700 },
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
  "&display=swap";

function cssFontProps(family: string): CssFontDef {
  return CSS_FONT[family] ?? { fontFamily: "Helvetica, Arial, sans-serif", fontWeight: 400 };
}

// ─── History reducer ──────────────────────────────────────────────────────────

type HA =
  | { type: "push"; p: FieldPlacement[] }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "reset"; p: FieldPlacement[] };

type HS = { past: FieldPlacement[][]; cur: FieldPlacement[]; future: FieldPlacement[][] };

function hReducer(s: HS, a: HA): HS {
  if (a.type === "push")
    return { past: [...s.past, s.cur].slice(-50), cur: a.p, future: [] };
  if (a.type === "undo" && s.past.length)
    return { past: s.past.slice(0, -1), cur: s.past[s.past.length - 1], future: [s.cur, ...s.future] };
  if (a.type === "redo" && s.future.length)
    return { past: [...s.past, s.cur], cur: s.future[0], future: s.future.slice(1) };
  if (a.type === "reset")
    return { past: [], cur: a.p, future: [] };
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
      style={{ opacity: isDragging ? 0.35 : 1 }}
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
  containerW,
  containerH,
  exampleValue,
  onClick,
}: {
  placement: FieldPlacement;
  isSelected: boolean;
  containerW: number;
  containerH: number;
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
        fontSize: `${placement.fontSize}px`,
        lineHeight: 1,
        color: placement.color,
        fontFamily: font.fontFamily,
        fontWeight: font.fontWeight,
        fontStyle: font.fontStyle ?? "normal",
        opacity: isDragging ? 0.45 : 1,
        zIndex: isSelected ? 20 : 10,
        cursor: isDragging ? "grabbing" : "grab",
        userSelect: "none",
        whiteSpace: "nowrap",
        padding: "1px 2px",
        borderRadius: 2,
        ...(isSelected
          ? { outline: "1.5px solid #e6b800", outlineOffset: "2px", background: "rgba(230,184,0,0.07)" }
          : { outline: "1px solid transparent" }),
      }}
      className={isSelected ? "" : "hover:outline-blue-400/40 hover:outline hover:outline-1"}
    >
      {exampleValue || `[${placement.label}]`}
    </div>
  );
}

// ─── PdfCanvas ────────────────────────────────────────────────────────────────

function PdfCanvas({
  pdfUrl,
  currentPage,
  placements,
  selectedId,
  exampleValues,
  onSelectField,
}: {
  pdfUrl: string;
  currentPage: number;
  placements: FieldPlacement[];
  selectedId: string | null;
  exampleValues: Record<string, string>;
  onSelectField: (id: string | null) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });
  const [renderError, setRenderError] = useState<string | null>(null);
  const [rendering, setRendering] = useState(false);
  const { setNodeRef: setDropRef } = useDroppable({ id: "pdf-canvas-drop" });

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

        const proxyUrl = `/api/super/pdf-proxy?url=${encodeURIComponent(pdfUrl)}`;
        const doc = await pdfjs.getDocument(proxyUrl).promise;
        if (cancelled) return;

        const page = await doc.getPage(currentPage);
        if (cancelled) return;

        const containerWidth = containerRef.current?.clientWidth ?? 672;
        const viewport = page.getViewport({ scale: 1 });
        const scale = containerWidth / viewport.width;
        const sv = page.getViewport({ scale });

        const canvas = canvasRef.current;
        if (!canvas || cancelled) return;
        canvas.width = sv.width;
        canvas.height = sv.height;

        await page.render({ canvasContext: canvas.getContext("2d")!, canvas, viewport: sv }).promise;
      } catch (e) {
        if (!cancelled) setRenderError(e instanceof Error ? e.message : "Erro ao renderizar PDF");
      } finally {
        if (!cancelled) setRendering(false);
      }
    })();

    return () => { cancelled = true; };
  }, [pdfUrl, currentPage]);

  const pagePlacements = placements.filter((p) => p.page === currentPage - 1);

  return (
    <div
      ref={(el) => {
        setDropRef(el);
        containerRef.current = el;
      }}
      data-canvas-container
      className="relative bg-white rounded-xl shadow-2xl overflow-hidden select-none"
      style={{ minHeight: 200 }}
      onClick={() => onSelectField(null)}
    >
      {rendering && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/90 z-30 rounded-xl">
          <div className="w-6 h-6 border-2 border-stage-400 border-t-gold-500 rounded-full animate-spin" />
        </div>
      )}
      {renderError && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-50 z-20 p-6 rounded-xl">
          <p className="text-xs text-red-500 text-center">{renderError}</p>
        </div>
      )}
      <canvas ref={canvasRef} style={{ display: "block", width: "100%", height: "auto" }} />
      {/* Token overlay — positioned using actual rendered container size */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="relative w-full h-full pointer-events-auto">
          {pagePlacements.map((p) => (
            <FieldToken
              key={p.id}
              placement={p}
              isSelected={selectedId === p.id}
              containerW={containerSize.w}
              containerH={containerSize.h}
              exampleValue={exampleValues[p.key] ?? ""}
              onClick={() => onSelectField(p.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main editor page ─────────────────────────────────────────────────────────

export default function PdfTemplateEditor() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [history, dispatch] = useReducer(hReducer, { past: [], cur: [], future: [] });
  const placements = history.cur;
  const placementsRef = useRef<FieldPlacement[]>([]);
  useEffect(() => { placementsRef.current = placements; }, [placements]);

  function push(next: FieldPlacement[] | ((prev: FieldPlacement[]) => FieldPlacement[])) {
    const p = typeof next === "function" ? next(placementsRef.current) : next;
    dispatch({ type: "push", p });
  }

  const [mapping, setMapping] = useState<MappingData | null>(null);
  const [exampleValues, setExampleValues] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedIdRef = useRef<string | null>(null);
  useEffect(() => { selectedIdRef.current = selectedId; }, [selectedId]);

  const [zoom, setZoom] = useState(1.0);
  const [saving, setSaving] = useState(false);
  const [activating, setActivating] = useState(false);
  const [showSavedModal, setShowSavedModal] = useState(false);
  const [lastSaved, setLastSaved] = useState<string>("[]");
  const hasUnsaved = JSON.stringify(placements) !== lastSaved && !saving;

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  // Load Google Fonts for canvas preview
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = GOOGLE_FONTS_URL;
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

  // Load mapping data
  useEffect(() => {
    fetch(`/api/super/pdf-templates/${id}`)
      .then((r) => r.json())
      .then((data: MappingData) => {
        setMapping(data);
        const fields = Array.isArray(data.fields) ? data.fields : [];
        dispatch({ type: "reset", p: fields });
        setLastSaved(JSON.stringify(fields));
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
      if (e.key === "Escape") { setSelectedId(null); return; }

      // Delete / Backspace
      if ((e.key === "Delete" || e.key === "Backspace") && !inInput && selectedIdRef.current) {
        e.preventDefault();
        const sid = selectedIdRef.current;
        push((prev) => prev.filter((p) => p.id !== sid));
        setSelectedId(null);
        return;
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

  // Drag end handler
  function handleDragEnd(event: DragEndEvent) {
    const { active, over, delta } = event;
    if (!over || over.id !== "pdf-canvas-drop") return;

    const activeData = active.data.current as { type: string; field?: FieldDef; placementId?: string };
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
        fontSize: 10,
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

  function addFieldAtCenter(field: FieldDef) {
    const newP: FieldPlacement = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      key: field.key,
      label: field.label,
      page: currentPage - 1,
      x: 40,
      y: 45,
      fontSize: 10,
      fontFamily: "Helvetica",
      color: "#000000",
    };
    push((prev) => [...prev, newP]);
    setSelectedId(newP.id);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/super/pdf-templates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields: placementsRef.current }),
      });
      if (!res.ok) throw new Error();
      setLastSaved(JSON.stringify(placementsRef.current));
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
        body: JSON.stringify({ fields: placementsRef.current, isActive: true }),
      });
      setMapping((m) => m ? { ...m, isActive: true } : m);
      setLastSaved(JSON.stringify(placementsRef.current));
    } finally {
      setActivating(false);
      setShowSavedModal(false);
    }
  }

  const selectedPlacement = placements.find((p) => p.id === selectedId) ?? null;

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
            onClick={() => window.open(`/api/super/pdf-templates/${mapping.id}/test`, "_blank")}
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
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      {savedModal}

      <div className="flex flex-col h-[calc(100vh-64px)]">
        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-stage-600 bg-stage-800 shrink-0">
          <button
            onClick={() => router.push("/super-admin/pdf-templates")}
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
            onClick={() => window.open(`/api/super/pdf-templates/${mapping.id}/test`, "_blank")}
            className="px-3 py-1.5 rounded-xl border border-stage-500 text-gray-400 text-xs hover:text-white hover:border-stage-400 transition-colors shrink-0"
          >
            Testar PDF
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
          <div className="w-48 shrink-0 border-r border-stage-600 bg-stage-800 overflow-y-auto flex flex-col">
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

            {/* Canvas scroll area */}
            <div className="flex-1 overflow-auto p-6">
              <div
                style={{ width: `${Math.round(zoom * 672)}px`, margin: "0 auto" }}
              >
                <PdfCanvas
                  pdfUrl={mapping.pdfUrl}
                  currentPage={currentPage}
                  placements={placements}
                  selectedId={selectedId}
                  exampleValues={exampleValues}
                  onSelectField={setSelectedId}
                />
              </div>
            </div>
          </div>

          {/* Right — properties panel */}
          <div className="w-52 shrink-0 border-l border-stage-600 bg-stage-800 overflow-y-auto">
            {selectedPlacement ? (
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
                      type="range" min={5} max={48} step={0.5}
                      value={selectedPlacement.fontSize}
                      onChange={(e) => updatePlacement(selectedPlacement.id, { fontSize: Number(e.target.value) })}
                      className="flex-1 accent-gold-500"
                    />
                    <input
                      type="number" min={5} max={48} step={0.5}
                      value={selectedPlacement.fontSize}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value);
                        if (!isNaN(v)) updatePlacement(selectedPlacement.id, { fontSize: Math.max(5, Math.min(48, v)) });
                      }}
                      className="input-field w-14 text-xs text-center p-1"
                    />
                  </div>
                </div>

                {/* Font family */}
                <div>
                  <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">Fonte</label>
                  <select
                    className="input-field text-xs w-full"
                    value={selectedPlacement.fontFamily}
                    onChange={(e) => updatePlacement(selectedPlacement.id, { fontFamily: e.target.value })}
                  >
                    <optgroup label="Helvetica">
                      <option value="Helvetica">Regular</option>
                      <option value="Helvetica-Bold">Bold</option>
                      <option value="Helvetica-Oblique">Itálico</option>
                      <option value="Helvetica-BoldOblique">Bold Itálico</option>
                    </optgroup>
                    <optgroup label="Times">
                      <option value="Times-Roman">Regular</option>
                      <option value="Times-Bold">Bold</option>
                      <option value="Times-Italic">Itálico</option>
                      <option value="Times-BoldItalic">Bold Itálico</option>
                    </optgroup>
                    <optgroup label="Courier">
                      <option value="Courier">Regular</option>
                      <option value="Courier-Bold">Bold</option>
                      <option value="Courier-Oblique">Itálico</option>
                      <option value="Courier-BoldOblique">Bold Itálico</option>
                    </optgroup>
                    <optgroup label="Google Fonts">
                      <option value="Roboto">Roboto</option>
                      <option value="Roboto-Bold">Roboto Bold</option>
                      <option value="Roboto-Italic">Roboto Itálico</option>
                      <option value="OpenSans">Open Sans</option>
                      <option value="OpenSans-Bold">Open Sans Bold</option>
                      <option value="Montserrat">Montserrat</option>
                      <option value="Montserrat-Bold">Montserrat Bold</option>
                      <option value="Lato">Lato</option>
                      <option value="Lato-Bold">Lato Bold</option>
                      <option value="Inter">Inter</option>
                      <option value="Inter-Bold">Inter Bold</option>
                      <option value="Raleway">Raleway</option>
                      <option value="Raleway-Bold">Raleway Bold</option>
                      <option value="Playfair">Playfair Display</option>
                      <option value="Playfair-Bold">Playfair Display Bold</option>
                      <option value="Merriweather">Merriweather</option>
                      <option value="Merriweather-Bold">Merriweather Bold</option>
                      <option value="PTSans">PT Sans</option>
                      <option value="PTSans-Bold">PT Sans Bold</option>
                      <option value="SourceSans">Source Sans 3</option>
                      <option value="SourceSans-Bold">Source Sans 3 Bold</option>
                    </optgroup>
                  </select>
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
    </DndContext>
  );
}

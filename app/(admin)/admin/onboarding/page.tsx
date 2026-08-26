"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { LogoCropModal } from "@/components/ui/LogoCropModal";
import { ScaledIframe } from "@/components/documents/ScaledIframe";
import { TemplateCarousel } from "@/components/templates/TemplateCarousel";
import { TemplateGridSheet } from "@/components/templates/TemplateGridSheet";
import { useTemplatePreviewHtml } from "@/hooks/useTemplatePreviewHtml";
import type { TemplateInfo } from "@/lib/templates/registry";

const TOTAL_STEPS = 6;

// Curated artist palettes — named, intentional
const PALETTES = [
  { label: "Dourado Palco",  color: "#e6b800" },
  { label: "Azul Profundo",  color: "#3b82f6" },
  { label: "Esmeralda",      color: "#059669" },
  { label: "Carmim",         color: "#e11d48" },
  { label: "Violeta",        color: "#7c3aed" },
  { label: "Prata",          color: "#cbd5e1" },
];

interface OnboardingData {
  name: string;
  primaryColor: string;
  legalName: string;
  cnpj: string;
  whatsapp: string;
  pixKey: string;
}

function hexToRgb(hex: string) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r
    ? `${parseInt(r[1], 16)},${parseInt(r[2], 16)},${parseInt(r[3], 16)}`
    : "245,200,66";
}

function accentTextColor(hex: string): string {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return "#07090e";
  const luminance = (0.299 * parseInt(m[1], 16) + 0.587 * parseInt(m[2], 16) + 0.114 * parseInt(m[3], 16)) / 255;
  return luminance > 0.45 ? "#07090e" : "#f0f4f8";
}

// Garante que a cor accent seja visível sobre fundo escuro (#07090e)
function accentOnDark(hex: string): string {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return "#e6b800";
  const luminance = (0.299 * parseInt(m[1], 16) + 0.587 * parseInt(m[2], 16) + 0.114 * parseInt(m[3], 16)) / 255;
  return luminance < 0.12 ? "#7090b8" : hex;
}

// ── Underline input — premium form pattern ──────────────────────
function UInput({
  label,
  note,
  suffix,
  style,
  onFocus,
  onBlur,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  note?: string;
  suffix?: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);
  const hasValue = !!props.value && String(props.value).length > 0;
  const showCheck = hasValue && !suffix && !focused;
  return (
    <div>
      {label && (
        <div className={`ob-label${focused ? " ob-label--focus" : ""}`}>
          {label}
        </div>
      )}
      <div style={{ position: "relative" }}>
        <input
          {...props}
          className={`ob-input${focused ? " ob-input--focus" : ""}`}
          style={{ paddingRight: suffix || showCheck ? 32 : 0, ...style }}
          onFocus={(e) => { setFocused(true); onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); onBlur?.(e); }}
        />
        {(suffix || showCheck) && (
          <div style={{
            position: "absolute", right: 0, top: "50%",
            transform: "translateY(-50%)", pointerEvents: "none",
            animation: showCheck ? "checkIn 0.25s cubic-bezier(0.34,1.56,0.64,1) both" : undefined,
          }}>
            {suffix ?? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            )}
          </div>
        )}
      </div>
      {note && <div className="ob-note">{note}</div>}
    </div>
  );
}

function Field({ delay = 0, children }: { delay?: number; children: React.ReactNode }) {
  return (
    <div style={{ animation: `fieldIn 0.3s ease ${delay}ms both` }}>
      {children}
    </div>
  );
}

// ── Step 0 — Intro ─────────────────────────────────────────────
function StepIntro() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
      <Field>
        <div style={{ position: "relative", width: 64, height: 64, marginBottom: 40 }}>
          <div style={{
            position: "absolute", inset: -10, borderRadius: 24,
            background: "radial-gradient(circle, rgba(var(--accent-rgb),0.07) 0%, transparent 70%)",
          }} />
          <div style={{
            position: "absolute", inset: 0, borderRadius: 16,
            background: "linear-gradient(135deg, rgba(var(--accent-rgb),0.12) 0%, rgba(var(--accent-rgb),0.03) 100%)",
            border: "1px solid rgba(var(--accent-rgb),0.22)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
              stroke="var(--accent-on-dark)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
            </svg>
          </div>
        </div>

        <h1 style={{
          fontSize: 44, fontWeight: 800, letterSpacing: "-0.04em",
          lineHeight: 1.05, margin: "0 0 18px",
          animation: "headlineReveal 0.5s cubic-bezier(0.22,1,0.36,1) 0.06s both",
        }}>
          <span style={{ color: "#e8edf5" }}>Antes de<br /></span>
          <span style={{ color: "var(--accent-on-dark)" }}>começarmos</span>
        </h1>

        <p style={{ fontSize: 16, color: "#5a7896", lineHeight: 1.65, margin: 0 }}>
          Vamos preencher algumas informações que aparecem nos seus contratos e orçamentos.
        </p>
      </Field>

      <Field delay={120}>
        <div style={{
          height: 1,
          background: "linear-gradient(to right, transparent, #1e3050 25%, #1e3050 75%, transparent)",
          marginBottom: 22,
        }} />

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            padding: "7px 16px", borderRadius: 100,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid #1e3050",
          }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#4ade80", opacity: 0.85 }} />
            <span style={{ fontSize: 15, color: "#5a7896", fontWeight: 500 }}>
              Leva menos de 2 minutos
            </span>
          </div>
          <span style={{ fontSize: 15, color: "#4a6888", textAlign: "center", lineHeight: 1.55 }}>
            Você pode pular qualquer etapa.
          </span>
        </div>
      </Field>
    </div>
  );
}

// ── Step 1 — Identidade ─────────────────────────────────────────
function Step1({
  data,
  onChange,
}: {
  data: OnboardingData;
  onChange: (d: OnboardingData) => void;
}) {
  const isPalette = PALETTES.some(
    (p) => p.color.toLowerCase() === data.primaryColor.toLowerCase()
  );
  const [showCustom, setShowCustom] = useState(!isPalette);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
      <Field>
        <div className="ob-step-n">01</div>
        <h1 className="ob-headline">Seu nome<br />no palco</h1>
        <p className="ob-sub">Aparece em todos os documentos enviados.</p>
      </Field>

      <Field delay={60}>
        <UInput
          label="Nome artístico"
          value={data.name}
          onChange={(e) => onChange({ ...data, name: e.target.value })}
          placeholder="Ex: Banda Fulana"
          autoFocus
        />
        {data.name ? (
          <div
            style={{
              marginTop: 14,
              display: "flex",
              alignItems: "center",
              gap: 10,
              animation: "fadeIn 0.2s ease both",
            }}
          >
            <div
              style={{
                width: 3,
                height: 20,
                borderRadius: 2,
                background: "var(--accent)",
                flexShrink: 0,
                transition: "background 0.4s",
              }}
            />
            <span
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: "#dde4f0",
                letterSpacing: "-0.01em",
              }}
            >
              {data.name}
            </span>
          </div>
        ) : null}
      </Field>

      <Field delay={110}>
        <div className="ob-label" style={{ marginBottom: 16 }}>
          Tom visual
        </div>

        {/* Named palettes — vertical radio list */}
        <div>
          {PALETTES.map((p) => {
            const active =
              data.primaryColor.toLowerCase() === p.color.toLowerCase();
            return (
              <button
                key={p.color}
                className="ob-palette-row"
                onClick={() => {
                  onChange({ ...data, primaryColor: p.color });
                  setShowCustom(false);
                }}
              >
                <span
                  className="ob-palette-dot"
                  style={{
                    background: p.color,
                    boxShadow: active
                      ? `0 0 0 2px #07090e, 0 0 0 3.5px ${p.color}`
                      : "none",
                  }}
                />
                <span
                  style={{
                    fontSize: 16,
                    fontWeight: active ? 600 : 400,
                    color: active ? "#dde4f0" : "#5a7896",
                    flex: 1,
                    textAlign: "left",
                    transition: "color 0.15s, font-weight 0.15s",
                  }}
                >
                  {p.label}
                </span>
                {active && (
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#dde4f0"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            );
          })}

          {/* Custom color row */}
          <button
            className="ob-palette-row"
            style={{ borderBottom: "none" }}
            onClick={() => setShowCustom((v) => !v)}
          >
            <span
              className="ob-palette-dot"
              style={{
                background: isPalette ? "transparent" : data.primaryColor,
                border: isPalette ? "1.5px dashed #253040" : "none",
                boxShadow:
                  !isPalette
                    ? `0 0 0 2px #07090e, 0 0 0 3.5px ${data.primaryColor}`
                    : "none",
              }}
            />
            <span
              style={{
                fontSize: 16,
                fontWeight: !isPalette ? 600 : 400,
                color: !isPalette ? "#dde4f0" : "#5a7896",
                flex: 1,
                textAlign: "left",
              }}
            >
              Cor personalizada
            </span>
            {!isPalette && (
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#dde4f0"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </button>

          {showCustom && (
            <div
              style={{
                display: "flex",
                gap: 12,
                alignItems: "center",
                paddingTop: 14,
                animation: "fieldIn 0.2s ease both",
              }}
            >
              <label style={{ flexShrink: 0, cursor: "pointer", position: "relative" }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: data.primaryColor,
                    border: "1px solid rgba(255,255,255,0.08)",
                    transition: "background 0.2s",
                  }}
                />
                <input
                  type="color"
                  value={data.primaryColor}
                  onChange={(e) =>
                    onChange({ ...data, primaryColor: e.target.value })
                  }
                  style={{
                    position: "absolute",
                    inset: 0,
                    opacity: 0,
                    cursor: "pointer",
                    width: "100%",
                    height: "100%",
                  }}
                />
              </label>
              <UInput
                value={data.primaryColor}
                onChange={(e) =>
                  onChange({ ...data, primaryColor: e.target.value })
                }
                placeholder="#e6b800"
                style={{ flex: 1 }}
              />
            </div>
          )}
        </div>
      </Field>
    </div>
  );
}

// ── Step 2 — Jurídico ───────────────────────────────────────────
function Step2({
  data,
  onChange,
  onCnpj,
  cnpjLoading,
}: {
  data: OnboardingData;
  onChange: (d: OnboardingData) => void;
  onCnpj: (raw: string) => void;
  cnpjLoading: boolean;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
      <Field>
        <div className="ob-step-n">02</div>
        <h1 className="ob-headline">Dados<br />jurídicos</h1>
        <p className="ob-sub">Para assinar contratos com validade legal.</p>
      </Field>

      <Field delay={60}>
        <UInput
          label="CNPJ"
          value={data.cnpj}
          onChange={(e) => onCnpj(e.target.value)}
          placeholder="00.000.000/0000-00"
          maxLength={18}
          note="Preenchemos a razão social automaticamente"
          suffix={
            cnpjLoading ? (
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  border: "1.5px solid rgba(255,255,255,0.08)",
                  borderTopColor: "var(--accent)",
                  animation: "spin 0.8s linear infinite",
                }}
              />
            ) : null
          }
        />
      </Field>

      <Field delay={110}>
        <UInput
          label="Razão social"
          value={data.legalName}
          onChange={(e) => onChange({ ...data, legalName: e.target.value })}
          placeholder="Nome jurídico da empresa ou artista"
          style={cnpjLoading ? { opacity: 0.45 } : undefined}
        />
      </Field>
    </div>
  );
}

// ── Step 3 — Contato ────────────────────────────────────────────
function Step3({
  data,
  onChange,
  onWhatsapp,
}: {
  data: OnboardingData;
  onChange: (d: OnboardingData) => void;
  onWhatsapp: (raw: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
      <Field>
        <div className="ob-step-n">03</div>
        <h1 className="ob-headline">Como<br />te encontram</h1>
        <p className="ob-sub">Aparece nos documentos enviados aos contratantes.</p>
      </Field>

      <Field delay={60}>
        <UInput
          label="WhatsApp"
          value={data.whatsapp}
          onChange={(e) => onWhatsapp(e.target.value)}
          placeholder="(67) 99999-9999"
          type="tel"
          inputMode="numeric"
        />
      </Field>

      <Field delay={110}>
        <UInput
          label="PIX"
          value={data.pixKey}
          onChange={(e) => onChange({ ...data, pixKey: e.target.value })}
          placeholder="CPF, CNPJ, e-mail ou telefone"
        />
      </Field>
    </div>
  );
}

// ── Step 4 — Logo ───────────────────────────────────────────────
function Step4({
  data,
  logoUrl,
  uploading,
  onUpload,
}: {
  data: OnboardingData;
  logoUrl: string | null;
  uploading: boolean;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
      <Field>
        <div className="ob-step-n">04</div>
        <h1 className="ob-headline">Sua marca<br />visual</h1>
        <p className="ob-sub">Opcional. Um logo transforma o documento.</p>
      </Field>

      <Field delay={60}>
        {logoUrl ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div
              style={{
                width: "100%",
                height: 112,
                border: "1px solid #0d1422",
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              <img
                src={logoUrl}
                alt="Logo"
                style={{
                  maxWidth: "60%",
                  maxHeight: "70%",
                  objectFit: "contain",
                }}
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#4ade80"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span style={{ fontSize: 15, color: "#4ade80", fontWeight: 500 }}>
                Logo enviada
              </span>
              <label
                style={{
                  marginLeft: "auto",
                  fontSize: 14,
                  color: "#6888a8",
                  cursor: "pointer",
                  fontWeight: 500,
                }}
              >
                Trocar
                <input
                  type="file"
                  accept="image/*"
                  onChange={onUpload}
                  style={{ display: "none" }}
                />
              </label>
            </div>
          </div>
        ) : (
          <label
            className="ob-upload"
            style={{ cursor: uploading ? "not-allowed" : "pointer" }}
          >
            {uploading ? (
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  border: "1.5px solid rgba(255,255,255,0.06)",
                  borderTopColor: data.primaryColor || "var(--accent)",
                  animation: "spin 0.8s linear infinite",
                }}
              />
            ) : (
              <>
                <div style={{ animation: "logoFloat 2.6s ease-in-out infinite" }}>
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--accent-on-dark)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ opacity: 0.7 }}
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>
                <span style={{ fontSize: 16, color: "#c8d8e8", fontWeight: 600 }}>
                  Enviar logo
                </span>
                <span style={{ fontSize: 14, color: "#4a6888" }}>
                  PNG, JPG ou SVG
                </span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={onUpload}
              disabled={uploading}
              style={{ display: "none" }}
            />
          </label>
        )}
      </Field>
    </div>
  );
}

// ── Step 5/6 — Escolha de template (contrato, depois orçamento) ─
// Um modelo já vem pré-selecionado (o padrão do artista) — a pessoa só
// troca se quiser. Preview grande já renderizado com a marca dela mesma,
// carrossel horizontal pra comparar rápido, e "ver todos" pra quem quiser
// a lista completa — tudo sem sair do onboarding.
function TemplateChoiceStep({
  stepNumber,
  headline,
  sub,
  type,
  primaryColor,
  items,
  itemsLoading,
  selectedId,
  onSelect,
}: {
  stepNumber: string;
  headline: React.ReactNode;
  sub: string;
  type: "orcamento" | "contrato";
  primaryColor: string;
  items: TemplateInfo[];
  itemsLoading: boolean;
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const { html, error } = useTemplatePreviewHtml(selectedId ? { id: selectedId, type } : null);
  const selectedTpl = items.find((t) => t.id === selectedId);
  const sheetTitle = type === "contrato" ? "Modelos de contrato" : "Modelos de orçamento";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <Field>
        <div className="ob-step-n">{stepNumber}</div>
        <h1 className="ob-headline">{headline}</h1>
        <p className="ob-sub">{sub}</p>
      </Field>

      <Field delay={60}>
        <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid #1e3050", height: 260, background: "#4b4f57" }}>
          {error ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#7090b0", fontSize: 12, fontFamily: "'Inter', sans-serif", textAlign: "center", padding: 24 }}>
              Não deu pra carregar o preview agora.
            </div>
          ) : html ? (
            <ScaledIframe html={html} title={selectedTpl?.name ?? ""} />
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
              <span
                className="animate-spin"
                style={{ width: 22, height: 22, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.15)", borderTopColor: "var(--accent-on-dark)", display: "inline-block" }}
              />
            </div>
          )}
        </div>
        {selectedTpl && (
          <div style={{ marginTop: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 700, color: "#dde4f0" }}>
              {selectedTpl.name}
            </span>
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 700, color: "var(--accent-on-dark)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
              Selecionado
            </span>
          </div>
        )}
      </Field>

      <Field delay={110}>
        <div className="ob-label" style={{ marginBottom: 10 }}>Ou escolha outro</div>
        <TemplateCarousel items={items} selectedId={selectedId} primaryColor={primaryColor} onSelect={onSelect} loading={itemsLoading} />
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          style={{
            marginTop: 14,
            width: "100%",
            height: 44,
            borderRadius: 12,
            border: "1px solid #1e3050",
            background: "transparent",
            color: "#7090b0",
            fontFamily: "'Inter', sans-serif",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Ver todos os modelos
        </button>
      </Field>

      <TemplateGridSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        items={items}
        selectedId={selectedId}
        primaryColor={primaryColor}
        onSelect={onSelect}
        type={type}
        title={sheetTitle}
      />
    </div>
  );
}

// ── Logo Crop Modal moved to @/components/ui/LogoCropModal ──────

// ── Main ────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [animKey, setAnimKey] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [cnpjLoading, setCnpjLoading] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [finishError, setFinishError] = useState(false);
  const [uploadError, setUploadError] = useState(false);

  const [data, setData] = useState<OnboardingData>({
    name: "",
    primaryColor: "#e6b800",
    legalName: "",
    cnpj: "",
    whatsapp: "",
    pixKey: "",
  });

  // Templates (step 5) — carregados à parte, não bloqueiam os steps anteriores
  const [templates, setTemplates] = useState<{ orcamento: TemplateInfo[]; contrato: TemplateInfo[] }>({
    orcamento: [],
    contrato: [],
  });
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [orcamentoTemplate, setOrcamentoTemplate] = useState("orc-001");
  const [contratoTemplate, setContratoTemplate] = useState("ctr-001");

  useEffect(() => {
    // Loop guard: mais de 3 carregamentos em 10s = loop de redirect, volta ao login
    const LOOP_KEY = "ob_loads";
    const loads = parseInt(sessionStorage.getItem(LOOP_KEY) || "0") + 1;
    sessionStorage.setItem(LOOP_KEY, String(loads));
    console.log(`[onboarding] mount — loop counter: ${loads}/3`);
    if (loads > 3) {
      console.warn("[onboarding] loop guard triggered — mais de 3 loads em 10s, redirecionando para /login");
      sessionStorage.removeItem(LOOP_KEY);
      window.location.href = "/login";
      return;
    }
    const loopTimer = setTimeout(() => {
      console.log("[onboarding] loop counter resetado por timeout (10s)");
      sessionStorage.removeItem(LOOP_KEY);
    }, 10000);

    setMounted(true);
    console.log("[onboarding] iniciando fetch /api/artist/me");
    fetch("/api/artist/me")
      .then((r) => {
        console.log(`[onboarding] fetch /api/artist/me — status: ${r.status} ${r.statusText}`);
        if (!r.ok) throw new Error(`api_error_${r.status}`);
        return r.json();
      })
      .then((artist) => {
        console.log("[onboarding] fetch /api/artist/me — sucesso", {
          name: artist.name,
          hasColor: !!artist.primaryColor,
          hasLogo: !!artist.logoUrl,
          onboardingDone: artist.onboardingDone,
          categoria: artist.categoria,
        });
        setData((prev) => ({
          name: artist.name || prev.name,
          primaryColor: artist.primaryColor || prev.primaryColor,
          legalName: artist.legalName || prev.legalName,
          cnpj: artist.cnpj || prev.cnpj,
          whatsapp: artist.whatsapp || prev.whatsapp,
          pixKey: artist.pixKey || prev.pixKey,
        }));
        if (artist.logoUrl) setLogoUrl(artist.logoUrl);
        if (artist.orcamentoTemplate) setOrcamentoTemplate(artist.orcamentoTemplate);
        if (artist.contratoTemplate) setContratoTemplate(artist.contratoTemplate);
      })
      .catch((err) => {
        console.error("[onboarding] fetch /api/artist/me — ERRO:", err?.message ?? err);
        setFetchError(true);
      });

    fetch("/api/templates")
      .then((r) => r.json())
      .then((tpl) => setTemplates({ orcamento: tpl?.orcamento || [], contrato: tpl?.contrato || [] }))
      .catch((err) => console.error("[onboarding] fetch /api/templates — ERRO:", err?.message ?? err))
      .finally(() => setTemplatesLoading(false));

    return () => clearTimeout(loopTimer);
  }, []);

  async function patch(fields: Record<string, unknown>): Promise<boolean> {
    console.log("[onboarding] patch — fields:", Object.keys(fields), fields);
    setSaving(true);
    try {
      const res = await fetch("/api/artist/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      console.log(`[onboarding] patch — resposta: ${res.status} ${res.statusText}`);
      if (!res.ok) {
        const body = await res.text().catch(() => "(sem body)");
        console.error("[onboarding] patch — ERRO na resposta:", res.status, body);
        return false;
      }
      return true;
    } catch (err) {
      console.error("[onboarding] patch — ERRO de rede:", err);
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function finish() {
    console.log("[onboarding] finish — iniciando, step:", step);
    setFinishError(false);
    const ok = await patch({ onboardingDone: true });
    if (!ok) {
      console.error("[onboarding] finish — patch falhou, abortando redirect");
      setFinishError(true);
      return;
    }
    console.log("[onboarding] finish — patch onboardingDone=true concluído, redirecionando para /admin/orcamento");
    sessionStorage.removeItem("ob_loads");
    sessionStorage.setItem("just_onboarded", "1");
    setShowWelcome(true);
    // Hard reload garante que o server component releia onboardingDone=true do DB
    setTimeout(() => { window.location.href = "/admin/orcamento"; }, 2800);
  }

  async function handleContinue() {
    console.log(`[onboarding] handleContinue — step atual: ${step}`);
    const ne = (v: string) => v.trim().length > 0;
    if (step === 1) {
      const f: Record<string, unknown> = { primaryColor: data.primaryColor };
      if (ne(data.name)) f.name = data.name.trim();
      await patch(f);
    } else if (step === 2) {
      const f: Record<string, unknown> = {};
      if (ne(data.legalName)) f.legalName = data.legalName.trim();
      if (ne(data.cnpj)) f.cnpj = data.cnpj;
      if (Object.keys(f).length > 0) await patch(f);
    } else if (step === 3) {
      const f: Record<string, unknown> = {};
      if (ne(data.whatsapp)) f.whatsapp = data.whatsapp;
      if (ne(data.pixKey)) f.pixKey = data.pixKey.trim();
      if (Object.keys(f).length > 0) await patch(f);
    } else if (step === 5) {
      await patch({ contratoTemplate });
    } else if (step === 6) {
      await patch({ orcamentoTemplate });
    }
    if (step < TOTAL_STEPS) {
      console.log(`[onboarding] avançando para step ${step + 1}`);
      setDirection("forward");
      setAnimKey((k) => k + 1);
      setStep((s) => s + 1);
    } else {
      await finish();
    }
  }

  function goBack() {
    if (step > 0) {
      console.log(`[onboarding] voltando para step ${step - 1}`);
      setDirection("backward");
      setAnimKey((k) => k + 1);
      setStep((s) => s - 1);
    }
  }

  async function skipStep() {
    console.log(`[onboarding] skipStep — step atual: ${step}`);
    if (step < TOTAL_STEPS) {
      setDirection("forward");
      setAnimKey((k) => k + 1);
      setStep((s) => s + 1);
    } else {
      await finish();
    }
  }

  async function skipAll() {
    console.log("[onboarding] skipAll — pulando tudo, marcando onboardingDone=true");
    await patch({ onboardingDone: true });
    console.log("[onboarding] skipAll — redirecionando para /admin/orcamento");
    sessionStorage.removeItem("ob_loads");
    window.location.href = "/admin/orcamento";
  }

  async function handleCnpj(raw: string) {
    const digits = raw.replace(/\D/g, "").slice(0, 14);
    let fmt = digits;
    if (digits.length > 2)  fmt = digits.slice(0, 2) + "." + digits.slice(2);
    if (digits.length > 5)  fmt = digits.slice(0, 2) + "." + digits.slice(2, 5) + "." + digits.slice(5);
    if (digits.length > 8)  fmt = digits.slice(0, 2) + "." + digits.slice(2, 5) + "." + digits.slice(5, 8) + "/" + digits.slice(8);
    if (digits.length > 12) fmt = digits.slice(0, 2) + "." + digits.slice(2, 5) + "." + digits.slice(5, 8) + "/" + digits.slice(8, 12) + "-" + digits.slice(12);
    setData((prev) => ({ ...prev, cnpj: fmt }));
    if (digits.length === 14) {
      setCnpjLoading(true);
      try {
        const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`);
        if (res.ok) {
          const d = await res.json();
          if (d.razao_social)
            setData((prev) => ({ ...prev, legalName: d.razao_social }));
        }
      } catch {
        // silent
      } finally {
        setCnpjLoading(false);
      }
    }
  }

  function handleWhatsApp(raw: string) {
    const d = raw.replace(/\D/g, "").slice(0, 11);
    let fmt = d;
    if (d.length > 2)  fmt = `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length === 11) fmt = `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
    else if (d.length === 10) fmt = `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    setData(prev => ({ ...prev, whatsapp: fmt }));
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setCropFile(file);
    if (e.target) e.target.value = "";
  }

  async function handleCropConfirm(blob: Blob) {
    setCropFile(null);
    setUploadError(false);
    setLogoUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", new File([blob], "logo.png", { type: "image/png" }));
      formData.append("type", "logo");
      const res = await fetch("/api/artist/me/upload", { method: "POST", body: formData });
      if (res.ok) {
        const { url } = await res.json();
        setLogoUrl(url + "?t=" + Date.now());
        await patch({ logoUrl: url });
      } else {
        console.error("[onboarding] upload logo — servidor retornou", res.status);
        setUploadError(true);
      }
    } catch (err) {
      console.error("[onboarding] upload logo — erro de rede:", err);
      setUploadError(true);
    } finally {
      setLogoUploading(false);
    }
  }

  const colorRgb = hexToRgb(data.primaryColor);
  const ctaText = accentTextColor(data.primaryColor);
  const accentVisible = accentOnDark(data.primaryColor);
  const ctaLabel = step === 0 ? "Prosseguir" : step === TOTAL_STEPS ? "Concluir" : "Continuar";

  return (
    <div
      style={
        {
          "--accent": data.primaryColor,
          "--accent-rgb": colorRgb,
          "--accent-text": ctaText,
          "--accent-on-dark": accentVisible,
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          background: "#07090e",
          fontFamily: "'Inter', system-ui, sans-serif",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        } as React.CSSProperties
      }
    >
      {/* Single ambient glow — reacts to brand color, no orbs */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "45%",
          background: `radial-gradient(ellipse 80% 100% at 50% 0%, rgba(${colorRgb},0.045) 0%, transparent 100%)`,
          pointerEvents: "none",
          transition: "background 1.2s ease",
        }}
      />

      {/* Progress line — top of screen */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: "#0d1422",
          zIndex: 10,
        }}
      >
        <div className="ob-progress" style={{ width: `${(step / TOTAL_STEPS) * 100}%` }} />
      </div>

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "calc(14px + env(safe-area-inset-top, 0px)) 24px 10px",
          flexShrink: 0,
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Step dots — hidden on intro (step 0) */}
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          {step === 0 ? (
            Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div key={i} style={{
                height: 5, width: 5, borderRadius: 3,
                background: "#1a2030", opacity: 0.3,
                transition: "all 0.4s cubic-bezier(0.34,1.56,0.64,1)",
              }} />
            ))
          ) : (
            Array.from({ length: TOTAL_STEPS }).map((_, i) => {
              const done = i + 1 < step;
              const current = i + 1 === step;
              return (
                <div key={i} style={{
                  height: 5,
                  width: current ? 22 : 5,
                  borderRadius: 3,
                  background: done ? "var(--accent)" : current ? "var(--accent)" : "#1a2030",
                  opacity: done ? 0.5 : 1,
                  transition: "all 0.4s cubic-bezier(0.34,1.56,0.64,1)",
                }} />
              );
            })
          )}
        </div>
        <button className="ob-skip-btn" onClick={skipAll} disabled={saving}>
          Pular
        </button>
      </div>

      {/* Avisos de erro inline */}
      {(fetchError || finishError || uploadError) && (
        <div style={{
          margin: "0 16px 4px",
          padding: "8px 14px",
          borderRadius: 10,
          background: "rgba(239,68,68,0.06)",
          border: "1px solid rgba(239,68,68,0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        }}>
          <span style={{ fontSize: 13, color: "#f87171", lineHeight: 1.4 }}>
            {finishError
              ? "Não foi possível salvar. Verifique sua conexão e tente novamente."
              : uploadError
                ? "Erro ao enviar o logo. Tente novamente."
                : "Não conseguimos carregar seus dados — preencha normalmente, tudo será salvo."}
          </span>
          <button
            type="button"
            onClick={() => {
              if (finishError) { setFinishError(false); handleContinue(); }
              else if (uploadError) setUploadError(false);
              else { setFetchError(false); window.location.reload(); }
            }}
            style={{ fontSize: 13, color: "#f87171", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}
          >
            {finishError ? "Tentar salvar" : "OK"}
          </button>
        </div>
      )}

      {/* Step content */}
      <div
        key={animKey}
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          overflowX: "hidden",
          padding: "16px 28px 8px",
          position: "relative",
          zIndex: 1,
          WebkitOverflowScrolling: "touch",
          animation: `${direction === "forward" ? "stepIn" : "stepInBack"} 0.28s ease both`,
        }}
      >
        {step === 0 && <StepIntro />}
        {step === 1 && <Step1 data={data} onChange={setData} />}
        {step === 2 && (
          <Step2
            data={data}
            onChange={setData}
            onCnpj={handleCnpj}
            cnpjLoading={cnpjLoading}
          />
        )}
        {step === 3 && <Step3 data={data} onChange={setData} onWhatsapp={handleWhatsApp} />}
        {step === 4 && (
          <Step4
            data={data}
            logoUrl={logoUrl}
            uploading={logoUploading}
            onUpload={handleFileSelect}
          />
        )}
        {step === 5 && (
          <TemplateChoiceStep
            stepNumber="05"
            headline={<>Seu<br />contrato</>}
            sub="Já deixamos um modelo pronto com sua marca. Troque se quiser — dá pra mudar depois também."
            type="contrato"
            primaryColor={data.primaryColor}
            items={templates.contrato}
            itemsLoading={templatesLoading}
            selectedId={contratoTemplate}
            onSelect={setContratoTemplate}
          />
        )}
        {step === 6 && (
          <TemplateChoiceStep
            stepNumber="06"
            headline={<>Seu<br />orçamento</>}
            sub="Mesma ideia — já escolhemos um pra você começar."
            type="orcamento"
            primaryColor={data.primaryColor}
            items={templates.orcamento}
            itemsLoading={templatesLoading}
            selectedId={orcamentoTemplate}
            onSelect={setOrcamentoTemplate}
          />
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          padding:
            "12px 24px calc(max(18px, env(safe-area-inset-bottom, 0px)) + 8px)",
          display: "flex",
          gap: 10,
          flexShrink: 0,
          background:
            "linear-gradient(to top, rgba(7,9,14,1) 55%, transparent)",
          position: "relative",
          zIndex: 1,
        }}
      >
        <button
          className="ob-back-btn"
          onClick={step === 0 ? skipAll : step > 1 ? goBack : skipStep}
          disabled={saving}
        >
          {step === 0 ? "Pular" : step > 1 ? "Voltar" : "Pular"}
        </button>
        <button
          className="ob-cta-btn"
          onClick={handleContinue}
          disabled={saving || logoUploading}
          style={
            saving || logoUploading
              ? { opacity: 0.35, cursor: "not-allowed", boxShadow: "none" }
              : {}
          }
        >
          {saving ? (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: 13,
                  height: 13,
                  borderRadius: "50%",
                  border: "1.5px solid rgba(0,0,0,0.15)",
                  borderTopColor: "rgba(0,0,0,0.5)",
                  animation: "spin 0.8s linear infinite",
                }}
              />
              Salvando...
            </span>
          ) : (
            ctaLabel
          )}
        </button>
      </div>

      <style>{`
        /* ── Design tokens via CSS vars ── */
        .ob-progress {
          height: 100%;
          background: var(--accent);
          transition: width 0.45s cubic-bezier(0.4,0,0.2,1), background 0.8s ease;
        }
        .ob-step-n {
          font-size: 11px;
          font-weight: 700;
          color: var(--accent-on-dark);
          letter-spacing: 0.1em;
          margin-bottom: 12px;
          opacity: 0.9;
          transition: color 0.6s ease;
        }
        .ob-headline {
          font-size: 34px;
          font-weight: 800;
          color: #e8edf5;
          letter-spacing: -0.04em;
          line-height: 1.08;
          margin: 0 0 10px;
        }
        .ob-sub {
          font-size: 15px;
          color: #5a7896;
          line-height: 1.5;
          margin: 0;
          font-weight: 400;
        }

        /* ── Underline inputs ── */
        .ob-input {
          display: block;
          width: 100%;
          height: 48px;
          background: transparent;
          border: none;
          border-bottom: 1.5px solid #1e3050;
          border-radius: 0;
          padding: 0;
          font-size: 17px;
          font-weight: 400;
          color: #dde4f0;
          font-family: inherit;
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.15s;
          -webkit-appearance: none;
        }
        .ob-input--focus {
          border-bottom-color: var(--accent);
        }
        .ob-input::placeholder { color: #3d5880; }
        .ob-label {
          font-size: 12px;
          font-weight: 700;
          color: #4a6888;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 6px;
          transition: color 0.15s;
        }
        .ob-label--focus { color: var(--accent-on-dark); }
        .ob-note {
          font-size: 13px;
          color: #4a6080;
          margin-top: 7px;
        }

        /* ── Color palette list ── */
        .ob-palette-row {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 12px 0;
          border: none;
          border-bottom: 1px solid #1a2840;
          background: transparent;
          cursor: pointer;
          font-family: inherit;
          text-align: left;
          -webkit-tap-highlight-color: transparent;
        }
        .ob-palette-row:active { opacity: 0.65; }
        .ob-palette-dot {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          flex-shrink: 0;
          display: block;
          transition: box-shadow 0.2s;
        }

        /* ── Upload area ── */
        .ob-upload {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          width: 100%;
          min-height: 160px;
          border: 1.5px solid #1e3050;
          border-radius: 14px;
          background: transparent;
          transition: border-color 0.2s, background 0.2s;
          animation: uploadPulse 3s ease-in-out infinite;
        }
        .ob-upload:hover {
          border-color: rgba(var(--accent-rgb), 0.5);
          background: rgba(var(--accent-rgb), 0.04);
          animation: none;
        }
        @keyframes uploadPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(var(--accent-rgb), 0); border-color: #1e3050; }
          50%       { box-shadow: 0 0 18px 2px rgba(var(--accent-rgb), 0.08); border-color: rgba(var(--accent-rgb), 0.28); }
        }
        @keyframes logoFloat {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-5px); }
        }

        /* ── Navigation buttons ── */
        .ob-skip-btn {
          background: none;
          border: none;
          color: #4a6888;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          font-family: inherit;
          padding: 6px 0;
          letter-spacing: 0.01em;
          transition: color 0.15s;
        }
        .ob-skip-btn:hover { color: #7090b0; }
        .ob-back-btn {
          flex: 1;
          height: 54px;
          border-radius: 12px;
          border: none;
          background: transparent;
          color: #4a6888;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          font-family: inherit;
          transition: color 0.15s;
          -webkit-tap-highlight-color: transparent;
        }
        .ob-back-btn:hover { color: #7090b0; }
        .ob-cta-btn {
          flex: 2;
          height: 54px;
          border-radius: 12px;
          border: none;
          background: var(--accent);
          color: var(--accent-text);
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          transition: background 0.5s ease, box-shadow 0.3s;
          box-shadow: 0 2px 18px rgba(var(--accent-rgb), 0.3);
          -webkit-tap-highlight-color: transparent;
        }

        /* ── Animations ── */
        @keyframes stepIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes stepInBack {
          from { opacity: 0; transform: translateY(-10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fieldIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        @keyframes checkIn {
          from { opacity: 0; transform: translateY(-50%) scale(0.5); }
          to   { opacity: 1; transform: translateY(-50%) scale(1); }
        }
        @keyframes stepNumPop {
          0%   { opacity: 0; transform: scale(0.7); }
          65%  { transform: scale(1.15); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes headlineReveal {
          from { opacity: 0; transform: translateY(14px) scale(0.97); filter: blur(4px); }
          to   { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }
        @keyframes ctaGlow {
          0%, 100% { box-shadow: 0 2px 18px rgba(var(--accent-rgb), 0.3); }
          50%       { box-shadow: 0 4px 32px rgba(var(--accent-rgb), 0.55), 0 0 48px rgba(var(--accent-rgb), 0.12); }
        }
        .ob-cta-btn:not(:disabled) {
          animation: ctaGlow 2.8s ease-in-out infinite;
        }
        .ob-step-n {
          animation: stepNumPop 0.45s cubic-bezier(0.34,1.56,0.64,1) both;
        }
        .ob-headline {
          animation: headlineReveal 0.5s cubic-bezier(0.22,1,0.36,1) 0.06s both;
        }

        @keyframes welcomeFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes welcomeSlideUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes welcomeNameIn {
          0%   { opacity: 0; transform: translateY(16px) scale(0.95); }
          60%  { opacity: 1; transform: translateY(-4px) scale(1.02); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes welcomeFadeOut {
          from { opacity: 1; }
          to   { opacity: 0; }
        }
      `}</style>

      {mounted && cropFile && (
        <LogoCropModal
          file={cropFile}
          onConfirm={handleCropConfirm}
          onCancel={() => setCropFile(null)}
        />
      )}

      {mounted && showWelcome && createPortal(
        <div style={{
          position: "fixed", inset: 0, zIndex: 99999,
          background: "#07090e",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          animation: "welcomeFadeIn 0.4s ease both",
          gap: 0,
        }}>
          <div style={{
            animation: "welcomeSlideUp 0.5s ease 0.2s both",
            fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 500,
            color: "#4b5563", letterSpacing: "0.18em", textTransform: "uppercase",
            marginBottom: 20,
          }}>
            Bem-vindo ao Formalize
          </div>
          <div style={{
            animation: "welcomeNameIn 0.7s cubic-bezier(0.34,1.56,0.64,1) 0.5s both",
            fontFamily: "'Inter', sans-serif", fontSize: 42, fontWeight: 800,
            color: "#f1f5f9", letterSpacing: "-0.03em", textAlign: "center",
            lineHeight: 1.1,
          }}>
            {data.name || "Artista"}
          </div>
          <div style={{
            marginTop: 12,
            animation: "welcomeSlideUp 0.5s ease 1s both",
            width: 40, height: 3, borderRadius: 2,
            background: data.primaryColor || "#e6b800",
          }} />
          <div style={{
            animation: "welcomeSlideUp 0.5s ease 1.3s both",
            fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 400,
            color: "#374151", marginTop: 28,
          }}>
            Preparando seu painel...
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type ConnState = "open" | "close" | "connecting" | "unknown";

interface StatusPayload {
  instance?: { instanceName?: string; state?: ConnState };
  state?: ConnState;
  error?: string;
  apiStatus?: number;
}

interface QRPayload {
  base64?: string;
  code?: string;
  qrcode?: { base64?: string; code?: string };
  error?: string;
}

function extractState(data: StatusPayload): ConnState {
  // top-level state (normalised by our route when API returns non-2xx)
  if (data?.state === "close" || data?.state === "open" || data?.state === "connecting") return data.state;
  // Evolution API v1: { instance: { state: "open" } }
  if (data?.instance?.state) return data.instance.state;
  return "unknown";
}

function extractBase64(data: QRPayload): string | null {
  return data?.base64 ?? data?.qrcode?.base64 ?? null;
}

const STATE_CONFIG: Record<ConnState, { label: string; color: string; dot: string }> = {
  open:       { label: "Conectado",     color: "#4ade80", dot: "bg-green-400" },
  connecting: { label: "Conectando...", color: "#facc15", dot: "bg-yellow-400 animate-pulse" },
  close:      { label: "Desconectado",  color: "#f87171", dot: "bg-red-400" },
  unknown:    { label: "Verificando...",color: "#6b7280", dot: "bg-gray-500 animate-pulse" },
};

export default function WhatsAppPage() {
  const [connState, setConnState] = useState<ConnState>("unknown");
  const [instanceName, setInstanceName] = useState("");
  const [qrBase64, setQrBase64] = useState<string | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [loadingQr, setLoadingQr] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [qrCountdown, setQrCountdown] = useState(30);

  const statusInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const qrInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearAllIntervals = () => {
    if (statusInterval.current)   clearInterval(statusInterval.current);
    if (qrInterval.current)       clearInterval(qrInterval.current);
    if (countdownInterval.current) clearInterval(countdownInterval.current);
  };

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/super/whatsapp-status");
      const data: StatusPayload = await res.json();
      const st = extractState(data);
      setConnState(st);
      if (data?.instance?.instanceName) setInstanceName(data.instance.instanceName);
      setLastChecked(new Date());
    } catch {
      /* ignore network errors */
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  const fetchQR = useCallback(async () => {
    setLoadingQr(true);
    setQrCountdown(30);
    try {
      const res = await fetch("/api/super/whatsapp-qrcode");
      const data: QRPayload = await res.json();
      console.log("[whatsapp-page] qrcode response:", JSON.stringify(data).slice(0, 200));
      const b64 = extractBase64(data);
      console.log("[whatsapp-page] extracted base64:", b64 ? b64.slice(0, 40) + "..." : null);
      setQrBase64(b64);
    } catch (err) {
      console.error("[whatsapp-page] fetchQR error:", err);
    } finally {
      setLoadingQr(false);
    }
  }, []);

  // Initial status fetch
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // When connected: clear everything. When not: poll status + fetch QR
  useEffect(() => {
    clearAllIntervals();

    if (connState === "open" || connState === "unknown") {
      setQrBase64(null);
      return;
    }

    // Poll status every 3 seconds
    statusInterval.current = setInterval(fetchStatus, 3_000);

    // Fetch QR now, then every 30 seconds
    fetchQR();
    qrInterval.current = setInterval(fetchQR, 30_000);

    // Countdown timer
    countdownInterval.current = setInterval(() => {
      setQrCountdown(c => (c <= 1 ? 30 : c - 1));
    }, 1_000);

    return clearAllIntervals;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connState]);

  // Cleanup on unmount
  useEffect(() => clearAllIntervals, []);

  const cfg = STATE_CONFIG[connState];
  const isConnected  = connState === "open";
  const showQR       = !isConnected && !loadingStatus && connState !== "unknown";

  return (
    <div className="max-w-lg mx-auto space-y-5">

      {/* Title */}
      <div>
        <h1 className="text-2xl font-black text-gray-100 tracking-tight">WhatsApp</h1>
        <p className="text-sm text-gray-500 mt-1">Gerencie a conexão para envio de mensagens</p>
      </div>

      {/* Status Card */}
      <div className="rounded-2xl border border-stage-600 bg-stage-800 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={`w-3 h-3 rounded-full flex-shrink-0 ${cfg.dot}`} />
            <div>
              <p className="text-sm font-semibold" style={{ color: cfg.color }}>
                {cfg.label}
              </p>
              {instanceName && (
                <p className="text-xs text-gray-500 mt-0.5">
                  Instância: <span className="text-gray-400">{instanceName}</span>
                </p>
              )}
            </div>
          </div>
          <div className="text-right">
            {lastChecked && (
              <p className="text-xs text-gray-600">
                {lastChecked.toLocaleTimeString("pt-BR")}
              </p>
            )}
            <button
              onClick={fetchStatus}
              className="mt-1 text-xs text-gray-600 hover:text-gray-400 transition-colors"
            >
              atualizar
            </button>
          </div>
        </div>
      </div>

      {/* Loading initial */}
      {loadingStatus && connState === "unknown" && (
        <div className="rounded-2xl border border-stage-600 bg-stage-800 p-10 flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-gold-500/30 border-t-gold-500 animate-spin" />
          <p className="text-sm text-gray-500">Verificando conexão...</p>
        </div>
      )}

      {/* Connected */}
      {isConnected && (
        <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-4">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <p className="text-base font-bold text-green-400 mb-1">Conexão ativa</p>
          <p className="text-sm text-gray-500">Mensagens sendo enviadas normalmente</p>
        </div>
      )}

      {/* QR Code */}
      {showQR && (
        <div className="rounded-2xl border border-stage-600 bg-stage-800 p-6">

          {/* Instructions */}
          <div className="mb-6">
            <p className="text-sm font-semibold text-gray-200 mb-2">Escaneie para conectar</p>
            <ol className="space-y-1.5 text-xs text-gray-500 list-none">
              {[
                "Abra o WhatsApp no celular",
                "Vá em Configurações → Dispositivos vinculados",
                'Toque em "Vincular dispositivo"',
                "Aponte a câmera para o QR abaixo",
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span
                    className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold mt-0.5"
                    style={{ background: "rgba(245,200,66,0.1)", color: "#f5c842", border: "1px solid rgba(245,200,66,0.2)" }}
                  >
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          {/* QR Image */}
          <div className="flex justify-center mb-4">
            {loadingQr ? (
              <div className="w-56 h-56 rounded-2xl bg-stage-700 border border-stage-600 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-gold-500/30 border-t-gold-500 animate-spin" />
              </div>
            ) : qrBase64 ? (
              <div className="p-3 bg-white rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.5)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrBase64} alt="QR Code WhatsApp" width={208} height={208} className="block" />
              </div>
            ) : (
              <div className="w-56 h-56 rounded-2xl bg-stage-700 border border-stage-600 flex flex-col items-center justify-center gap-3">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="5" height="5" rx="1"/>
                  <rect x="16" y="3" width="5" height="5" rx="1"/>
                  <rect x="3" y="16" width="5" height="5" rx="1"/>
                  <path d="M21 16h-3a2 2 0 0 0-2 2v3"/>
                  <path d="M21 21v.01"/>
                  <path d="M12 7v3a2 2 0 0 1-2 2H7"/>
                  <path d="M3 12h.01"/>
                  <path d="M12 3h.01"/>
                  <path d="M12 16v.01"/>
                  <path d="M16 12h1"/>
                  <path d="M21 12v.01"/>
                  <path d="M12 21v-1"/>
                </svg>
                <p className="text-xs text-gray-500">QR indisponível</p>
              </div>
            )}
          </div>

          {/* Refresh + countdown */}
          <div className="flex items-center justify-between">
            <button
              onClick={fetchQR}
              disabled={loadingQr}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-stage-700 border border-stage-600 text-xs font-semibold text-gray-300 hover:bg-stage-600 transition-colors disabled:opacity-40"
            >
              <svg
                width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                className={loadingQr ? "animate-spin" : ""}
              >
                <polyline points="23 4 23 10 17 10"/>
                <polyline points="1 20 1 14 7 14"/>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
              </svg>
              {loadingQr ? "Atualizando..." : "Novo QR Code"}
            </button>

            {!loadingQr && qrBase64 && (
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                expira em {qrCountdown}s
              </div>
            )}
          </div>
        </div>
      )}

      {/* Polling info */}
      {!isConnected && !loadingStatus && connState !== "unknown" && (
        <p className="text-xs text-gray-600 text-center">
          Status verificado a cada 3s — a página atualiza automaticamente ao conectar
        </p>
      )}
    </div>
  );
}

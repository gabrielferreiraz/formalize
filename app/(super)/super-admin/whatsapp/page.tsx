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
  if (data?.state === "close" || data?.state === "open" || data?.state === "connecting") return data.state;
  if (data?.instance?.state) return data.instance.state;
  return "unknown";
}

function extractBase64(data: QRPayload): string | null {
  return data?.base64 ?? data?.qrcode?.base64 ?? null;
}

// ── Modal de erro ─────────────────────────────────────────────────────────────
function ErrorModal({
  title,
  message,
  onRetry,
  onClose,
}: {
  title: string;
  message: string;
  onRetry?: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 px-4">
      <div className="bg-stage-800 border border-stage-600 rounded-2xl p-6 w-full max-w-sm space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center shrink-0 mt-0.5">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-gray-100">{title}</p>
            <p className="text-xs text-gray-400 mt-1 leading-relaxed">{message}</p>
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          {onRetry && (
            <button
              onClick={() => { onClose(); onRetry(); }}
              className="flex-1 h-10 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-semibold hover:bg-red-500/20 transition-colors"
            >
              Tentar novamente
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 h-10 rounded-xl border border-stage-500 text-gray-400 text-sm hover:text-gray-200 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal de confirmação de desconexão ────────────────────────────────────────
function DisconnectModal({
  instanceName,
  disconnecting,
  onConfirm,
  onClose,
}: {
  instanceName: string;
  disconnecting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 px-4">
      <div className="bg-stage-800 border border-stage-600 rounded-2xl p-6 w-full max-w-sm space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-gray-100">Desconectar WhatsApp?</p>
            <p className="text-xs text-gray-400 mt-1 leading-relaxed">
              A instância <span className="text-gray-300 font-medium">{instanceName}</span> será desconectada.
              Nenhuma mensagem poderá ser enviada até que você reconecte.
            </p>
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <button
            onClick={onConfirm}
            disabled={disconnecting}
            className="flex-1 h-10 rounded-xl bg-red-500/15 border border-red-500/40 text-red-400 text-sm font-semibold hover:bg-red-500/25 transition-colors disabled:opacity-50"
          >
            {disconnecting ? "Desconectando..." : "Desconectar"}
          </button>
          <button
            onClick={onClose}
            disabled={disconnecting}
            className="flex-1 h-10 rounded-xl border border-stage-500 text-gray-400 text-sm hover:text-gray-200 transition-colors disabled:opacity-40"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Ícone WhatsApp ────────────────────────────────────────────────────────────
function WhatsAppIcon({ size = 24, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function WhatsAppPage() {
  const [connState, setConnState]         = useState<ConnState>("unknown");
  const [instanceName, setInstanceName]   = useState("");
  const [connectedAt, setConnectedAt]     = useState<Date | null>(null);
  const [qrBase64, setQrBase64]           = useState<string | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [loadingQr, setLoadingQr]         = useState(false);
  const [qrCountdown, setQrCountdown]     = useState(30);
  const [disconnecting, setDisconnecting] = useState(false);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [error, setError] = useState<{ title: string; message: string; retry?: () => void } | null>(null);
  const [lastChecked, setLastChecked]     = useState<Date | null>(null);

  const statusInterval    = useRef<ReturnType<typeof setInterval> | null>(null);
  const qrInterval        = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearAllIntervals = () => {
    if (statusInterval.current)    clearInterval(statusInterval.current);
    if (qrInterval.current)        clearInterval(qrInterval.current);
    if (countdownInterval.current) clearInterval(countdownInterval.current);
  };

  const fetchStatus = useCallback(async (quiet = false) => {
    try {
      const res = await fetch("/api/super/whatsapp-status");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: StatusPayload = await res.json();
      const st = extractState(data);
      setConnState(prev => {
        if (prev !== "open" && st === "open") setConnectedAt(new Date());
        return st;
      });
      if (data?.instance?.instanceName) setInstanceName(data.instance.instanceName);
      setLastChecked(new Date());
    } catch (err) {
      if (!quiet) {
        setError({
          title: "Falha ao verificar status",
          message: "Não foi possível contactar o servidor de WhatsApp. Verifique se a instância está ativa.",
          retry: () => fetchStatus(false),
        });
      }
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
      const b64 = extractBase64(data);
      if (!b64 && data.error) {
        setError({
          title: "QR Code indisponível",
          message: "Não foi possível gerar o QR Code. A instância pode estar inicializando — aguarde alguns segundos e tente novamente.",
          retry: fetchQR,
        });
      }
      setQrBase64(b64);
    } catch {
      setError({
        title: "Erro ao carregar QR Code",
        message: "Falha de comunicação com o servidor. Verifique sua conexão e tente novamente.",
        retry: fetchQR,
      });
    } finally {
      setLoadingQr(false);
    }
  }, []);

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      const res = await fetch("/api/super/whatsapp-disconnect", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? `HTTP ${res.status}`);
      }
      setShowDisconnectModal(false);
      setConnState("close");
      setConnectedAt(null);
      setQrBase64(null);
    } catch (err) {
      setShowDisconnectModal(false);
      setError({
        title: "Falha ao desconectar",
        message: err instanceof Error ? err.message : "Erro desconhecido ao tentar desconectar a instância.",
      });
    } finally {
      setDisconnecting(false);
    }
  };

  // Initial status check
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Polling logic based on state
  useEffect(() => {
    clearAllIntervals();
    setQrBase64(null);

    if (connState === "open" || connState === "unknown") return;

    // Poll status every 2s while waiting for connection
    statusInterval.current = setInterval(() => fetchStatus(true), 2_000);

    fetchQR();
    qrInterval.current = setInterval(fetchQR, 30_000);

    countdownInterval.current = setInterval(() => {
      setQrCountdown(c => (c <= 1 ? 30 : c - 1));
    }, 1_000);

    return clearAllIntervals;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connState]);

  useEffect(() => () => clearAllIntervals(), []);

  const isConnected = connState === "open";
  const showQR      = !isConnected && !loadingStatus && connState !== "unknown";

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="max-w-lg mx-auto space-y-5 pb-10">

      {/* Modais */}
      {error && (
        <ErrorModal
          title={error.title}
          message={error.message}
          onRetry={error.retry}
          onClose={() => setError(null)}
        />
      )}
      {showDisconnectModal && (
        <DisconnectModal
          instanceName={instanceName || "whatsapp"}
          disconnecting={disconnecting}
          onConfirm={handleDisconnect}
          onClose={() => setShowDisconnectModal(false)}
        />
      )}

      {/* Cabeçalho */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-100 tracking-tight">WhatsApp</h1>
          <p className="text-sm text-gray-500 mt-1">Integração para envio de mensagens aos artistas</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-[#25d366]/10 border border-[#25d366]/20 flex items-center justify-center shrink-0">
          <WhatsAppIcon size={20} color="#25d366" />
        </div>
      </div>

      {/* Card de status */}
      <div className="rounded-2xl border border-stage-600 bg-stage-800 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Indicador */}
            <div className="relative shrink-0">
              <div
                className="w-3 h-3 rounded-full"
                style={{
                  background: connState === "open" ? "#4ade80"
                    : connState === "connecting" ? "#facc15"
                    : connState === "close" ? "#f87171"
                    : "#6b7280",
                  boxShadow: connState === "open" ? "0 0 8px rgba(74,222,128,0.6)"
                    : connState === "connecting" ? "0 0 8px rgba(250,204,21,0.5)"
                    : "none",
                }}
              />
              {(connState === "connecting" || connState === "unknown") && (
                <div
                  className="absolute inset-0 rounded-full animate-ping"
                  style={{ background: connState === "connecting" ? "#facc15" : "#6b7280", opacity: 0.4 }}
                />
              )}
            </div>

            <div>
              <p className="text-sm font-semibold"
                style={{
                  color: connState === "open" ? "#4ade80"
                    : connState === "connecting" ? "#facc15"
                    : connState === "close" ? "#f87171"
                    : "#9ca3af",
                }}>
                {connState === "open" ? "Conectado"
                  : connState === "connecting" ? "Conectando..."
                  : connState === "close" ? "Desconectado"
                  : "Verificando..."}
              </p>
              {instanceName && (
                <p className="text-xs text-gray-500 mt-0.5">
                  {instanceName}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {lastChecked && (
              <p className="text-xs text-gray-600 tabular-nums">
                {lastChecked.toLocaleTimeString("pt-BR")}
              </p>
            )}
            <button
              onClick={() => fetchStatus(false)}
              disabled={loadingStatus}
              title="Verificar agora"
              className="w-8 h-8 rounded-lg border border-stage-600 flex items-center justify-center text-gray-500 hover:text-gray-300 hover:border-stage-500 transition-colors disabled:opacity-40"
            >
              <svg
                width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                className={loadingStatus ? "animate-spin" : ""}
              >
                <polyline points="23 4 23 10 17 10"/>
                <polyline points="1 20 1 14 7 14"/>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Verificando initial */}
      {loadingStatus && connState === "unknown" && (
        <div className="rounded-2xl border border-stage-600 bg-stage-800 p-10 flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-gold-500/30 border-t-gold-500 animate-spin" />
          <p className="text-sm text-gray-500">Verificando conexão...</p>
        </div>
      )}

      {/* ── CONECTADO ─────────────────────────────────────────────────────────── */}
      {isConnected && (
        <div className="rounded-2xl border border-green-500/20 bg-stage-800 overflow-hidden">
          {/* Barra verde no topo */}
          <div className="h-1 bg-gradient-to-r from-green-500/60 to-green-400/30" />

          <div className="p-6 space-y-5">
            {/* Info de conexão */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center shrink-0">
                <WhatsAppIcon size={28} color="#4ade80" />
              </div>
              <div>
                <p className="text-base font-bold text-green-400">Conexão ativa</p>
                <p className="text-sm text-gray-400 mt-0.5">
                  Mensagens sendo enviadas normalmente
                </p>
                {connectedAt && (
                  <p className="text-xs text-gray-600 mt-1">
                    Conectado às {connectedAt.toLocaleTimeString("pt-BR")}
                  </p>
                )}
              </div>
            </div>

            {/* Detalhes */}
            {instanceName && (
              <div className="rounded-xl border border-stage-600 bg-stage-700/40 p-3 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-0.5">Instância</p>
                  <p className="text-sm font-medium text-gray-300">{instanceName}</p>
                </div>
                <div
                  className="w-2 h-2 rounded-full bg-green-400"
                  style={{ boxShadow: "0 0 6px rgba(74,222,128,0.7)" }}
                />
              </div>
            )}

            {/* Capacidades ativas */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: "💬", label: "Orçamentos" },
                { icon: "📄", label: "Contratos" },
                { icon: "🔔", label: "Notificações" },
              ].map(item => (
                <div key={item.label} className="rounded-xl border border-stage-600 bg-stage-700/30 p-3 text-center">
                  <p className="text-lg mb-1">{item.icon}</p>
                  <p className="text-[11px] text-gray-500">{item.label}</p>
                </div>
              ))}
            </div>

            {/* Botão desconectar */}
            <button
              onClick={() => setShowDisconnectModal(true)}
              className="w-full h-10 rounded-xl border border-red-500/30 text-red-400/80 text-sm font-medium hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/50 transition-colors"
            >
              Desconectar
            </button>
          </div>
        </div>
      )}

      {/* ── QR CODE ───────────────────────────────────────────────────────────── */}
      {showQR && (
        <div className="rounded-2xl border border-stage-600 bg-stage-800 overflow-hidden">
          {/* Barra animada enquanto aguarda */}
          <div className="h-0.5 bg-stage-700 relative overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-gold-500/60 animate-pulse"
              style={{ width: "100%", animationDuration: "2s" }}
            />
          </div>

          <div className="p-6">
            {/* Cabeçalho do painel */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-sm font-bold text-gray-200">Escanear QR Code</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {connState === "connecting" ? "Aguardando leitura..." : "Pronto para escanear"}
                </p>
              </div>
              {connState === "connecting" && (
                <div className="flex items-center gap-1.5 text-xs text-yellow-400/80 bg-yellow-400/10 border border-yellow-400/20 px-2.5 py-1 rounded-full">
                  <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                  Aguardando
                </div>
              )}
            </div>

            {/* QR Image */}
            <div className="flex justify-center mb-5">
              {loadingQr ? (
                <div className="w-56 h-56 rounded-2xl bg-stage-700 border border-stage-600 flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 rounded-full border-2 border-gold-500/30 border-t-gold-500 animate-spin" />
                  <p className="text-xs text-gray-600">Gerando QR Code...</p>
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

            {/* Instruções */}
            <div className="rounded-xl border border-stage-600 bg-stage-700/40 p-4 mb-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Como conectar</p>
              <ol className="space-y-2.5">
                {[
                  "Abra o WhatsApp no celular",
                  "Vá em Configurações → Dispositivos vinculados",
                  "Toque em \"Vincular dispositivo\"",
                  "Aponte a câmera para o QR acima",
                ].map((step, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-xs text-gray-400">
                    <span
                      className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                      style={{
                        background: "rgba(245,200,66,0.12)",
                        color: "#f5c842",
                        border: "1px solid rgba(245,200,66,0.25)",
                      }}
                    >
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            {/* Footer: refresh + countdown */}
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
        </div>
      )}

      {/* Rodapé info de polling */}
      {!isConnected && !loadingStatus && connState !== "unknown" && (
        <p className="text-xs text-gray-600 text-center">
          Status verificado a cada 2s — a página atualiza automaticamente ao conectar
        </p>
      )}
    </div>
  );
}

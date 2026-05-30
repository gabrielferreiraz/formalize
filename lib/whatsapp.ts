import { requestLogger } from "@/lib/logger";

interface SendTextMessageParams {
  number: string;
  message: string;
}

interface SendTextMessageResponse {
  success: boolean;
  messageId?: string;
  message: string;
  whatsappMessageId?: string;
  userId: string;
  instanceId: string;
}

/**
 * Envia uma mensagem de texto via API WhatsApp
 */
export async function sendWhatsAppTextMessage({
  number,
  message,
}: SendTextMessageParams): Promise<SendTextMessageResponse | null> {
  const log = requestLogger({ action: "whatsapp.sendText" });
  const apiUrl = process.env.WHATSAPP_API_URL;
  const userId = process.env.WHATSAPP_INSTANCE_USER_ID;

  if (!apiUrl || !userId) {
    log.warn("WhatsApp API not configured (missing env vars)");
    return null;
  }

  try {
    const response = await fetch(
      `${apiUrl}/message/send-text/${encodeURIComponent(userId)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          number,
          message,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      log.error(
        { status: response.status, errorData },
        "Failed to send WhatsApp message"
      );
      return null;
    }

    const data = await response.json();
    log.info({ number }, "WhatsApp message sent successfully");
    return data;
  } catch (error) {
    log.error({ error, number }, "Error sending WhatsApp message");
    return null;
  }
}

/**
 * Formata um número de telefone para o formato internacional (DDI + DDD + número)
 * Exemplo: +55 (11) 99999-9999 → 5511999999999
 */
export function formatWhatsAppNumber(phone: string): string {
  // Remove todos os caracteres não numéricos
  let cleaned = phone.replace(/\D/g, "");

  // Se começar com 0, remove
  if (cleaned.startsWith("0")) {
    cleaned = cleaned.slice(1);
  }

  // Se não começar com 55 (DDI do Brasil), adiciona
  if (!cleaned.startsWith("55")) {
    cleaned = "55" + cleaned;
  }

  return cleaned;
}

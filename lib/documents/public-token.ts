import crypto from "crypto";

/**
 * Token opaco pra URL pública de um documento (/ver/[token]).
 * 24 bytes aleatórios ≈ 192 bits de entropia — inviável de adivinhar por
 * força bruta. Nunca usar o `id` (cuid) do documento aqui: é sequencial o
 * bastante pra ser enumerável.
 */
export function generatePublicToken(): string {
  return crypto.randomBytes(24).toString("base64url");
}

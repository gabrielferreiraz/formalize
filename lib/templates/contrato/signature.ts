import { escapeHtml } from "../utils";

/** Renderiza o nome informado pelo contratante como assinatura digital no PDF. */
export function contratanteSignatureHtml(nome: unknown, className = "") {
  if (typeof nome !== "string" || !nome.trim()) return "";

  return `<div class="${className}" style="height:70px;margin:0 auto 5px;display:flex;align-items:center;justify-content:center;font-family:cursive;font-size:26px;font-style:italic;">
    ${escapeHtml(nome.trim())}
  </div>`;
}

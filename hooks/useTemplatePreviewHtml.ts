"use client";

import { useEffect, useState } from "react";

export interface TemplatePreviewTarget {
  id: string;
  type: "orcamento" | "contrato";
}

/**
 * Busca o HTML de preview de um template (/api/templates/preview-html) toda
 * vez que `target` muda. `target: null` limpa o estado sem disparar fetch —
 * use pra "nada selecionado ainda".
 */
export function useTemplatePreviewHtml(target: TemplatePreviewTarget | null) {
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!target) {
      setHtml(null);
      setError(false);
      return;
    }
    let cancelled = false;
    setHtml(null);
    setError(false);
    fetch(`/api/templates/preview-html?id=${encodeURIComponent(target.id)}&type=${target.type}`)
      .then((res) => {
        if (!res.ok) throw new Error(`status ${res.status}`);
        return res.text();
      })
      .then((text) => { if (!cancelled) setHtml(text); })
      .catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, [target?.id, target?.type]);

  return { html, error };
}

"use client";

import { useEffect, useRef, useState } from "react";
import { ClearButton } from "./icons";

// ── Types ────────────────────────────────────────────────────────────────────

export interface AutocompleteInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onSelect?: (value: string) => void;
  placeholder?: string;
  error?: string;
  opcoes: string[];
  opcoesExtras?: string[];
  onSalvar?: (value: string) => void;
  onDeletar?: (value: string) => void;
  enterKeyHint?: "enter" | "done" | "go" | "next" | "previous" | "search" | "send";
  autoComplete?: string;
  rodapeInfo?: string;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function AutocompleteInput({
  id,
  value,
  onChange,
  onSelect,
  placeholder,
  error,
  opcoes,
  opcoesExtras = [],
  onSalvar,
  onDeletar,
  enterKeyHint,
  autoComplete,
  rodapeInfo,
}: AutocompleteInputProps) {
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const query = value.toLowerCase().trim();
  const filteredFixas = opcoes.filter((o) => o.toLowerCase().includes(query));
  const filteredExtras = opcoesExtras.filter((o) => o.toLowerCase().includes(query));
  const allFiltered = [...filteredFixas, ...filteredExtras];

  const valorExiste =
    opcoes.some((o) => o.toLowerCase() === query) ||
    opcoesExtras.some((o) => o.toLowerCase() === query);

  const canSave = onSalvar && value.trim() && !valorExiste;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleSelect(val: string) {
    onChange(val);
    onSelect?.(val);
    setOpen(false);
    setHighlighted(-1);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setOpen(true);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => (h + 1) % allFiltered.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => (h <= 0 ? allFiltered.length - 1 : h - 1));
    } else if (e.key === "Enter" && highlighted >= 0 && open) {
      e.preventDefault();
      handleSelect(allFiltered[highlighted]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
            setHighlighted(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete={autoComplete ?? "off"}
          enterKeyHint={enterKeyHint}
          className={`input-field pr-8 ${error ? "border-red-500" : ""}`}
        />
        {value && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <ClearButton
              onClick={() => {
                onChange("");
                inputRef.current?.focus();
              }}
            />
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}

      {open && (allFiltered.length > 0 || canSave || rodapeInfo) && (
        <div className="absolute z-50 w-full mt-1 bg-stage-800 border border-stage-500 rounded-xl shadow-lg shadow-black/30 max-h-60 overflow-y-auto animate-slide-down">
          {/* Opções fixas */}
          {filteredFixas.map((item, i) => (
            <button
              key={`fixa-${item}`}
              type="button"
              onClick={() => handleSelect(item)}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                highlighted === i
                  ? "bg-stage-700 text-gold-400"
                  : "text-gray-300 hover:bg-stage-700/50"
              }`}
            >
              {item}
            </button>
          ))}

          {/* Opções extras (salvas pelo usuário) */}
          {filteredExtras.map((item, i) => {
            const idx = filteredFixas.length + i;
            return (
              <div
                key={`extra-${item}`}
                className={`flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                  highlighted === idx
                    ? "bg-stage-700 text-gold-400"
                    : "text-gray-300 hover:bg-stage-700/50"
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleSelect(item)}
                  className="flex items-center gap-2 flex-1 text-left"
                >
                  <span className="text-gold-400 text-xs">&#9733;</span>
                  {item}
                </button>
                {onDeletar && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeletar(item);
                    }}
                    className="text-gray-600 hover:text-red-400 ml-2 text-xs"
                    aria-label={`Remover ${item}`}
                  >
                    &#10005;
                  </button>
                )}
              </div>
            );
          })}

          {/* Botão Salvar */}
          {canSave && (
            <button
              type="button"
              onClick={() => {
                onSalvar!(value.trim());
                setOpen(false);
              }}
              className="w-full text-left px-4 py-2.5 text-sm text-gold-400 hover:bg-stage-700/50 border-t border-stage-600"
            >
              + Salvar &quot;{value.trim()}&quot;
            </button>
          )}

          {/* Rodapé informativo */}
          {rodapeInfo && (
            <div className="px-4 py-2.5 text-xs text-gray-500 border-t border-stage-600">
              {rodapeInfo}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

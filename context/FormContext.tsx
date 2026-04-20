"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { type OrcamentoValues, defaultOrcamentoValues } from "@/components/forms/FormOrcamento";
import { type ContratoValues, defaultContratoValues } from "@/components/forms/FormContrato";

interface FormContextType {
  orcamento: OrcamentoValues;
  setOrcamento: (v: OrcamentoValues) => void;
  contrato: ContratoValues;
  setContrato: React.Dispatch<React.SetStateAction<ContratoValues>>;
  numeroOrc: string;
  setNumeroOrc: (n: string) => void;
  numeroCtr: string;
  setNumeroCtr: (n: string) => void;
  orcamentoFontScale: number;
  setOrcamentoFontScale: (n: number) => void;
  contratoFontScale: number;
  setContratoFontScale: (n: number) => void;
  orcamentoLogoScale: number;
  setOrcamentoLogoScale: (n: number) => void;
  contratoLogoScale: number;
  setContratoLogoScale: (n: number) => void;
}

const FormContext = createContext<FormContextType | undefined>(undefined);

export function FormProvider({ children }: { children: ReactNode }) {
  const [orcamento, setOrcamento] = useState<OrcamentoValues>(defaultOrcamentoValues());
  const [contrato, setContrato] = useState<ContratoValues>(defaultContratoValues());
  const [numeroOrc, setNumeroOrc] = useState("");
  const [numeroCtr, setNumeroCtr] = useState("");
  const [orcamentoFontScale, setOrcamentoFontScale] = useState(100);
  const [contratoFontScale, setContratoFontScale] = useState(100);
  const [orcamentoLogoScale, setOrcamentoLogoScale] = useState(100);
  const [contratoLogoScale, setContratoLogoScale] = useState(100);

  // Carregar escalas iniciais do artista
  React.useEffect(() => {
    fetch("/api/artist/me")
      .then(r => r.json())
      .then(d => {
        if (d.orcamentoFontScale) setOrcamentoFontScale(d.orcamentoFontScale);
        if (d.contratoFontScale) setContratoFontScale(d.contratoFontScale);
        if (d.orcamentoLogoScale) setOrcamentoLogoScale(d.orcamentoLogoScale);
        if (d.contratoLogoScale) setContratoLogoScale(d.contratoLogoScale);
      })
      .catch(() => {});
  }, []);

  return (
    <FormContext.Provider value={{ 
      orcamento, setOrcamento, 
      contrato, setContrato,
      numeroOrc, setNumeroOrc,
      numeroCtr, setNumeroCtr,
      orcamentoFontScale, setOrcamentoFontScale,
      contratoFontScale, setContratoFontScale,
      orcamentoLogoScale, setOrcamentoLogoScale,
      contratoLogoScale, setContratoLogoScale
    }}>
      {children}
    </FormContext.Provider>
  );
}

export function useFormContext() {
  const context = useContext(FormContext);
  if (!context) throw new Error("useFormContext must be used within FormProvider");
  return context;
}

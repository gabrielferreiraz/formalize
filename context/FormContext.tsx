"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { type OrcamentoValues, defaultOrcamentoValues } from "@/components/forms/FormOrcamento";
import { type ContratoValues, defaultContratoValues } from "@/components/forms/FormContrato";

export type ArtistBootstrap = {
  name: string;
  orcamentoFontScale: number;
  contratoFontScale: number;
  orcamentoLogoScale: number;
  contratoLogoScale: number;
};

interface FormContextType {
  artistDisplayName: string;
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

export function FormProvider({
  children,
  initialArtist,
}: {
  children: ReactNode;
  initialArtist?: ArtistBootstrap | null;
}) {
  const [orcamento, setOrcamento] = useState<OrcamentoValues>(defaultOrcamentoValues());
  const [contrato, setContrato] = useState<ContratoValues>(defaultContratoValues());
  const [numeroOrc, setNumeroOrc] = useState("");
  const [numeroCtr, setNumeroCtr] = useState("");
  const [orcamentoFontScale, setOrcamentoFontScale] = useState(
    initialArtist?.orcamentoFontScale ?? 100
  );
  const [contratoFontScale, setContratoFontScale] = useState(
    initialArtist?.contratoFontScale ?? 100
  );
  const [orcamentoLogoScale, setOrcamentoLogoScale] = useState(
    initialArtist?.orcamentoLogoScale ?? 100
  );
  const [contratoLogoScale, setContratoLogoScale] = useState(
    initialArtist?.contratoLogoScale ?? 100
  );

  const [artistDisplayName, setArtistDisplayName] = useState(
    initialArtist?.name ?? "Artista"
  );

  React.useEffect(() => {
    if (!initialArtist) return;
    setArtistDisplayName(initialArtist.name);
    setOrcamentoFontScale(initialArtist.orcamentoFontScale);
    setContratoFontScale(initialArtist.contratoFontScale);
    setOrcamentoLogoScale(initialArtist.orcamentoLogoScale);
    setContratoLogoScale(initialArtist.contratoLogoScale);
  }, [
    initialArtist?.name,
    initialArtist?.orcamentoFontScale,
    initialArtist?.contratoFontScale,
    initialArtist?.orcamentoLogoScale,
    initialArtist?.contratoLogoScale,
  ]);

  return (
    <FormContext.Provider value={{
      artistDisplayName,
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

export interface AssetResult {
  base64: string;
  mime: string;
}

export interface ArtistTemplateData {
  orcamentoTemplate?: string | null;
  contratoTemplate?: string | null;
  [key: string]: unknown;
}

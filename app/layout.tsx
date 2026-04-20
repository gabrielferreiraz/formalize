import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Formalize",
  description: "Plataforma de geração automática de documentos para artistas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}

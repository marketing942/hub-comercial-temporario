import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hub Comercial",
  description: "Hub temporario do comercial - metas, resultados e gamificacao.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}

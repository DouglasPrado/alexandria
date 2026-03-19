import type { Metadata } from "next";
import "./globals.css";
import AppLayout from "@/components/layouts/AppLayout";

export const metadata: Metadata = {
  title: "Alexandria — Armazenamento Familiar",
  description: "Sistema de armazenamento familiar distribuido com criptografia zero-knowledge",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="font-sans antialiased">
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}

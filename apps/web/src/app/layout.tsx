import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Alexandria',
  description: 'Distributed family storage — preserve memories for decades',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}

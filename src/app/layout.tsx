import type { Metadata } from 'next';
import './globals.css'
export const metadata: Metadata = {
  title: 'SIGE Reportes',
  description: 'Panel de reportes — Paradigma del Sur',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}

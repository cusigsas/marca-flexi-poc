import type { Metadata, Viewport } from 'next';
import Menu from '@/components/Menu';
import './globals.css';

export const metadata: Metadata = {
  title: 'MARCA FLEXI · Laboratorio facial',
  description: 'Prueba de reconocimiento facial con prueba de vida (AWS Rekognition Face Liveness).',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0f2a5c',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <header className="encabezado">
          <div className="marca">
            <span className="logo" aria-hidden="true">MF</span>
            <span>
              <strong>MARCA FLEXI</strong>
              <small>Laboratorio de reconocimiento facial</small>
            </span>
          </div>
          <Menu />
        </header>
        <main className="contenido">{children}</main>
      </body>
    </html>
  );
}

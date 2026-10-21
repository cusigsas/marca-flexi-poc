'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const enlaces = [
  { href: '/', texto: 'Inicio' },
  { href: '/registrar', texto: 'Registrar' },
  { href: '/marcar', texto: 'Marcar' },
  { href: '/personas', texto: 'Personas' },
  { href: '/resultados', texto: 'Resultados' },
];

export default function Menu() {
  const ruta = usePathname();
  return (
    <nav className="menu" aria-label="Secciones">
      {enlaces.map((e) => (
        <Link key={e.href} href={e.href} className={ruta === e.href ? 'activo' : undefined}>
          {e.texto}
        </Link>
      ))}
    </nav>
  );
}

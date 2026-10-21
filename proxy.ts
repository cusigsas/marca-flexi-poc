// Pide usuario y clave antes de entrar a cualquier página o API,
// para que nadie más use tu cuenta de AWS (cada verificación cuesta dinero).
import { NextResponse, type NextRequest } from 'next/server';

function iguales(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diferencia = 0;
  for (let i = 0; i < a.length; i++) diferencia |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diferencia === 0;
}

export function proxy(request: NextRequest) {
  const usuario = process.env.MF_USUARIO;
  const clave = process.env.MF_CLAVE;

  if (!usuario || !clave) {
    // En tu computador se puede entrar sin clave; publicado en internet, no.
    if (process.env.NODE_ENV !== 'production') return NextResponse.next();
    return new NextResponse(
      'Falta configurar MF_USUARIO y MF_CLAVE en las variables de entorno.',
      { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
    );
  }

  const encabezado = request.headers.get('authorization') || '';
  if (encabezado.startsWith('Basic ')) {
    try {
      const [u, ...resto] = atob(encabezado.slice(6)).split(':');
      if (iguales(u, usuario) && iguales(resto.join(':'), clave)) return NextResponse.next();
    } catch {
      // encabezado mal formado: se vuelve a pedir la clave
    }
  }

  return new NextResponse('Necesitas usuario y clave para entrar.', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="MARCA FLEXI pruebas", charset="UTF-8"',
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.svg).*)'],
};

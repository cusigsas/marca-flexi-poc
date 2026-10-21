'use client';
// Flujo completo de una verificación: crea la sesión en AWS, abre la cámara
// y, cuando termina, entrega el sessionId para que el servidor decida.
import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import type { ErrorLiveness } from './Liveness';
import { erroresLiveness } from './textos-es';

const Liveness = dynamic(() => import('./Liveness'), {
  ssr: false,
  loading: () => <p className="cargando">Cargando cámara...</p>,
});

export type Reto = 'luces' | 'movimiento';

export default function PruebaFacial(props: {
  reto: Reto;
  sinPantallaInicio?: boolean;
  onTerminar: (sessionId: string, reto: string) => Promise<void>;
  onCancelar: () => void;
}) {
  const [sesion, setSesion] = useState<{ sessionId: string; region: string; reto: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);
  const pedida = useRef<number | null>(null);

  useEffect(() => {
    if (pedida.current === intento) return;
    pedida.current = intento;
    setSesion(null);
    setError(null);
    fetch('/api/sesion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reto: props.reto }),
    })
      .then(async (r) => {
        const datos = await r.json();
        if (!r.ok) throw new Error(datos.error || 'No se pudo crear la sesión');
        setSesion(datos);
      })
      .catch((e: Error) => setError(e.message));
  }, [intento, props.reto]);

  if (error) {
    return (
      <div className="aviso aviso-error">
        <p>{error}</p>
        <div className="fila">
          <button className="boton" onClick={() => setIntento((n) => n + 1)}>
            Intentar de nuevo
          </button>
          <button className="boton boton-secundario" onClick={props.onCancelar}>
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  if (!sesion) return <p className="cargando">Preparando verificación...</p>;

  return (
    <div className="camara">
      <Liveness
        key={sesion.sessionId}
        sessionId={sesion.sessionId}
        region={sesion.region}
        sinPantallaInicio={props.sinPantallaInicio}
        onListo={() => props.onTerminar(sesion.sessionId, sesion.reto)}
        onCancelar={props.onCancelar}
        onError={(e: ErrorLiveness) =>
          setError(`${erroresLiveness[e.estado] || 'Error en la verificación.'} (${e.estado}: ${e.mensaje})`)
        }
      />
    </div>
  );
}

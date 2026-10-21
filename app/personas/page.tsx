'use client';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

type Persona = { faceId: string; nombre: string };

export default function Personas() {
  const [personas, setPersonas] = useState<Persona[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const cargar = useCallback(async () => {
    setError(null);
    try {
      const r = await fetch('/api/personas');
      const datos = await r.json();
      if (!r.ok) throw new Error(datos.error);
      setPersonas(datos.personas);
    } catch (e) {
      setError((e as Error).message || 'No se pudo cargar la lista.');
      setPersonas([]);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function borrar(cuerpo: { faceId?: string; todos?: boolean }) {
    setOcupado(true);
    try {
      const r = await fetch('/api/personas', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cuerpo),
      });
      const datos = await r.json();
      if (!r.ok) throw new Error(datos.error);
      await cargar();
    } catch (e) {
      setError((e as Error).message || 'No se pudo borrar.');
    }
    setOcupado(false);
  }

  return (
    <>
      <h1>Personas registradas</h1>
      <p className="subtitulo">
        AWS no guarda la foto, guarda una plantilla matemática de la cara. Al borrar, se elimina de
        AWS.
      </p>

      {error && (
        <div className="aviso aviso-error">
          <p>{error}</p>
        </div>
      )}

      {!(error && personas?.length === 0) && <section className="tarjeta">
        {personas === null && <p className="cargando">Cargando...</p>}
        {personas?.length === 0 && !error && (
          <p>
            Aún no hay nadie. <Link href="/registrar">Registra la primera persona</Link>.
          </p>
        )}
        {personas && personas.length > 0 && (
          <ul className="personas">
            {personas.map((p) => (
              <li key={p.faceId}>
                <span>{p.nombre}</span>
                <button
                  className="boton boton-peligro"
                  disabled={ocupado}
                  onClick={() => {
                    if (window.confirm(`¿Borrar a ${p.nombre}?`)) borrar({ faceId: p.faceId });
                  }}
                >
                  Borrar
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>}

      {personas && personas.length > 0 && (
        <button
          className="boton boton-peligro"
          disabled={ocupado}
          onClick={() => {
            if (window.confirm('¿Borrar a TODAS las personas de AWS? No se puede deshacer.')) borrar({ todos: true });
          }}
        >
          Borrar todas las caras de AWS
        </button>
      )}
    </>
  );
}

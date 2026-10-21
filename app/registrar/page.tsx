'use client';
import Link from 'next/link';
import { useState } from 'react';
import PruebaFacial, { type Reto } from '@/components/PruebaFacial';

type Respuesta = {
  ok?: boolean;
  motivo?: string;
  error?: string;
  persona?: { faceId: string; nombre: string };
  vida?: { estado: string; confianza: number | null };
  imagen?: string | null;
};

export default function Registrar() {
  const [nombre, setNombre] = useState('');
  const [reto, setReto] = useState<Reto>('luces');
  const [fase, setFase] = useState<'formulario' | 'camara' | 'resultado'>('formulario');
  const [respuesta, setRespuesta] = useState<Respuesta | null>(null);

  async function terminar(sessionId: string) {
    try {
      const r = await fetch('/api/registrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, nombre }),
      });
      setRespuesta(await r.json());
    } catch {
      setRespuesta({ error: 'No hubo respuesta del servidor. Revisa el internet.' });
    }
    setFase('resultado');
  }

  function otraPersona() {
    setNombre('');
    setRespuesta(null);
    setFase('formulario');
  }

  return (
    <>
      <h1>Registrar persona</h1>
      <p className="subtitulo">
        La persona hace la prueba de vida una sola vez y su cara queda guardada para marcar.
      </p>

      {fase === 'formulario' && (
        <form
          className="tarjeta"
          onSubmit={(e) => {
            e.preventDefault();
            if (nombre.trim().length >= 2) setFase('camara');
          }}
        >
          <label htmlFor="nombre">Nombre completo</label>
          <input
            id="nombre"
            type="text"
            autoComplete="off"
            maxLength={60}
            placeholder="Ej: Ana María Restrepo"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />

          <label>Tipo de verificación</label>
          <div className="opciones">
            <button type="button" className={`opcion ${reto === 'luces' ? 'elegida' : ''}`} onClick={() => setReto('luces')}>
              Con luces de colores
            </button>
            <button type="button" className={`opcion ${reto === 'movimiento' ? 'elegida' : ''}`} onClick={() => setReto('movimiento')}>
              Solo movimiento
            </button>
          </div>
          <p className="ayuda">Para registrar se recomienda la de luces de colores, que es la más exigente.</p>

          <button className="boton boton-grande" disabled={nombre.trim().length < 2}>
            Abrir cámara
          </button>
        </form>
      )}

      {fase === 'camara' && (
        <>
          <p>
            Registrando a <strong>{nombre.trim()}</strong>. Buena luz de frente, sin gorra ni gafas
            oscuras, celular vertical a la altura de la cara.
          </p>
          <PruebaFacial reto={reto} onTerminar={terminar} onCancelar={() => setFase('formulario')} />
        </>
      )}

      {fase === 'resultado' && respuesta && (
        <>
          {respuesta.error ? (
            <div className="aviso aviso-error">
              <p>{respuesta.error}</p>
            </div>
          ) : (
            <div className={`resultado ${respuesta.ok ? 'aceptada' : 'rechazada'}`}>
              <div className="veredicto">{respuesta.ok ? 'Persona registrada' : 'No se registró'}</div>
              <p>{respuesta.ok ? `${respuesta.persona?.nombre} ya puede marcar.` : respuesta.motivo}</p>
              <div className="resultado-cuerpo">
                {respuesta.imagen ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={respuesta.imagen} alt="Imagen que vio AWS" />
                ) : (
                  <span />
                )}
                <dl className="lista-datos">
                  <dt>Prueba de vida</dt>
                  <dd>{respuesta.vida?.estado}</dd>
                  <dt>Puntaje de vida</dt>
                  <dd>{respuesta.vida?.confianza ?? '—'}</dd>
                </dl>
              </div>
            </div>
          )}
          <div className="fila">
            <button className="boton" onClick={otraPersona}>
              Registrar otra persona
            </button>
            <Link className="boton boton-secundario" href="/marcar">
              Ir a marcar
            </Link>
          </div>
        </>
      )}
    </>
  );
}

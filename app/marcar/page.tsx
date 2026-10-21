'use client';
import { useRef, useState } from 'react';
import PruebaFacial, { type Reto } from '@/components/PruebaFacial';
import {
  dispositivoCorto,
  escenarios,
  guardarPrueba,
  type EscenarioId,
  type Prueba,
} from '@/lib/pruebas';

type Respuesta = {
  decision?: 'aceptada' | 'rechazada';
  motivo?: string;
  error?: string;
  vida?: { estado: string; confianza: number | null; reto: string | null; ms: number };
  coincidencia?: { nombre: string; similitud: number } | null;
  umbrales?: { vida: number; similitud: number };
  msTotal?: number;
  imagen?: string | null;
};

export default function Marcar() {
  const [marca, setMarca] = useState<'entrada' | 'salida'>('entrada');
  const [escenario, setEscenario] = useState<EscenarioId>('real_registrada');
  const [reto, setReto] = useState<Reto>('luces');
  const [fase, setFase] = useState<'listo' | 'camara' | 'resultado'>('listo');
  const [respuesta, setRespuesta] = useState<Respuesta | null>(null);
  const [prueba, setPrueba] = useState<Prueba | null>(null);
  const inicio = useRef(0);

  const esperado = escenarios.find((e) => e.id === escenario)!.esperado;

  function empezar() {
    inicio.current = performance.now();
    setRespuesta(null);
    setPrueba(null);
    setFase('camara');
  }

  async function terminar(sessionId: string, retoUsado: string) {
    const antesDeEnviar = performance.now();
    let datos: Respuesta;
    try {
      const r = await fetch('/api/marcar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      datos = await r.json();
    } catch {
      datos = { error: 'No hubo respuesta del servidor. Revisa el internet.' };
    }
    const fin = performance.now();
    const decision = datos.error ? 'error' : (datos.decision ?? 'error');

    const registro: Prueba = {
      id: crypto.randomUUID(),
      fecha: new Date().toISOString(),
      marca,
      escenario,
      reto: retoUsado === 'FaceMovementChallenge' ? 'movimiento' : 'luces',
      esperado,
      decision,
      acierto: decision === esperado,
      motivo: datos.error || datos.motivo || '',
      vidaEstado: datos.vida?.estado || '',
      vidaPuntaje: datos.vida?.confianza ?? null,
      persona: datos.coincidencia?.nombre || '',
      similitud: datos.coincidencia?.similitud ?? null,
      segundosTotal: Math.round((fin - inicio.current) / 100) / 10,
      segundosRespuesta: Math.round((fin - antesDeEnviar) / 100) / 10,
      dispositivo: dispositivoCorto(),
    };
    if (decision !== 'error') guardarPrueba(registro);
    setPrueba(registro);
    setRespuesta(datos);
    setFase('resultado');
  }

  return (
    <>
      <h1>Marcar entrada o salida</h1>
      <p className="subtitulo">Prueba de vida + búsqueda de la persona entre todas las registradas.</p>

      {fase === 'listo' && (
        <section className="tarjeta">
          <label>Marcación</label>
          <div className="opciones">
            <button type="button" className={`opcion ${marca === 'entrada' ? 'elegida' : ''}`} onClick={() => setMarca('entrada')}>
              Entrada
            </button>
            <button type="button" className={`opcion ${marca === 'salida' ? 'elegida' : ''}`} onClick={() => setMarca('salida')}>
              Salida
            </button>
          </div>

          <label htmlFor="escenario">¿Qué estás probando?</label>
          <select id="escenario" value={escenario} onChange={(e) => setEscenario(e.target.value as EscenarioId)}>
            {escenarios.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre}
              </option>
            ))}
          </select>
          <p className="ayuda">
            Lo correcto en este caso es que la marcación sea <strong>{esperado}</strong>.
          </p>

          <label>Tipo de verificación</label>
          <div className="opciones">
            <button type="button" className={`opcion ${reto === 'luces' ? 'elegida' : ''}`} onClick={() => setReto('luces')}>
              Con luces de colores
            </button>
            <button type="button" className={`opcion ${reto === 'movimiento' ? 'elegida' : ''}`} onClick={() => setReto('movimiento')}>
              Solo movimiento
            </button>
          </div>
          <p className="ayuda">Prueba las dos para comparar seguridad y rapidez.</p>

          <button className="boton boton-grande" onClick={empezar}>
            Marcar {marca}
          </button>
        </section>
      )}

      {fase === 'camara' && (
        <PruebaFacial
          reto={reto}
          sinPantallaInicio
          onTerminar={terminar}
          onCancelar={() => setFase('listo')}
        />
      )}

      {fase === 'resultado' && respuesta && (
        <>
          {respuesta.error ? (
            <div className="aviso aviso-error">
              <p>{respuesta.error}</p>
            </div>
          ) : (
            <div className={`resultado ${respuesta.decision}`}>
              <div className="fila" style={{ justifyContent: 'space-between' }}>
                <div className="veredicto">
                  {respuesta.decision === 'aceptada' ? `${marca === 'entrada' ? 'Entrada' : 'Salida'} registrada` : 'Marcación rechazada'}
                </div>
                {prueba && (
                  <span className={`etiqueta-acierto ${prueba.acierto ? 'si' : 'no'}`}>
                    {prueba.acierto ? 'El sistema acertó' : 'El sistema se equivocó'}
                  </span>
                )}
              </div>
              <p>{respuesta.motivo}</p>
              <div className="resultado-cuerpo">
                {respuesta.imagen ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={respuesta.imagen} alt="Imagen que vio AWS" />
                ) : (
                  <span />
                )}
                <dl className="lista-datos">
                  <dt>Persona</dt>
                  <dd>{respuesta.coincidencia?.nombre || '—'}</dd>
                  <dt>Parecido</dt>
                  <dd>
                    {respuesta.coincidencia ? `${respuesta.coincidencia.similitud}%` : '—'}
                    {respuesta.umbrales ? ` (mín. ${respuesta.umbrales.similitud}%)` : ''}
                  </dd>
                  <dt>Puntaje de vida</dt>
                  <dd>
                    {respuesta.vida?.confianza ?? '—'}
                    {respuesta.umbrales ? ` (mín. ${respuesta.umbrales.vida})` : ''}
                  </dd>
                  <dt>Estado</dt>
                  <dd>{respuesta.vida?.estado}</dd>
                  <dt>Tiempo total</dt>
                  <dd>{prueba?.segundosTotal} s</dd>
                  <dt>Respuesta servidor</dt>
                  <dd>{prueba?.segundosRespuesta} s</dd>
                </dl>
              </div>
            </div>
          )}
          <div className="fila">
            <button className="boton" onClick={empezar}>
              Otra marcación igual
            </button>
            <button className="boton boton-secundario" onClick={() => setFase('listo')}>
              Cambiar prueba
            </button>
          </div>
        </>
      )}
    </>
  );
}

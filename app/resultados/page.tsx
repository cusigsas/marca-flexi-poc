'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { aCSV, borrarPruebas, escenarios, leerPruebas, nombreEscenario, type Prueba } from '@/lib/pruebas';

const ataques = new Set(['foto_impresa', 'foto_pantalla', 'video_pantalla']);

function promedio(valores: (number | null)[]) {
  const v = valores.filter((x): x is number => typeof x === 'number');
  return v.length ? Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 10) / 10 : null;
}

export default function Resultados() {
  const [pruebas, setPruebas] = useState<Prueba[] | null>(null);

  useEffect(() => {
    setPruebas(leerPruebas());
  }, []);

  const resumen = useMemo(() => {
    const p = pruebas || [];
    const deAtaque = p.filter((x) => ataques.has(x.escenario));
    const legitimas = p.filter((x) => x.esperado === 'aceptada');
    return {
      total: p.length,
      aciertos: p.filter((x) => x.acierto).length,
      ataques: deAtaque.length,
      ataquesQuePasaron: deAtaque.filter((x) => x.decision === 'aceptada').length,
      legitimas: legitimas.length,
      rechazosInjustos: legitimas.filter((x) => x.decision !== 'aceptada').length,
      aceptacionesFalsas: p.filter((x) => x.esperado === 'rechazada' && x.decision === 'aceptada').length,
      tiempo: promedio(legitimas.filter((x) => x.decision === 'aceptada').map((x) => x.segundosTotal)),
      porEscenario: escenarios
        .map((e) => {
          const g = p.filter((x) => x.escenario === e.id);
          return {
            id: e.id,
            nombre: e.nombre,
            esperado: e.esperado,
            cantidad: g.length,
            aciertos: g.filter((x) => x.acierto).length,
            vida: promedio(g.map((x) => x.vidaPuntaje)),
            similitud: promedio(g.map((x) => x.similitud)),
            tiempo: promedio(g.map((x) => x.segundosTotal)),
          };
        })
        .filter((g) => g.cantidad > 0),
    };
  }, [pruebas]);

  function descargar() {
    if (!pruebas?.length) return;
    const blob = new Blob([aCSV(pruebas)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `marca-flexi-pruebas-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (pruebas === null) return <p className="cargando">Cargando...</p>;

  const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : '—');

  return (
    <>
      <h1>Resultados de las pruebas</h1>
      <p className="subtitulo">
        Se guardan en este navegador. Si pruebas en varios celulares, descarga el Excel de cada uno.
      </p>

      {pruebas.length === 0 ? (
        <section className="tarjeta">
          <p>
            Todavía no hay pruebas. Ve a <Link href="/marcar">Marcar</Link> y haz la primera.
          </p>
        </section>
      ) : (
        <>
          <div className="grilla" style={{ marginBottom: '1rem' }}>
            <div className="dato">
              <div className="valor">{resumen.total}</div>
              <div className="etiqueta">Pruebas hechas</div>
            </div>
            <div className={`dato ${resumen.aciertos === resumen.total ? 'bien' : ''}`}>
              <div className="valor">{pct(resumen.aciertos, resumen.total)}</div>
              <div className="etiqueta">Aciertos del sistema</div>
            </div>
            <div className={`dato ${resumen.ataques ? (resumen.ataquesQuePasaron ? 'mal' : 'bien') : ''}`}>
              <div className="valor">
                {resumen.ataquesQuePasaron} de {resumen.ataques}
              </div>
              <div className="etiqueta">Fotos o videos que lograron marcar</div>
            </div>
            <div className={`dato ${resumen.legitimas ? (resumen.rechazosInjustos ? 'mal' : 'bien') : ''}`}>
              <div className="valor">
                {resumen.rechazosInjustos} de {resumen.legitimas}
              </div>
              <div className="etiqueta">Personas registradas rechazadas</div>
            </div>
            <div className={`dato ${resumen.aceptacionesFalsas ? 'mal' : ''}`}>
              <div className="valor">{resumen.aceptacionesFalsas}</div>
              <div className="etiqueta">Marcaciones que no debían pasar</div>
            </div>
            <div className="dato">
              <div className="valor">{resumen.tiempo ?? '—'} s</div>
              <div className="etiqueta">Tiempo promedio de una marcación buena</div>
            </div>
          </div>

          <h2>Por tipo de prueba</h2>
          <div className="tabla-contenedor">
            <table>
              <thead>
                <tr>
                  <th>Prueba</th>
                  <th>Lo correcto</th>
                  <th className="num">Intentos</th>
                  <th className="num">Aciertos</th>
                  <th className="num">Vida prom.</th>
                  <th className="num">Parecido prom.</th>
                  <th className="num">Tiempo prom.</th>
                </tr>
              </thead>
              <tbody>
                {resumen.porEscenario.map((g) => (
                  <tr key={g.id}>
                    <td className="texto">{g.nombre}</td>
                    <td>{g.esperado}</td>
                    <td className="num">{g.cantidad}</td>
                    <td className="num">{pct(g.aciertos, g.cantidad)}</td>
                    <td className="num">{g.vida ?? '—'}</td>
                    <td className="num">{g.similitud !== null ? `${g.similitud}%` : '—'}</td>
                    <td className="num">{g.tiempo !== null ? `${g.tiempo} s` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2>Todas las pruebas</h2>
          <div className="tabla-contenedor">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Prueba</th>
                  <th>Resultado</th>
                  <th>¿Acertó?</th>
                  <th>Persona</th>
                  <th className="num">Vida</th>
                  <th className="num">Parecido</th>
                  <th className="num">Tiempo</th>
                  <th>Verificación</th>
                  <th>Dispositivo</th>
                </tr>
              </thead>
              <tbody>
                {pruebas.map((p) => (
                  <tr key={p.id}>
                    <td>{new Date(p.fecha).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}</td>
                    <td className="texto">{nombreEscenario(p.escenario)}</td>
                    <td>
                      {p.marca} {p.decision}
                    </td>
                    <td>
                      <span className={`etiqueta-acierto ${p.acierto ? 'si' : 'no'}`}>{p.acierto ? 'Sí' : 'No'}</span>
                    </td>
                    <td>{p.persona || '—'}</td>
                    <td className="num">{p.vidaPuntaje ?? '—'}</td>
                    <td className="num">{p.similitud !== null ? `${p.similitud}%` : '—'}</td>
                    <td className="num">{p.segundosTotal} s</td>
                    <td>{p.reto}</td>
                    <td>{p.dispositivo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="fila">
            <button className="boton" onClick={descargar}>
              Descargar Excel (CSV)
            </button>
            <button
              className="boton boton-peligro"
              onClick={() => {
                if (window.confirm('¿Borrar todas las pruebas de este navegador?')) {
                  borrarPruebas();
                  setPruebas([]);
                }
              }}
            >
              Borrar pruebas
            </button>
          </div>
        </>
      )}
    </>
  );
}

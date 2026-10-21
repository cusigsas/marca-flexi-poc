'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';

type Estado = {
  llaves: boolean;
  claveAcceso: boolean;
  region: string;
  coleccion: string;
  umbralVida: number;
  umbralSimilitud: number;
  conexion: 'ok' | 'error' | 'sin-llaves';
  detalle?: string;
  personas: number;
};

export default function Inicio() {
  const [estado, setEstado] = useState<Estado | null>(null);
  const [falla, setFalla] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/estado')
      .then((r) => r.json())
      .then(setEstado)
      .catch(() => setFalla('No se pudo consultar el estado del servidor.'));
  }, []);

  return (
    <>
      <h1>Laboratorio de reconocimiento facial</h1>
      <p className="subtitulo">
        Prueba sencilla para comprobar si la prueba de vida de AWS rechaza fotos y videos, y qué tan
        rápido reconoce a las personas registradas.
      </p>

      <section className="tarjeta">
        <h2>Estado de la conexión</h2>
        {falla && <p className="punto mal">{falla}</p>}
        {!estado && !falla && <p className="cargando">Revisando...</p>}
        {estado && (
          <>
            <div className="estado-linea">
              <span>Llaves de AWS</span>
              <span className={`punto ${estado.llaves ? 'ok' : 'mal'}`}>
                {estado.llaves ? 'Configuradas' : 'Faltan'}
              </span>
            </div>
            <div className="estado-linea">
              <span>Conexión con AWS</span>
              <span className={`punto ${estado.conexion === 'ok' ? 'ok' : 'mal'}`}>
                {estado.conexion === 'ok' ? 'Funciona' : estado.conexion === 'sin-llaves' ? 'Sin llaves' : 'Con error'}
              </span>
            </div>
            <div className="estado-linea">
              <span>Clave para entrar a la plataforma</span>
              <span className={`punto ${estado.claveAcceso ? 'ok' : 'mal'}`}>
                {estado.claveAcceso ? 'Activa' : 'Sin clave'}
              </span>
            </div>
            <div className="estado-linea">
              <span>Personas registradas</span>
              <span className="punto">{estado.personas}</span>
            </div>
            <div className="estado-linea">
              <span>Puntaje mínimo de vida / parecido</span>
              <span className="punto">
                {estado.umbralVida} / {estado.umbralSimilitud}%
              </span>
            </div>
            <div className="estado-linea">
              <span>Región de AWS</span>
              <span className="punto">{estado.region}</span>
            </div>
            {estado.detalle && (
              <div className="aviso aviso-error" style={{ marginTop: '0.75rem' }}>
                <p>{estado.detalle}</p>
              </div>
            )}
          </>
        )}
      </section>

      <section className="tarjeta">
        <h2>Cómo hacer la prueba</h2>
        <ol className="pasos">
          <li>
            <Link href="/registrar">Registra</Link> 3 a 5 personas reales (cada una hace la verificación
            una vez).
          </li>
          <li>
            En <Link href="/marcar">Marcar</Link>, cada persona marca entrada y salida varias veces, con
            buena luz y también con casco, gafas o poca luz.
          </li>
          <li>
            Intenta engañar al sistema: muestra a la cámara una foto impresa, una foto en otro celular y
            un video de una persona registrada.
          </li>
          <li>
            Antes de cada intento elige qué estás probando, así la plataforma sabe si acertó o se
            equivocó.
          </li>
          <li>
            Mira los números en <Link href="/resultados">Resultados</Link> y descarga el Excel.
          </li>
        </ol>
      </section>

      <div className="aviso aviso-alerta">
        <p>
          Cada verificación cuesta alrededor de USD 0,015 en AWS (menos de 100 pesos), así que 200
          pruebas cuestan cerca de USD 3. Al terminar, borra las caras en <Link href="/personas">Personas</Link>.
        </p>
      </div>
    </>
  );
}

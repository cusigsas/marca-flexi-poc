// Bitácora de pruebas: se guarda en ESTE navegador (no en el servidor).
// Sirve para medir qué tan bien funciona AWS con fotos, videos y personas reales.

export const escenarios = [
  { id: 'real_registrada', nombre: 'Persona registrada (real)', esperado: 'aceptada' },
  { id: 'condicion_dificil', nombre: 'Persona registrada en condición difícil (casco, gafas, poca luz)', esperado: 'aceptada' },
  { id: 'real_no_registrada', nombre: 'Persona real NO registrada', esperado: 'rechazada' },
  { id: 'parecida', nombre: 'Persona parecida (familiar) a una registrada', esperado: 'rechazada' },
  { id: 'foto_impresa', nombre: 'Foto impresa de una persona registrada', esperado: 'rechazada' },
  { id: 'foto_pantalla', nombre: 'Foto en otra pantalla (celular o tablet)', esperado: 'rechazada' },
  { id: 'video_pantalla', nombre: 'Video en otra pantalla', esperado: 'rechazada' },
] as const;

export type EscenarioId = (typeof escenarios)[number]['id'];

export type Prueba = {
  id: string;
  fecha: string;
  marca: 'entrada' | 'salida';
  escenario: EscenarioId;
  reto: string;
  esperado: 'aceptada' | 'rechazada';
  decision: 'aceptada' | 'rechazada' | 'error';
  acierto: boolean;
  motivo: string;
  vidaEstado: string;
  vidaPuntaje: number | null;
  persona: string;
  similitud: number | null;
  segundosTotal: number;
  segundosRespuesta: number;
  dispositivo: string;
};

const CLAVE = 'mf-pruebas';

export function leerPruebas(): Prueba[] {
  try {
    const texto = window.localStorage.getItem(CLAVE);
    return texto ? (JSON.parse(texto) as Prueba[]) : [];
  } catch {
    return [];
  }
}

export function guardarPrueba(prueba: Prueba) {
  try {
    const todas = leerPruebas();
    todas.unshift(prueba);
    window.localStorage.setItem(CLAVE, JSON.stringify(todas.slice(0, 2000)));
    return true;
  } catch {
    return false;
  }
}

export function borrarPruebas() {
  try {
    window.localStorage.removeItem(CLAVE);
  } catch {
    // sin almacenamiento disponible: no hay nada que borrar
  }
}

export function nombreEscenario(id: string) {
  return escenarios.find((e) => e.id === id)?.nombre || id;
}

export function dispositivoCorto() {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const so = /iPhone|iPad/.test(ua)
    ? 'iPhone/iPad'
    : /Android/.test(ua)
      ? 'Android'
      : /Windows/.test(ua)
        ? 'Windows'
        : /Mac/.test(ua)
          ? 'Mac'
          : 'Otro';
  const nav = /CriOS|Chrome/.test(ua) && !/Edg/.test(ua)
    ? 'Chrome'
    : /Edg/.test(ua)
      ? 'Edge'
      : /Firefox|FxiOS/.test(ua)
        ? 'Firefox'
        : /Safari/.test(ua)
          ? 'Safari'
          : 'Otro';
  return `${so} · ${nav}`;
}

export function aCSV(pruebas: Prueba[]) {
  const columnas: (keyof Prueba)[] = [
    'fecha', 'marca', 'escenario', 'reto', 'esperado', 'decision', 'acierto', 'motivo',
    'vidaEstado', 'vidaPuntaje', 'persona', 'similitud', 'segundosTotal', 'segundosRespuesta', 'dispositivo',
  ];
  const celda = (v: unknown) => {
    const t = v === null || v === undefined ? '' : String(v);
    return /[",;\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
  };
  const filas = pruebas.map((p) =>
    columnas.map((c) => celda(c === 'escenario' ? nombreEscenario(p.escenario) : p[c])).join(';'),
  );
  // Separador ";" y BOM para que Excel en español lo abra bien
  return '﻿' + [columnas.join(';'), ...filas].join('\n');
}

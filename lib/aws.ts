// Todo lo que habla con AWS vive aquí y SOLO se usa desde el servidor (carpeta app/api).
// Las llaves de AWS nunca llegan al navegador.
import {
  RekognitionClient,
  GetFaceLivenessSessionResultsCommand,
  CreateCollectionCommand,
  DescribeCollectionCommand,
  SearchFacesByImageCommand,
} from '@aws-sdk/client-rekognition';
import { STSClient } from '@aws-sdk/client-sts';

function numero(valor: string | undefined, porDefecto: number) {
  const n = Number(valor);
  return Number.isFinite(n) && n > 0 && n <= 100 ? n : porDefecto;
}

export const config = {
  region: process.env.MF_AWS_REGION || 'us-east-1',
  coleccion: process.env.MF_COLECCION || 'marca-flexi-poc',
  umbralVida: numero(process.env.MF_UMBRAL_VIDA, 80),
  umbralSimilitud: numero(process.env.MF_UMBRAL_SIMILITUD, 95),
};

export function llavesConfiguradas() {
  return Boolean(process.env.MF_AWS_ACCESS_KEY_ID && process.env.MF_AWS_SECRET_ACCESS_KEY);
}

function credenciales() {
  if (!llavesConfiguradas()) {
    throw new ErrorUsuario(
      'Faltan las llaves de AWS. Configura MF_AWS_ACCESS_KEY_ID y MF_AWS_SECRET_ACCESS_KEY.',
      500,
    );
  }
  return {
    accessKeyId: process.env.MF_AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.MF_AWS_SECRET_ACCESS_KEY as string,
  };
}

let rekognition: RekognitionClient | null = null;
let sts: STSClient | null = null;

export function clienteRekognition() {
  if (!rekognition) rekognition = new RekognitionClient({ region: config.region, credentials: credenciales() });
  return rekognition;
}

export function clienteSTS() {
  if (!sts) sts = new STSClient({ region: config.region, credentials: credenciales() });
  return sts;
}

/** Error con mensaje entendible para mostrar en pantalla. */
export class ErrorUsuario extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

/** Convierte cualquier error en una respuesta JSON con mensaje en español. */
export function respuestaError(error: unknown) {
  if (error instanceof ErrorUsuario) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  const nombre = (error as { name?: string })?.name || 'Error';
  const mensaje = (error as { message?: string })?.message || String(error);
  console.error('[MARCA FLEXI]', nombre, mensaje);
  const traducciones: Record<string, string> = {
    UnrecognizedClientException: 'Las llaves de AWS no son válidas. Revisa MF_AWS_ACCESS_KEY_ID.',
    InvalidSignatureException: 'La llave secreta de AWS no es correcta. Revisa MF_AWS_SECRET_ACCESS_KEY.',
    AccessDeniedException: 'El usuario de AWS no tiene permiso para esta acción. Revisa la política IAM.',
    AccessDenied: 'El usuario de AWS no tiene permiso para esta acción. Revisa la política IAM.',
    SessionNotFoundException: 'La sesión de verificación no existe o ya venció (duran 3 minutos).',
    ThrottlingException: 'AWS está recibiendo demasiadas solicitudes, intenta de nuevo en unos segundos.',
    ProvisionedThroughputExceededException: 'Se superó el límite de solicitudes de AWS, intenta de nuevo.',
  };
  return Response.json(
    { error: traducciones[nombre] || `Error de AWS (${nombre}): ${mensaje}` },
    { status: 500 },
  );
}

/** Crea la colección de caras si todavía no existe. */
export async function asegurarColeccion() {
  const cliente = clienteRekognition();
  try {
    await cliente.send(new DescribeCollectionCommand({ CollectionId: config.coleccion }));
  } catch (error) {
    if ((error as { name?: string }).name !== 'ResourceNotFoundException') throw error;
    try {
      await cliente.send(new CreateCollectionCommand({ CollectionId: config.coleccion }));
    } catch (e) {
      if ((e as { name?: string }).name !== 'ResourceAlreadyExistsException') throw e;
    }
  }
}

// Una sesión de prueba de vida solo puede usarse una vez para registrar o marcar.
// (En esta prueba se recuerda en memoria; en la plataforma real va en la base de datos.)
const sesionesUsadas = new Map<string, number>();

function marcarSesionUsada(sessionId: string) {
  const ahora = Date.now();
  for (const [id, cuando] of sesionesUsadas) {
    if (ahora - cuando > 10 * 60 * 1000) sesionesUsadas.delete(id);
  }
  if (sesionesUsadas.has(sessionId)) {
    throw new ErrorUsuario('Esta verificación ya se usó. Haz una nueva.', 409);
  }
  sesionesUsadas.set(sessionId, ahora);
}

export type ResultadoVida = {
  estado: string;
  confianza: number | null;
  esPersonaReal: boolean;
  imagen: Uint8Array | null;
  reto: string | null;
  ms: number;
};

/** Pide a AWS el resultado de la prueba de vida de una sesión. */
export async function resultadoVida(sessionId: string): Promise<ResultadoVida> {
  if (!/^[0-9a-fA-F-]{36}$/.test(sessionId || '')) {
    throw new ErrorUsuario('Identificador de sesión no válido.');
  }
  marcarSesionUsada(sessionId);
  const inicio = Date.now();
  const r = await clienteRekognition().send(
    new GetFaceLivenessSessionResultsCommand({ SessionId: sessionId }),
  );
  const confianza = typeof r.Confidence === 'number' ? Math.round(r.Confidence * 100) / 100 : null;
  return {
    estado: r.Status || 'DESCONOCIDO',
    confianza,
    esPersonaReal: r.Status === 'SUCCEEDED' && confianza !== null && confianza >= config.umbralVida,
    imagen: r.ReferenceImage?.Bytes ?? null,
    reto: r.Challenge?.Type ?? null,
    ms: Date.now() - inicio,
  };
}

export type Coincidencia = { faceId: string; nombre: string; similitud: number } | null;

/** Busca en la colección la cara más parecida (1 contra todos). */
export async function buscarCara(imagen: Uint8Array): Promise<{ mejor: Coincidencia; ms: number }> {
  const inicio = Date.now();
  try {
    const r = await clienteRekognition().send(
      new SearchFacesByImageCommand({
        CollectionId: config.coleccion,
        Image: { Bytes: imagen },
        MaxFaces: 1,
        // Se pide desde 70 para ver qué tan parecida era; la decisión se toma con umbralSimilitud.
        FaceMatchThreshold: 70,
        QualityFilter: 'NONE',
      }),
    );
    const m = r.FaceMatches?.[0];
    const mejor: Coincidencia =
      m?.Face?.FaceId
        ? {
            faceId: m.Face.FaceId,
            nombre: decodificarNombre(m.Face.ExternalImageId),
            similitud: Math.round((m.Similarity ?? 0) * 100) / 100,
          }
        : null;
    return { mejor, ms: Date.now() - inicio };
  } catch (error) {
    const nombre = (error as { name?: string }).name;
    // Colección vacía o inexistente, o AWS no encontró una cara en la imagen
    if (nombre === 'ResourceNotFoundException' || nombre === 'InvalidParameterException') {
      return { mejor: null, ms: Date.now() - inicio };
    }
    throw error;
  }
}

// AWS solo acepta letras sin tildes, números y _ . - : en el "ExternalImageId",
// así que el nombre de la persona se guarda codificado.
export function codificarNombre(nombre: string) {
  return 'p_' + Buffer.from(nombre, 'utf8').toString('base64url');
}

export function decodificarNombre(id: string | undefined) {
  if (!id) return 'Sin nombre';
  if (!id.startsWith('p_')) return id;
  try {
    return Buffer.from(id.slice(2), 'base64url').toString('utf8');
  } catch {
    return id;
  }
}

export function imagenComoDataUrl(imagen: Uint8Array | null) {
  return imagen ? `data:image/jpeg;base64,${Buffer.from(imagen).toString('base64')}` : null;
}

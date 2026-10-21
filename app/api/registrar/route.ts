// Registra (enrola) a una persona: primero confirma que es una persona real
// y después guarda su plantilla facial en la colección de AWS.
import { IndexFacesCommand } from '@aws-sdk/client-rekognition';
import {
  asegurarColeccion,
  buscarCara,
  clienteRekognition,
  codificarNombre,
  config,
  ErrorUsuario,
  imagenComoDataUrl,
  respuestaError,
  resultadoVida,
} from '@/lib/aws';

export async function POST(request: Request) {
  try {
    const cuerpo = (await request.json().catch(() => ({}))) as { sessionId?: string; nombre?: string };
    const nombre = (cuerpo.nombre || '').trim().replace(/\s+/g, ' ');
    if (nombre.length < 2 || nombre.length > 60) {
      throw new ErrorUsuario('Escribe un nombre de 2 a 60 letras.');
    }

    const vida = await resultadoVida(cuerpo.sessionId || '');
    const resumenVida = { estado: vida.estado, confianza: vida.confianza, reto: vida.reto, ms: vida.ms };

    if (!vida.esPersonaReal || !vida.imagen) {
      return Response.json({
        ok: false,
        motivo:
          vida.estado !== 'SUCCEEDED'
            ? `La prueba de vida no terminó bien (estado: ${vida.estado}).`
            : `AWS no está seguro de que sea una persona real (puntaje ${vida.confianza}, mínimo ${config.umbralVida}).`,
        vida: resumenVida,
        imagen: imagenComoDataUrl(vida.imagen),
      });
    }

    await asegurarColeccion();

    // Evita registrar dos veces a la misma persona
    const { mejor } = await buscarCara(vida.imagen);
    if (mejor && mejor.similitud >= config.umbralSimilitud) {
      return Response.json({
        ok: false,
        motivo: `Esta cara ya está registrada como "${mejor.nombre}" (parecido ${mejor.similitud}%).`,
        vida: resumenVida,
        imagen: imagenComoDataUrl(vida.imagen),
      });
    }

    const r = await clienteRekognition().send(
      new IndexFacesCommand({
        CollectionId: config.coleccion,
        Image: { Bytes: vida.imagen },
        ExternalImageId: codificarNombre(nombre),
        MaxFaces: 1,
        QualityFilter: 'AUTO',
      }),
    );
    const cara = r.FaceRecords?.[0]?.Face;
    if (!cara?.FaceId) {
      const razones = r.UnindexedFaces?.[0]?.Reasons?.join(', ') || 'calidad baja';
      return Response.json({
        ok: false,
        motivo: `AWS no pudo guardar la cara (${razones}). Intenta con mejor luz y de frente.`,
        vida: resumenVida,
        imagen: imagenComoDataUrl(vida.imagen),
      });
    }

    return Response.json({
      ok: true,
      persona: { faceId: cara.FaceId, nombre },
      vida: resumenVida,
      imagen: imagenComoDataUrl(vida.imagen),
    });
  } catch (error) {
    return respuestaError(error);
  }
}

// Marca entrada o salida: 1) prueba de vida, 2) busca quién es entre todas las personas registradas.
// La decisión se toma aquí en el servidor, nunca en el celular.
import { buscarCara, config, imagenComoDataUrl, respuestaError, resultadoVida } from '@/lib/aws';

export async function POST(request: Request) {
  try {
    const inicio = Date.now();
    const cuerpo = (await request.json().catch(() => ({}))) as { sessionId?: string };

    const vida = await resultadoVida(cuerpo.sessionId || '');
    const resumenVida = { estado: vida.estado, confianza: vida.confianza, reto: vida.reto, ms: vida.ms };
    const umbrales = { vida: config.umbralVida, similitud: config.umbralSimilitud };

    if (!vida.esPersonaReal || !vida.imagen) {
      return Response.json({
        decision: 'rechazada',
        motivo:
          vida.estado !== 'SUCCEEDED'
            ? `La prueba de vida no terminó bien (estado: ${vida.estado}).`
            : `Posible suplantación: puntaje de vida ${vida.confianza}, mínimo ${config.umbralVida}.`,
        vida: resumenVida,
        coincidencia: null,
        umbrales,
        msTotal: Date.now() - inicio,
        imagen: imagenComoDataUrl(vida.imagen),
      });
    }

    const busqueda = await buscarCara(vida.imagen);
    const mejor = busqueda.mejor;
    const aceptada = Boolean(mejor && mejor.similitud >= config.umbralSimilitud);

    return Response.json({
      decision: aceptada ? 'aceptada' : 'rechazada',
      motivo: aceptada
        ? `Marcación aceptada para ${mejor!.nombre}.`
        : mejor
          ? `Persona real, pero no coincide lo suficiente (parecido ${mejor.similitud}%, mínimo ${config.umbralSimilitud}%).`
          : 'Persona real, pero no está registrada.',
      vida: resumenVida,
      coincidencia: mejor,
      msBusqueda: busqueda.ms,
      umbrales,
      msTotal: Date.now() - inicio,
      imagen: imagenComoDataUrl(vida.imagen),
    });
  } catch (error) {
    return respuestaError(error);
  }
}

// Crea una sesión nueva de prueba de vida en AWS (cada intento necesita una sesión nueva).
import { CreateFaceLivenessSessionCommand, type ChallengeType } from '@aws-sdk/client-rekognition';
import { clienteRekognition, config, respuestaError } from '@/lib/aws';

export async function POST(request: Request) {
  try {
    const cuerpo = (await request.json().catch(() => ({}))) as { reto?: string };
    // "luces" = movimiento + destellos de colores (el más exigente)
    // "movimiento" = solo acercar la cara, sin destellos
    const reto: ChallengeType =
      cuerpo.reto === 'movimiento' ? 'FaceMovementChallenge' : 'FaceMovementAndLightChallenge';

    const r = await clienteRekognition().send(
      new CreateFaceLivenessSessionCommand({
        Settings: {
          AuditImagesLimit: 0,
          ChallengePreferences: [{ Type: reto }],
        },
      }),
    );
    return Response.json({ sessionId: r.SessionId, region: config.region, reto });
  } catch (error) {
    return respuestaError(error);
  }
}

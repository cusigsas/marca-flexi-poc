// Entrega al navegador unas llaves temporales (15 minutos) que SOLO sirven para
// transmitir el video de la prueba de vida a AWS. Las llaves reales nunca salen del servidor.
import { GetFederationTokenCommand } from '@aws-sdk/client-sts';
import { clienteSTS, respuestaError } from '@/lib/aws';

const politicaSoloVideo = JSON.stringify({
  Version: '2012-10-17',
  Statement: [
    {
      Effect: 'Allow',
      Action: 'rekognition:StartFaceLivenessSession',
      Resource: '*',
    },
  ],
});

export async function POST() {
  try {
    const r = await clienteSTS().send(
      new GetFederationTokenCommand({
        Name: 'mf-liveness',
        DurationSeconds: 900,
        Policy: politicaSoloVideo,
      }),
    );
    const c = r.Credentials;
    if (!c?.AccessKeyId || !c.SecretAccessKey) {
      return Response.json({ error: 'AWS no entregó credenciales temporales.' }, { status: 500 });
    }
    return Response.json(
      {
        accessKeyId: c.AccessKeyId,
        secretAccessKey: c.SecretAccessKey,
        sessionToken: c.SessionToken,
        expiration: c.Expiration ? new Date(c.Expiration).toISOString() : null,
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    return respuestaError(error);
  }
}

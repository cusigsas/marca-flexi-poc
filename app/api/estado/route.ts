// Revisa que la configuración y la conexión con AWS estén bien.
import { DescribeCollectionCommand } from '@aws-sdk/client-rekognition';
import { clienteRekognition, config, llavesConfiguradas } from '@/lib/aws';

export async function GET() {
  const base = {
    llaves: llavesConfiguradas(),
    claveAcceso: Boolean(process.env.MF_USUARIO && process.env.MF_CLAVE),
    region: config.region,
    coleccion: config.coleccion,
    umbralVida: config.umbralVida,
    umbralSimilitud: config.umbralSimilitud,
  };
  if (!base.llaves) {
    return Response.json({ ...base, conexion: 'sin-llaves', personas: 0 });
  }
  try {
    const r = await clienteRekognition().send(
      new DescribeCollectionCommand({ CollectionId: config.coleccion }),
    );
    return Response.json({ ...base, conexion: 'ok', personas: r.FaceCount ?? 0 });
  } catch (error) {
    const nombre = (error as { name?: string }).name;
    if (nombre === 'ResourceNotFoundException') {
      // Conecta bien, solo que aún no hay nadie registrado
      return Response.json({ ...base, conexion: 'ok', personas: 0 });
    }
    return Response.json({
      ...base,
      conexion: 'error',
      detalle: `${nombre}: ${(error as { message?: string }).message}`,
      personas: 0,
    });
  }
}

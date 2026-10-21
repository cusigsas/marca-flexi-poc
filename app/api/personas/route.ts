// Lista y borra las personas registradas en la colección de AWS.
import {
  DeleteCollectionCommand,
  DeleteFacesCommand,
  ListFacesCommand,
  type Face,
} from '@aws-sdk/client-rekognition';
import { clienteRekognition, config, decodificarNombre, ErrorUsuario, respuestaError } from '@/lib/aws';

export async function GET() {
  try {
    const caras: Face[] = [];
    let token: string | undefined;
    do {
      const r = await clienteRekognition().send(
        new ListFacesCommand({ CollectionId: config.coleccion, MaxResults: 1000, NextToken: token }),
      );
      caras.push(...(r.Faces || []));
      token = r.NextToken;
    } while (token && caras.length < 5000);

    const personas = caras
      .map((c) => ({ faceId: c.FaceId as string, nombre: decodificarNombre(c.ExternalImageId) }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    return Response.json({ personas });
  } catch (error) {
    if ((error as { name?: string }).name === 'ResourceNotFoundException') {
      return Response.json({ personas: [] });
    }
    return respuestaError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const cuerpo = (await request.json().catch(() => ({}))) as { faceId?: string; todos?: boolean };

    if (cuerpo.todos) {
      try {
        await clienteRekognition().send(new DeleteCollectionCommand({ CollectionId: config.coleccion }));
      } catch (e) {
        if ((e as { name?: string }).name !== 'ResourceNotFoundException') throw e;
      }
      return Response.json({ ok: true, borradas: 'todas' });
    }

    if (!cuerpo.faceId || !/^[0-9a-fA-F-]{36}$/.test(cuerpo.faceId)) {
      throw new ErrorUsuario('Falta el identificador de la persona.');
    }
    await clienteRekognition().send(
      new DeleteFacesCommand({ CollectionId: config.coleccion, FaceIds: [cuerpo.faceId] }),
    );
    return Response.json({ ok: true });
  } catch (error) {
    return respuestaError(error);
  }
}

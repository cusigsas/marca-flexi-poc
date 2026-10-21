'use client';
// Componente oficial de AWS que hace la prueba de vida (óvalo + destellos de colores).
// Solo se carga en el navegador (nunca en el servidor) porque usa la cámara.
import '@aws-amplify/ui-react/styles.css';
import '@aws-amplify/ui-react-liveness/styles.css';
import { ThemeProvider } from '@aws-amplify/ui-react';
import {
  FaceLivenessDetectorCore,
  type AwsCredentialProvider,
} from '@aws-amplify/ui-react-liveness';
import { textosLiveness } from './textos-es';

type Credenciales = Awaited<ReturnType<AwsCredentialProvider>>;
let guardadas: Credenciales | null = null;

// Pide al servidor unas llaves temporales que solo permiten enviar el video a AWS.
const pedirCredenciales: AwsCredentialProvider = async () => {
  if (guardadas?.expiration && guardadas.expiration.getTime() - Date.now() > 60_000) {
    return guardadas;
  }
  const r = await fetch('/api/credenciales', { method: 'POST' });
  const datos = await r.json();
  if (!r.ok) throw new Error(datos.error || 'No se pudieron obtener credenciales temporales');
  guardadas = {
    accessKeyId: datos.accessKeyId,
    secretAccessKey: datos.secretAccessKey,
    sessionToken: datos.sessionToken,
    expiration: datos.expiration ? new Date(datos.expiration) : undefined,
  };
  return guardadas;
};

export type ErrorLiveness = { estado: string; mensaje: string };

export default function Liveness(props: {
  sessionId: string;
  region: string;
  sinPantallaInicio?: boolean;
  onListo: () => Promise<void>;
  onCancelar: () => void;
  onError: (e: ErrorLiveness) => void;
}) {
  return (
    <ThemeProvider>
      <FaceLivenessDetectorCore
        sessionId={props.sessionId}
        region={props.region}
        disableStartScreen={props.sinPantallaInicio}
        onAnalysisComplete={props.onListo}
        onUserCancel={props.onCancelar}
        onError={(e) =>
          props.onError({ estado: String(e.state), mensaje: e.error?.message || String(e.error) })
        }
        config={{ credentialProvider: pedirCredenciales }}
        displayText={textosLiveness}
      />
    </ThemeProvider>
  );
}

# MARCA FLEXI · Laboratorio de reconocimiento facial

Plataforma muy sencilla para comprobar, con personas reales, si la prueba de vida de AWS (Rekognition Face Liveness) rechaza fotos y videos, qué tan rápido reconoce a quien está registrado y cuántas veces se equivoca, antes de construir el sistema completo.

Tiene cinco pantallas: **Inicio** (estado de la conexión con AWS), **Registrar** (enrolar una persona con prueba de vida), **Marcar** (entrada o salida, buscando a la persona entre todas las registradas), **Personas** (ver y borrar caras) y **Resultados** (aciertos, errores, tiempos y descarga a Excel).

---

## Lo que necesitas

- Una cuenta de AWS (aws.amazon.com) con tarjeta registrada, la prueba completa cuesta menos de USD 5.
- Tu cuenta de GitHub, que ya tienes.
- Una cuenta gratis en Vercel (vercel.com), entrando con tu GitHub.
- Un celular con cámara frontal y buena conexión a internet.

---

## Paso 1 · Preparar AWS (15 minutos)

**1.1 Alerta de gastos (recomendado).** En la consola de AWS busca **Budgets** → *Create budget* → *Monthly cost budget* → monto USD 10 → tu correo. Así te avisa si algo se dispara.

**1.2 Crear el permiso.** Busca **IAM** → *Policies* → *Create policy* → pestaña **JSON** → borra lo que hay y pega todo el contenido del archivo `politica-iam.json` de esta carpeta → *Next* → nombre `MarcaFlexiPoC` → *Create policy*.

**1.3 Crear el usuario técnico.** En IAM → *Users* → *Create user* → nombre `marca-flexi-poc` (sin acceso a la consola) → *Attach policies directly* → marca `MarcaFlexiPoC` → *Create user*.

**1.4 Sacar las llaves.** Entra al usuario `marca-flexi-poc` → pestaña *Security credentials* → *Create access key* → elige *Application running outside AWS* → *Create*. Copia el **Access key** y el **Secret access key** en un lugar seguro, la llave secreta solo se muestra una vez.

> Nunca uses las llaves de la cuenta principal (root), y nunca pegues estas llaves en el código ni en GitHub.

---

## Paso 2 · Subir el código a GitHub (5 minutos)

Con **GitHub Desktop**: *File* → *Add local repository* → elige esta carpeta → si te pregunta, *create a repository* → *Publish repository* → deja marcado **Keep this code private**.

El archivo `.gitignore` ya evita que se suban las llaves (`.env.local`) y la carpeta `node_modules`.

---

## Paso 3 · Publicarlo en Vercel (5 minutos)

1. Entra a vercel.com con tu GitHub → *Add New* → *Project* → importa el repositorio `marca-flexi-poc`.
2. Antes de darle *Deploy*, abre **Environment Variables** y crea estas (los nombres deben quedar exactos):

| Variable | Valor |
|---|---|
| `MF_AWS_ACCESS_KEY_ID` | el Access key del paso 1.4 |
| `MF_AWS_SECRET_ACCESS_KEY` | el Secret access key del paso 1.4 |
| `MF_AWS_REGION` | `us-east-1` |
| `MF_USUARIO` | el usuario que quieras para entrar, por ejemplo `marcaflexi` |
| `MF_CLAVE` | una clave larga que solo conozcas tú |

3. Dale **Deploy**. En un minuto te da una dirección tipo `marca-flexi-poc.vercel.app`.
4. Abre esa dirección, escribe el usuario y la clave, y en **Inicio** revisa que "Conexión con AWS" diga **Funciona**.

Las variables `MF_UMBRAL_VIDA` (80) y `MF_UMBRAL_SIMILITUD` (95) son opcionales, si las cambias en Vercel debes darle *Redeploy* para que tomen efecto.

---

## Paso 4 · Cómo hacer la prueba

Haz la prueba con por lo menos 3 personas y unos 60 intentos en total, en el celular y con la plataforma abierta en Chrome (Android) o Safari (iPhone).

1. **Registrar**: cada persona se registra una vez, con buena luz de frente y el celular vertical a la altura de la cara.
2. **Marcar, caso normal**: cada persona marca entrada y salida unas 5 veces eligiendo *Persona registrada (real)*.
3. **Condiciones difíciles**: repite con casco, gafas de seguridad, tapabocas, poca luz o a contraluz, eligiendo *condición difícil*.
4. **Intentos de engaño** (lo más importante):
   - Foto impresa de una persona registrada, en papel normal y en papel fotográfico.
   - Foto de la persona en la pantalla de otro celular o tablet, con el brillo al máximo.
   - Video de la persona (por ejemplo una historia de WhatsApp) en otra pantalla.
   - Una persona que no está registrada, y si es posible un familiar parecido.
5. Prueba también los dos tipos de verificación, **con luces de colores** y **solo movimiento**, para comparar seguridad y rapidez.
6. En **Resultados** mira los números y descarga el Excel de cada celular.

### Qué resultado buscar

| Indicador | Meta |
|---|---|
| Fotos o videos que lograron marcar | **0**, si alguno pasa hay que subir `MF_UMBRAL_VIDA` |
| Personas registradas rechazadas en condiciones normales | menos de 1 de cada 20 |
| Marcaciones que no debían pasar (otra persona) | **0** |
| Tiempo promedio de una marcación buena | menos de 8 segundos |

Cada pantalla de resultado muestra la imagen que vio AWS, el **puntaje de vida** (0 a 100, qué tan seguro está de que es una persona real) y el **parecido** (0 a 100 %, qué tanto se parece a la persona registrada).

---

## Probarlo en tu computador (opcional)

Necesitas Node.js 20 o superior instalado.

```
npm install
copy .env.example .env.local      (en Windows; en Mac: cp .env.example .env.local)
npm run dev
```

Llena `.env.local` con tus llaves y abre http://localhost:3000. En el computador la cámara funciona, pero para probar en el celular usa la versión de Vercel, porque el celular exige HTTPS.

---

## Al terminar la prueba

1. En **Personas** pulsa *Borrar todas las caras de AWS*.
2. En AWS → IAM → usuario `marca-flexi-poc` → *Security credentials*, desactiva o borra la llave.
3. Si vas a seguir usando AWS con datos de empleados reales, activa en AWS Organizations la política de exclusión de servicios de IA (*AI services opt-out policy*), para que AWS no use esas imágenes para mejorar sus servicios, y pide autorización escrita de cada persona (Ley 1581, los datos biométricos son sensibles).

---

## Problemas comunes

| Mensaje | Qué hacer |
|---|---|
| "Faltan las llaves de AWS" | Revisa los nombres de las variables en Vercel y dale *Redeploy* |
| "Las llaves de AWS no son válidas" o "la llave secreta no es correcta" | Vuelve a copiar las llaves sin espacios al inicio o al final |
| "El usuario de AWS no tiene permiso" | Revisa que la política `MarcaFlexiPoC` esté asignada al usuario |
| "No hay permiso para usar la cámara" | En el navegador del celular permite la cámara para la página y recarga |
| "AWS respondió con un error" al abrir la cámara | Revisa que `sts:GetFederationToken` esté en la política y que la región sea `us-east-1` |
| La prueba siempre falla con poca luz | Es normal, la prueba de vida necesita la cara bien iluminada |

---

## Cómo está hecho (para el programador)

- Next.js 16 (App Router) + `@aws-amplify/ui-react-liveness` (componente oficial de AWS) + AWS SDK v3.
- Las llaves de AWS solo viven en el servidor. El navegador recibe llaves temporales de 15 minutos (STS `GetFederationToken`) que solo permiten `rekognition:StartFaceLivenessSession`, es decir, enviar el video.
- La decisión de aceptar o rechazar se toma en el servidor (`app/api/marcar`), nunca en el celular.
- Cada sesión de prueba de vida se usa una sola vez.
- `proxy.ts` pide usuario y clave en todas las páginas.
- Las personas se guardan en una colección de Rekognition (`IndexFaces`) y la búsqueda es 1 contra todos (`SearchFacesByImage`).
- La bitácora de pruebas se guarda en el navegador (localStorage), en la plataforma real irá en la base de datos.

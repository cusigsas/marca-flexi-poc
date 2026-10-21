// Textos en español para la pantalla de la cámara (por defecto vienen en inglés).
export const textosLiveness = {
  // Cámara
  cameraMinSpecificationsHeadingText: 'La cámara no cumple los requisitos mínimos',
  cameraMinSpecificationsMessageText:
    'La cámara debe tener al menos 320x240 de resolución y 15 cuadros por segundo.',
  cameraNotFoundHeadingText: 'No se puede usar la cámara',
  cameraNotFoundMessageText:
    'Revisa que ninguna otra aplicación esté usando la cámara y que el navegador tenga permiso para usarla. Puede que tengas que cerrar el navegador y volver a abrirlo.',
  retryCameraPermissionsText: 'Reintentar',
  waitingCameraPermissionText: 'Esperando que permitas el uso de la cámara.',
  a11yVideoLabelText: 'Cámara para la prueba de vida',

  // Instrucciones
  goodFitCaptionText: 'Bien',
  goodFitAltText: 'Cara que llena completamente el óvalo.',
  tooFarCaptionText: 'Muy lejos',
  tooFarAltText: 'Cara dentro del óvalo pero con espacio alrededor.',
  photosensitivityWarningHeadingText: 'Aviso de fotosensibilidad',
  photosensitivityWarningBodyText:
    'Esta prueba muestra destellos de colores. Ten cuidado si eres sensible a la luz.',
  photosensitivityWarningInfoText:
    'Algunas personas pueden tener convulsiones con luces de colores. Ten cuidado si tú o alguien de tu familia tiene epilepsia.',
  photosensitivityWarningLabelText: 'Más información sobre fotosensibilidad',
  startScreenBeginCheckText: 'Empezar verificación',

  // Pistas durante la prueba
  hintCenterFaceText: 'Centra tu cara',
  hintCenterFaceInstructionText:
    'Pon la cámara a la altura de tu cara y céntrate. Aparecerá un óvalo: acércate hasta llenarlo y quédate quieto unos segundos.',
  hintFaceOffCenterText: 'Tu cara no está en el óvalo, céntrala.',
  hintMoveFaceFrontOfCameraText: 'Pon tu cara frente a la cámara',
  hintTooManyFacesText: 'Solo debe haber una cara frente a la cámara',
  hintFaceDetectedText: 'Cara detectada',
  hintCanNotIdentifyText: 'Pon tu cara frente a la cámara',
  hintTooCloseText: 'Aléjate un poco',
  hintTooFarText: 'Acércate',
  hintConnectingText: 'Conectando...',
  hintVerifyingText: 'Verificando...',
  hintCheckCompleteText: 'Listo',
  hintIlluminationTooBrightText: 'Hay demasiada luz, busca un lugar con menos luz',
  hintIlluminationTooDarkText: 'Está muy oscuro, busca un lugar con más luz',
  hintIlluminationNormalText: 'Luz adecuada',
  hintHoldFaceForFreshnessText: 'Quédate quieto',
  hintMatchIndicatorText: 'Vas en 50%. Sigue acercándote.',

  // Grabación
  recordingIndicatorText: 'Grabando',
  cancelLivenessCheckText: 'Cancelar verificación',

  // Errores
  errorLabelText: 'Error',
  connectionTimeoutHeaderText: 'Se agotó el tiempo de conexión',
  connectionTimeoutMessageText: 'La conexión tardó demasiado.',
  timeoutHeaderText: 'Se acabó el tiempo',
  timeoutMessageText: 'Tu cara no llenó el óvalo a tiempo. Intenta de nuevo y llena todo el óvalo con tu cara.',
  faceDistanceHeaderText: 'Te acercaste antes de tiempo',
  faceDistanceMessageText: 'No te acerques mientras se conecta.',
  multipleFacesHeaderText: 'Hay varias caras',
  multipleFacesMessageText: 'Asegúrate de que solo haya una cara frente a la cámara.',
  clientHeaderText: 'Error en el dispositivo',
  clientMessageText: 'La verificación falló por un problema en este dispositivo.',
  serverHeaderText: 'Error del servidor',
  serverMessageText: 'No se pudo completar la verificación por un problema del servidor.',
  landscapeHeaderText: 'Pon el celular vertical',
  landscapeMessageText: 'Gira el dispositivo a posición vertical.',
  portraitMessageText: 'Mantén el dispositivo vertical durante toda la verificación.',
  tryAgainText: 'Intentar de nuevo',
};

export const erroresLiveness: Record<string, string> = {
  CONNECTION_TIMEOUT: 'La conexión con AWS tardó demasiado. Revisa el internet e intenta de nuevo.',
  TIMEOUT: 'Se acabó el tiempo: la cara no llenó el óvalo a tiempo.',
  FRESHNESS_TIMEOUT: 'No se pudo completar la verificación a tiempo. Intenta de nuevo.',
  RUNTIME_ERROR: 'Ocurrió un error en el navegador durante la verificación.',
  SERVER_ERROR: 'AWS respondió con un error. Puede ser un problema de permisos o de llaves.',
  CAMERA_FRAMERATE_ERROR: 'La cámara de este dispositivo es muy lenta para la verificación.',
  CAMERA_ACCESS_ERROR: 'No hay permiso para usar la cámara. Actívalo en el navegador.',
  FACE_DISTANCE_ERROR: 'Te acercaste antes de tiempo. Empieza a la distancia normal.',
  MOBILE_LANDSCAPE_ERROR: 'Pon el celular en posición vertical.',
  MULTIPLE_FACES_ERROR: 'Se detectó más de una cara.',
  DEFAULT_CAMERA_NOT_FOUND_ERROR: 'No se encontró una cámara.',
};

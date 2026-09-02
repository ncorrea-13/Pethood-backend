/**
 * Salida del listado de conversaciones (HU-5.1).
 *
 * El módulo no tiene schemas de entrada: el endpoint no recibe body ni query params, y el
 * único dato que necesita —quién pregunta— sale del token. Si HU-5.3 (búsqueda por nombre
 * de contacto) agrega un query param, su schema Zod se compone acá.
 */

/**
 * El otro lado de la conversación, YA RESUELTO por el backend.
 *
 * El cliente no tiene que averiguar cuál de los dos participantes es "el otro" ni si es una
 * persona o un refugio: recibe nombre e imagen listos para pintar la fila.
 */
export interface ContactoChatDto {
  /**
   * DERIVADO por el backend, no es `chat_tipo`: sale de si el chat tiene refugio y de si
   * quien mira pertenece a ese refugio. `chat_tipo` no se lee — sus valores no están
   * definidos en MODELO_DATOS.md.
   */
  tipo: 'USUARIO' | 'REFUGIO';
  /** Id del Usuario o del Refugio según `tipo`. NO es el id del chat. */
  id: number;
  /** "Nombre Apellido" si es un usuario, la razón social si es un refugio. */
  nombre: string;
  imagenUrl: string | null;
  /**
   * `false` si la cuenta del contacto está dada de baja. El chat se muestra igual: el
   * placeholder ("cuenta dada de baja", grisado, input deshabilitado) lo decide el cliente,
   * el backend manda el hecho y no el texto.
   */
  activo: boolean;
}

/** Vista previa del último mensaje. `null` si la sala todavía no tiene ninguno. */
export interface UltimoMensajeDto {
  /** Sin truncar: el recorte visual es del cliente. */
  contenido: string;
  /** ISO 8601 crudo. El "hace 5 min" lo formatea el cliente. */
  fecha: string;
  /** Para el prefijo "Vos: ..." sin que el cliente compare ids. */
  esMio: boolean;
  /** Un mensaje puede ser sólo foto: sin esto el preview quedaría vacío. */
  tieneImagen: boolean;
}

/**
 * Una fila de la lista de chats (GUI-08 / GUI-31).
 *
 * La forma está pensada para que sea también el payload de un evento de websocket
 * "llegó un mensaje nuevo" (HU-5.2): es autocontenida, `chatId` es un identificador estable
 * y `noLeidos` es un número absoluto, no un delta. Así el cliente reemplaza el ítem entero
 * y reordena en memoria, sin refetch del listado.
 */
export interface ConversacionDto {
  chatId: number;
  contacto: ContactoChatDto;
  ultimoMensaje: UltimoMensajeDto | null;
  /** Mensajes del chat que el usuario autenticado no emitió y todavía no leyó. */
  noLeidos: number;
  /**
   * Clave de orden, NUNCA null: fecha del último mensaje o, si la sala está vacía, fecha de
   * creación del chat. Viaja aparte de `ultimoMensaje.fecha` para que el cliente pueda
   * reordenar sin ramificar por el caso vacío.
   */
  fechaUltimaActividad: string;
}

/**
 * `total` alimenta el badge de la pestaña Chat.
 *
 * Hoy es siempre `chats.length` porque el listado no pagina — viaja como campo aparte, igual
 * que en Favoritos, para que agregar paginación no cambie la forma del contrato y el
 * contador pueda seguir siendo el total real y no el de la página.
 */
export interface ListaChatsDto {
  total: number;
  chats: ConversacionDto[];
}

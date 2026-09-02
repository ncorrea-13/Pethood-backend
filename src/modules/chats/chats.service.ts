/**
 * Listado de conversaciones activas (HU-5.1) — GUI-08 (adoptante) y GUI-31 (refugio).
 *
 * Sólo lectura. Enviar mensajes, abrir una sala y crearla son otras HU; en particular, este
 * endpoint NUNCA marca nada como leído (eso pasa al abrir la conversación, HU-5.2).
 *
 * RENDIMIENTO: traer el último mensaje y el conteo de no leídos chat por chat sería un N+1
 * sobre una tabla sin cota. En vez de eso se hacen cuatro queries de tamaño fijo, en dos
 * tandas paralelas, y el cruce se resuelve en memoria con Maps por `chatId`. La cantidad de
 * queries no depende de cuántos chats tenga el usuario.
 *
 * No se escribe en `logAuditoria`: es una lectura, no una operación crítica.
 */
import type { ConversacionDto, ContactoChatDto, ListaChatsDto } from './chats.dto';
import * as repo from './chats.repository';
import type { UltimoMensajeFila } from './chats.repository';

type MembresiaConChat = Awaited<ReturnType<typeof repo.listarChatsActivosDeUsuario>>[number];

/** El DTO más su clave de orden como Date, para no ordenar comparando strings. */
interface FilaOrdenable {
  conversacion: ConversacionDto;
  orden: Date;
}

/**
 * Resuelve el otro lado de la conversación.
 *
 * Regla de `Chat.refugioId` (docs/api-chats.md): el refugio es la contraparte SALVO que
 * quien mira sea justamente miembro de ese refugio, en cuyo caso la contraparte es la
 * persona del otro lado. Es simétrico — el adoptante ve al refugio, el refugio ve al
 * adoptante — y sobrevive a la rotación de personal: si quien atendió se va, el adoptante
 * sigue viendo el nombre del refugio y no el de un desconocido.
 *
 * Devuelve `null` cuando no queda ningún participante activo además del usuario: la fila no
 * se puede pintar (no hay nombre ni avatar) y el service la omite.
 */
function resolverContacto(
  chat: MembresiaConChat['chat'],
  refugioDelUsuario: number | null,
): ContactoChatDto | null {
  const { refugio } = chat;

  if (refugio && refugio.id !== refugioDelUsuario) {
    return {
      tipo: 'REFUGIO',
      id: refugio.id,
      nombre: refugio.nombre,
      imagenUrl: refugio.imagenUrl,
      activo: refugio.fechaBaja === null,
    };
  }

  // `participantes` ya viene filtrado por el repository a los activos distintos de quien
  // pregunta, así que el primero ES el otro lado.
  const otro = chat.participantes[0]?.usuario;

  if (!otro) return null;

  return {
    tipo: 'USUARIO',
    id: otro.id,
    nombre: `${otro.nombre} ${otro.apellido}`,
    imagenUrl: otro.imagenUrl,
    activo: otro.fechaBaja === null,
  };
}

function aConversacion(
  membresia: MembresiaConChat,
  usuarioId: number,
  refugioDelUsuario: number | null,
  ultimos: Map<number, UltimoMensajeFila>,
  noLeidos: Map<number, number>,
): FilaOrdenable | null {
  const { chat } = membresia;
  const contacto = resolverContacto(chat, refugioDelUsuario);

  if (!contacto) return null;

  const ultimo = ultimos.get(chat.id);

  // Una sala sin mensajes se ordena por su fecha de creación: es lo último que pasó en ella.
  const orden = ultimo?.fechaAlta ?? chat.fechaAlta;

  return {
    orden,
    conversacion: {
      chatId: chat.id,
      contacto,
      ultimoMensaje: ultimo
        ? {
            contenido: ultimo.contenido,
            fecha: ultimo.fechaAlta.toISOString(),
            esMio: ultimo.usuarioId === usuarioId,
            tieneImagen: ultimo.imagenUrl !== null,
          }
        : null,
      noLeidos: noLeidos.get(chat.id) ?? 0,
      fechaUltimaActividad: orden.toISOString(),
    },
  };
}

export async function listarConversaciones(usuarioId: number): Promise<ListaChatsDto> {
  const [membresias, usuario] = await Promise.all([
    repo.listarChatsActivosDeUsuario(usuarioId),
    repo.buscarRefugioDeUsuario(usuarioId),
  ]);

  // Sin conversaciones el empty state es un estado normal de la pantalla, no un error — y
  // además evita mandar dos queries con una lista de ids vacía.
  if (membresias.length === 0) {
    return { total: 0, chats: [] };
  }

  const chatIds = membresias.map((membresia) => membresia.chatId);

  const [ultimos, conteos] = await Promise.all([
    repo.ultimoMensajePorChat(chatIds),
    repo.contarNoLeidosPorChat(usuarioId, chatIds),
  ]);

  const ultimoPorChat = new Map(ultimos.map((fila) => [fila.chatId, fila]));
  const noLeidosPorChat = new Map(conteos.map((fila) => [fila.chatId, fila._count._all]));
  const refugioDelUsuario = usuario?.refugioId ?? null;

  const filas = membresias
    .map((membresia) =>
      aConversacion(membresia, usuarioId, refugioDelUsuario, ultimoPorChat, noLeidosPorChat),
    )
    // Un chat sin contraparte activa es un dato inconsistente, no un caso de negocio: se
    // omite en vez de romper la pantalla entera, igual que en el listado de favoritos.
    .filter((fila): fila is FilaOrdenable => fila !== null);

  filas.sort((a, b) => b.orden.getTime() - a.orden.getTime());

  const chats = filas.map((fila) => fila.conversacion);

  // El total sale de la misma lista ya filtrada, para que el badge de la pestaña no pueda
  // discrepar de lo que se ve en el listado.
  return { total: chats.length, chats };
}

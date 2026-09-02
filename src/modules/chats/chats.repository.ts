/**
 * Acceso a datos del listado de conversaciones (HU-5.1).
 *
 * Todo el módulo es de SOLO LECTURA: marcar mensajes como leídos es de HU-5.2 y crear salas
 * es de la HU de creación. Acá no se escribe nada, así que no hay helpers de auditoría.
 *
 * El listado resuelve el último mensaje y el conteo de no leídos de TODOS los chats con dos
 * queries fijas, no una por chat: ver `ultimoMensajePorChat` y `contarNoLeidosPorChat`.
 */
import { Prisma } from '@prisma/client';
import { prisma } from '../../shared/prisma';

/**
 * Salas donde el usuario es participante ACTIVO, con el refugio y el otro participante.
 *
 * Los dos filtros de baja son los que definen qué ve el usuario:
 * - `fechaBaja: null` sobre UsuarioChat — lo sacaron de la sala, no la ve más.
 * - `chat: { fechaBaja: null }` — la sala entera fue dada de baja.
 *
 * `participantes` viene filtrado a los activos distintos de quien pregunta: eso ES "el otro
 * lado", y así el service no tiene que volver a filtrarse a sí mismo. Se traen las fechas de
 * baja de Usuario y Refugio porque una cuenta dada de baja NO oculta el chat, sólo marca el
 * contacto como inactivo.
 */
export function listarChatsActivosDeUsuario(usuarioId: number) {
  return prisma.usuarioChat.findMany({
    where: {
      usuarioId,
      fechaBaja: null,
      chat: { fechaBaja: null },
    },
    include: {
      chat: {
        include: {
          refugio: { select: { id: true, nombre: true, imagenUrl: true, fechaBaja: true } },
          participantes: {
            where: { fechaBaja: null, usuarioId: { not: usuarioId } },
            include: {
              usuario: {
                select: {
                  id: true,
                  nombre: true,
                  apellido: true,
                  imagenUrl: true,
                  fechaBaja: true,
                },
              },
            },
            orderBy: { fechaAlta: 'asc' },
          },
        },
      },
    },
  });
}

/**
 * Refugio al que pertenece quien pregunta, o `null` si es un adoptante.
 *
 * Hace falta para saber de qué lado del mostrador está: en un chat con refugio, el adoptante
 * ve al refugio y el miembro del refugio ve al adoptante.
 */
export function buscarRefugioDeUsuario(usuarioId: number) {
  return prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: { refugioId: true },
  });
}

/** Fila cruda del último mensaje de un chat. */
export interface UltimoMensajeFila {
  chatId: number;
  contenido: string;
  usuarioId: number;
  imagenUrl: string | null;
  fechaAlta: Date;
}

/**
 * El último mensaje de CADA chat, en una sola query.
 *
 * Es el único `$queryRaw` del proyecto y es deliberado: Prisma no sabe hacer
 * greatest-n-per-group, y las alternativas (un `groupBy` con `_max` más una segunda query
 * con un OR de pares chat/fecha) son más frágiles ante empates de timestamp. La forma
 * natural en Postgres es `DISTINCT ON`, que además cae directo sobre
 * `mensaje_chat_fecha_alta_idx`.
 *
 * El desempate por `mensaje_id DESC` es para que dos mensajes con la misma marca de tiempo
 * al milisegundo no devuelvan una fila distinta en cada corrida.
 *
 * Los ids van parametrizados con `Prisma.join`, nunca interpolados en el string.
 */
export function ultimoMensajePorChat(chatIds: number[]): Promise<UltimoMensajeFila[]> {
  // `IN ()` vacío no es SQL válido. El service ya corta antes, esto es el cinturón.
  if (chatIds.length === 0) return Promise.resolve([]);

  return prisma.$queryRaw<UltimoMensajeFila[]>`
    SELECT DISTINCT ON (m."chat_id")
           m."chat_id"            AS "chatId",
           m."mensaje_contenido"  AS "contenido",
           m."usuario_id"         AS "usuarioId",
           m."mensaje_imagen_url" AS "imagenUrl",
           m."mensaje_fecha_alta" AS "fechaAlta"
      FROM "mensaje" m
     WHERE m."chat_id" IN (${Prisma.join(chatIds)})
     ORDER BY m."chat_id", m."mensaje_fecha_alta" DESC, m."mensaje_id" DESC
  `;
}

/**
 * Mensajes no leídos por chat, en una sola query.
 *
 * No leído "para mí" = del chat, que no emití yo, con `leido = false`. `mensaje_leido` es un
 * booleano único por mensaje y no por participante: alcanza para una sala de dos porque el
 * único que puede leer un mensaje es el que no lo mandó. Excluir los propios es
 * imprescindible o el badge contaría los mensajes salientes del usuario.
 *
 * Los chats sin mensajes no leídos simplemente no aparecen en el resultado: el service
 * los completa con 0.
 */
export function contarNoLeidosPorChat(usuarioId: number, chatIds: number[]) {
  if (chatIds.length === 0) return Promise.resolve([]);

  return prisma.mensaje.groupBy({
    by: ['chatId'],
    where: {
      chatId: { in: chatIds },
      leido: false,
      usuarioId: { not: usuarioId },
    },
    _count: { _all: true },
  });
}

/**
 * Entrada y salida de Solicitud para HU-7.4 (resolver) y HU-7.5 (listado/detalle recibidos
 * por el refugio). Las reglas genéricas salen de `shared/validation`; acá solo se compone
 * lo propio de Solicitud.
 */
import { z } from 'zod';
import { LIMITES } from '../../shared/validation/limits';
import { idSchema, textoOpcionalSchema } from '../../shared/validation/schemas';

/** El refugio solo puede llevar una solicitud "Pendiente" a uno de estos dos destinos. */
export const ESTADOS_RESOLUCION = ['Aprobada', 'Rechazada'] as const;

export const resolverSolicitudSchema = z.object({
  estado: z.enum(ESTADOS_RESOLUCION, {
    required_error: 'El estado es obligatorio',
    invalid_type_error: 'El estado no es válido',
  }),
  comentario: textoOpcionalSchema({
    ...LIMITES.solicitud.comentario,
    etiqueta: 'El comentario',
  }),
});

export type ResolverSolicitudDto = z.infer<typeof resolverSolicitudSchema>;

/** Nombres reales del catálogo EstadoSolicitud (prisma/seed.ts). */
export const NOMBRES_ESTADO_SOLICITUD = [
  'Pendiente',
  'En_Revision',
  'Aprobada',
  'Rechazada',
  'Cancelada',
] as const;

export const filtrosRecibidasSchema = z.object({
  estado: z.enum(NOMBRES_ESTADO_SOLICITUD).optional(),
  limite: z.coerce.number().int().positive().max(50).optional().default(20),
  desplazamiento: z.coerce.number().int().min(0).optional().default(0),
});

export type FiltrosRecibidasDto = z.infer<typeof filtrosRecibidasSchema>;

export const idSolicitudSchema = idSchema('El id de la solicitud');

export interface SolicitudResumenDto {
  id: number;
  publicacionId: number;
  mascota: { id: number; nombre: string | null; imagenUrl: string | null };
  solicitante: { id: number; nombre: string; apellido: string };
  tipoSolicitud: string;
  estado: { id: number; nombre: string };
  comentario: string | null;
  fechaAlta: string;
  fechaRespuesta: string | null;
}

/** Una fila del histórico de HU-7.5, ordenado del estado más reciente al más viejo. */
export interface EstadoSolicitudDto {
  id: number;
  nombre: string;
  fecha: string;
}

export interface SolicitudDetalleDto extends SolicitudResumenDto {
  motivacion: string;
  historial: EstadoSolicitudDto[];
}

export interface ListaSolicitudesRecibidasDto {
  /** Total que matchea el filtro, no el largo de esta página. */
  total: number;
  solicitudes: SolicitudResumenDto[];
}

# Spec 003 — Adopción y Favoritos

**Estado:** BORRADOR
**Sprint:** 3 · **Responsable:** (asignar) · **Última actualización:** 2026-09-02

## 1. Objetivo

Permitir que un adoptante solicite adoptar una mascota publicada y guarde publicaciones en favoritos, y que el refugio gestione las solicitudes que recibe sobre sus mascotas.

## 2. Alcance

- **Incluye:** favoritos (alta/baja/listado, HU-6.6 y HU-7.2 — **ya implementado**, ver `src/modules/favoritos/`), y del lado Solicitud: crear solicitud (HU-7.1), historial propio del adoptante (HU-7.3), que quien publicó la mascota la acepte/rechace (HU-7.4), su historial recibido (HU-7.5), cancelación automática por vencimiento (HU-7.6) y el feed de solicitudes del adoptante (HU-7.7).
- **Implementado en este PR:** HU-7.4, HU-7.5 y HU-7.6. HU-7.1/7.3/7.7 quedan documentadas como contrato pendiente, sin ruta todavía.
- **NO incluye:** notificaciones al aceptar/rechazar (spec 004, Chat y Notificaciones), seguimiento post-adopción (spec 006).

## 3. Entidades involucradas

`Solicitud`, `Solicitud_Estado` (histórico), `Estado_Solicitud`, `Tipo_Solicitud`, `Publicacion`, `Favorito` — ver `MODELO_DATOS.md`. Nombres reales de `Estado_Solicitud` (seedeados en `prisma/seed.ts`): `Pendiente, En_Revision, Aprobada, Rechazada, Cancelada`. `Tipo_Solicitud`: `Adopcion` y `Transito`, ambos con `secuenciaDias = 180` (ventana de la cancelación automática de HU-7.6).

## 4. API

| Método | Ruta | Auth | Descripción | Estado |
|---|---|---|---|---|
| POST | /api/v1/favoritos | JWT | Guarda una mascota en favoritos (HU-7.2) | implementado |
| GET | /api/v1/favoritos | JWT | Lista favoritos del adoptante (HU-6.6) | implementado |
| DELETE | /api/v1/favoritos/:mascotaId | JWT | Quita de favoritos | implementado |
| POST | /api/v1/solicitudes | JWT (Adoptante) | Crea una solicitud sobre una publicación (HU-7.1) | pendiente |
| GET | /api/v1/solicitudes/mias | JWT (Adoptante) | Historial propio de solicitudes (HU-7.3) | pendiente |
| GET | /api/v1/solicitudes/recibidas | JWT (quien publicó la mascota) | Solicitudes que el actor puede gestionar, filtro `?estado=` (HU-7.5) | **implementado** |
| GET | /api/v1/solicitudes/:id | JWT (quien publicó la mascota) | Detalle de una solicitud con el histórico completo de estados (HU-7.5) | **implementado** |
| PATCH | /api/v1/solicitudes/:id/estado | JWT (quien publicó la mascota) | Acepta o rechaza una solicitud "Pendiente" (HU-7.4) | **implementado** |
| — | cron `cancelar-solicitudes-vencidas.job.ts` | usuario SISTEMA | Baja lógica de solicitudes "Pendiente" con más de `tipoSolicitud.secuenciaDias` días desde que entraron en ese estado (HU-7.6) | **implementado** |

Ejemplo, aceptar una solicitud:

```json
PATCH /api/v1/solicitudes/12/estado
{ "estado": "Aprobada", "comentario": "Bienvenido a la familia" }
→ 200 {
  "id": 12, "publicacionId": 5,
  "mascota": { "id": 5, "nombre": "Toby", "imagenUrl": "..." },
  "solicitante": { "id": 3, "nombre": "Ana", "apellido": "Pérez" },
  "tipoSolicitud": "Adopcion",
  "estado": { "id": 3, "nombre": "Aprobada" },
  "comentario": "Bienvenido a la familia",
  "motivacion": "...",
  "fechaAlta": "2026-08-20T12:00:00.000Z",
  "fechaRespuesta": "2026-09-02T18:00:00.000Z",
  "historial": [
    { "id": 3, "nombre": "Aprobada", "fecha": "2026-09-02T18:00:00.000Z" },
    { "id": 1, "nombre": "Pendiente", "fecha": "2026-08-20T12:00:00.000Z" }
  ]
}
```

Ejemplo, listar recibidas:

```json
GET /api/v1/solicitudes/recibidas?estado=Pendiente&limite=20&desplazamiento=0
→ 200 { "total": 1, "solicitudes": [ { "id": 12, "estado": { "id": 1, "nombre": "Pendiente" }, ... } ] }
```

Errores: `400 VALIDACION`, `404 NO_ENCONTRADO` (no existe O no es una solicitud que el actor pueda gestionar — mismo código para no filtrar si existe), `409 SOLICITUD_YA_RESUELTA` (no está en "Pendiente", incluye la carrera de dos PATCH concurrentes).

## 5. Pantallas (frontend)

Fuera de alcance de este PR (backend-only). Referencia: bandeja de "Solicitudes recibidas" del refugio con lista filtrable por estado y detalle con línea de tiempo del histórico.

## 6. Reglas de negocio y validaciones

1. Solo se puede resolver (aceptar/rechazar) una solicitud en estado vigente `Pendiente`; cualquier otro estado devuelve `409 SOLICITUD_YA_RESUELTA`.
2. "Quien publicó la mascota" no es siempre un refugio: un adoptante particular también puede ofrecer una mascota propia en adopción (`mascotas.dto.ts`, actor `ADOPTANTE` + destino `ADOPCION`). La autorización se resuelve por actor, no por rol fijo:
   - mascota de refugio (`mascota.refugioId` no nulo) → cualquier miembro de ESE refugio, sin importar quién la cargó — mismo criterio que el ámbito "REFUGIO" de `mascotas.repository.listarPorAmbito` y el dashboard de refugio (decisión de equipo: la resolución es organizacional, no personal de quien publicó).
   - mascota personal (`refugioId` nulo) → solo quien la publicó (`mascota.usuarioId`).
3. Ver o resolver una solicitud que no es del actor devuelve `404 NO_ENCONTRADO`, igual que si no existiera — no se distingue "no es tuya" de "no existe" (mismo criterio que `favoritos.service.ts` con los favoritos de otro usuario).
4. Resolver una solicitud es atómico (transacción `Serializable`): revalida que siga "Pendiente" en el mismo momento de escribir, así dos PATCH concurrentes sobre la misma solicitud no pueden pisarse — el que pierde la carrera recibe `409` en vez de dejar el histórico inconsistente.
5. Resolver una solicitud escribe en `LogAuditoria` (acción `APROBAR`/`RECHAZAR`, detalle `"<estado anterior> -> <estado nuevo>"`).
6. Máximo 5 solicitudes "Pendiente" simultáneas por adoptante (regla transversal 7 de `AGENTS.md`) — se valida al crear (HU-7.1), no implementado todavía.
7. Cancelación automática (HU-7.6): más de `tipoSolicitud.secuenciaDias` días desde que la solicitud entró en "Pendiente" (no desde `solicitud.fechaAlta` si en algún momento pasó por otro estado intermedio) → baja lógica con `usuario_baja = "SISTEMA"` y nuevo estado "Cancelada" en el histórico. Corre por `cancelarSiPendiente`, con la misma revalidación atómica (transacción `Serializable`) que HU-7.4: si un humano resuelve la solicitud en el instante entre que el cron la lee y la cancela, el cron no pisa esa resolución.

## 7. Criterios de aceptación

- [x] Quien publicó la mascota puede listar las solicitudes que recibió.
- [x] Puede filtrar ese listado por estado.
- [x] Puede ver el detalle de una solicitud con el histórico completo de estados.
- [x] Puede aceptar una solicitud "Pendiente" con un comentario opcional.
- [x] Puede rechazar una solicitud "Pendiente" con un comentario opcional.
- [x] Intentar resolver una solicitud ya resuelta devuelve `409 SOLICITUD_YA_RESUELTA`.
- [x] Un miembro de otro refugio no puede ver ni resolver una solicitud que no es de su refugio (`404`).
- [x] Un adoptante particular puede gestionar las solicitudes de su propia mascota publicada, aunque no pertenezca a ningún refugio.
- [x] Un adoptante no puede ver ni resolver la solicitud de OTRO adoptante sobre una mascota que no es suya (`404`).
- [x] Dos PATCH concurrentes sobre la misma solicitud no corrompen el histórico: uno gana, el otro recibe `409`.
- [x] Una solicitud "Pendiente" con más días que `tipoSolicitud.secuenciaDias` se cancela sola vía el cron, con `usuario_baja = "SISTEMA"`.
- [x] El cron respeta `secuenciaDias` por tipo (no un valor fijo de 180 hardcodeado).
- [x] El cron no cancela una solicitud que un humano ya resolvió (`En_Revision`, `Aprobada`, `Rechazada`).
- [ ] Un adoptante puede crear una solicitud sobre una publicación (HU-7.1, pendiente).

## 8. Casos borde y errores

Solicitud de un refugio/adoptante ajeno (`404`, indistinguible de "no existe" para no filtrar información) · doble PATCH concurrente sobre la misma solicitud (conflicto de serialización de Postgres, el que pierde recibe `409`) · comentario vacío (válido, es opcional) · usuario sin ninguna mascota publicada pidiendo `/recibidas` (lista vacía, no error) · el cron corre dos veces seguidas sobre la misma solicitud vencida (idempotente: la segunda vez ya tiene `fechaBaja` y no vuelve a aparecer en `listarSinRespuesta`).

## 9. Notas y decisiones

- 2026-09-02: spec inicial, escrita junto con la implementación de HU-7.4/7.5 (backend). El nombre del estado de aceptación en el catálogo es `Aprobada`, no "Aceptada". Fixtures de prueba en `prisma/seed-solicitudes.ts`. HU-7.1/7.3/7.6/7.7 quedan documentadas como contrato pendiente para un PR siguiente.
- 2026-09-02: corregido el alcance para cubrir también al adoptante particular que publica su propia mascota (no solo refugios) — se había pasado por alto en la primera pasada. Autoridad de refugio confirmada como organizacional (cualquier miembro, no solo quien cargó la mascota). Se agregó revalidación atómica del estado (transacción `Serializable`) para cerrar una carrera entre dos PATCH concurrentes que la primera versión no contemplaba.
- 2026-09-02: HU-7.6 implementada. `src/jobs/cancelar-solicitudes-vencidas.job.ts`, función pura + entrypoint CLI (`require.main === module`), pensado para invocarse desde crontab/systemd timer del sistema operativo — no hay scheduler embebido en el proceso Node (ver razones en la conversación de planificación: sin orquestador en `docker-compose.yml`, `node-cron` sumaría una dependencia y un riesgo de doble ejecución si el server escala a más de una instancia). Reusa el mismo patrón de transacción `Serializable` que `resolverSiPendiente` (`solicitudes.repository.ts` → `cancelarSiPendiente`) para no pisar una resolución humana concurrente. Probado con datos reales: una solicitud vencida ad-hoc (200 días) se canceló correctamente (baja lógica + estado "Cancelada" + entrada en `LogAuditoria`), y una segunda corrida del job no la vuelve a tocar (idempotente).

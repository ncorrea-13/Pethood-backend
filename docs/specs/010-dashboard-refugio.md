# Spec 010 — Dashboard Refugio (HU-14.2)

**Estado:** APROBADA
**Sprint:** 12 (Fase 12, construida en paralelo sobre datos de prueba — igual criterio que spec 009) · **Responsable:** nachocastro123@gmail.com · **Última actualización:** 2026-08-24

## 1. Objetivo

Darle a un usuario con rol Refugio una vista agregada de la actividad de **su propio refugio** (mascotas, solicitudes, donaciones) para un período mensual elegido, y permitirle exportar esos datos a CSV. Mismo patrón de agregación que spec 009 (Dashboard Admin), scopeado a `refugioId`.

## 2. Alcance

- **Incluye:** HU-14.2 (dashboard estadístico de gestión interna, rol Refugio), exportación CSV para el rol Refugio (parte de HU-14.3 que spec 009 dejó fuera).
- **NO incluye:** moderación/verificación de refugios (spec 008); dashboard admin (ya cubierto por spec 009); ningún campo o entidad nueva en el modelo de datos.
- Spec 009 §2 dejaba esto explícitamente pendiente: "dashboard de gestión interna del Refugio — spec propia a futuro, mismo patrón de agregación pero scopeado a `refugioId`". Esta spec lo resuelve.

## 3. Origen del contrato

El frontend (`pethood-frontend/apps/web-admin`, páginas `app/refugio/dashboard/`) ya tenía esta pantalla construida contra un contrato **propuesto** (comentario en `types/dashboard.ts` y `services/dashboard.ts`: "Contrato PROPUESTO, no una spec aprobada"). Esta spec adopta ese contrato tal cual estaba armado en el front (ya revisado y es el que se implementa), para no tener dos fuentes de verdad divergentes.

## 4. Entidades involucradas

Ninguna nueva — vistas de solo lectura sobre `Usuario`, `Refugio`, `Mascota`, `MascotaEstado`, `Publicacion`, `Solicitud`, `SolicitudEstado`, `Campania`, `Donacion` y catálogos `Estado*` (ver MODELO_DATOS.md). No se agregan columnas ni tablas.

**Decisión — `refugio.localidad`:** el frontend espera `{ refugio: { nombre, localidad } }`. El modelo `Refugio` no tiene un campo `localidad` separado (solo `refugio_direccion`, texto libre — confirmado en MODELO_DATOS.md línea 51). No se agrega columna nueva para no invadir el modelo de datos por una sola pantalla: `localidad` en la respuesta es `Refugio.direccion` tal cual está guardado. Si en el futuro se normaliza un catálogo geográfico (spec 009 §3 ya señaló el mismo gap para `Publicacion.ubicacion`), se revisa junto con esa decisión.

**Scoping por refugio:** el usuario autenticado debe tener `Usuario.refugioId` asignado (igual precondición que `mascotas.service.ts` al crear una mascota como refugio). Si no lo tiene → `403 SIN_REFUGIO`.

**"Animales en el refugio"** es una foto del estado actual (no depende del período elegido, igual criterio que los KPIs de spec 009 que son snapshot mientras solo la serie mensual usa ventana de tiempo): mascotas del refugio cuyo estado vigente (`MascotaEstado` sin baja, más reciente) es `Disponible`, `En_Tratamiento` o `En_Transito` (no `Adoptado` ni `Fallecido`).

**"Objetivo de donaciones"** = suma de `Campania.objetivo` de las campañas **activas** del refugio (estado `Activa`, sin baja). Es el mismo valor para cada mes en `donacionesPorMes.objetivo` (se dibuja como línea de referencia constante, no una meta mensual distinta por mes) — no hay en el modelo un objetivo mensual desglosado.

## 5. API (contrato backend)

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | /api/v1/refugio/dashboard?desde=YYYY-MM&hasta=YYYY-MM | JWT, rol Refugio | Métricas agregadas del refugio del usuario autenticado, para el rango de meses dado |
| GET | /api/v1/refugio/dashboard/exportar?desde=YYYY-MM&hasta=YYYY-MM | JWT, rol Refugio | CSV de las solicitudes recibidas por el refugio en el período, generado por streams |

`desde`/`hasta` son meses calendario en formato `YYYY-MM` (igual formato que produce `<input type="month">` en el front), inclusive en ambos extremos. Si faltan, están mal formados, o `desde > hasta` → `400 PERIODO_INVALIDO`.

Ejemplo (shape real, respuesta plana sin envelope):

```json
GET /api/v1/refugio/dashboard?desde=2026-03&hasta=2026-08
→ 200 {
  "refugio": { "nombre": "Refugio Patitas", "localidad": "Av. Siempre Viva 123, Mendoza" },
  "periodo": { "desde": "2026-03", "hasta": "2026-08" },
  "kpis": {
    "animalesAdoptados": 12,
    "solicitudesCreadas": 30,
    "animalesEnRefugio": 18,
    "montoDonado": 45000.00,
    "objetivoDonaciones": 100000.00
  },
  "solicitudesPorEstado": [
    { "estado": "Pendiente", "cantidad": 5, "porcentaje": 16.7 },
    { "estado": "En_Revision", "cantidad": 2, "porcentaje": 6.7 },
    { "estado": "Aprobada", "cantidad": 12, "porcentaje": 40.0 },
    { "estado": "Rechazada", "cantidad": 8, "porcentaje": 26.7 },
    { "estado": "Cancelada", "cantidad": 3, "porcentaje": 10.0 }
  ],
  "donacionesPorMes": [
    { "mes": "Mar 2026", "monto": 5000, "objetivo": 100000 },
    { "mes": "Abr 2026", "monto": 8000, "objetivo": 100000 },
    { "mes": "May 2026", "monto": 12000, "objetivo": 100000 },
    { "mes": "Jun 2026", "monto": 4000, "objetivo": 100000 },
    { "mes": "Jul 2026", "monto": 9000, "objetivo": 100000 },
    { "mes": "Ago 2026", "monto": 7000, "objetivo": 100000 }
  ]
}
```

`animalesAdoptados` = cantidad de `Solicitud` del refugio cuyo estado vigente es `Aprobada` **con fecha de ese cambio de estado dentro del período** (misma fuente que `solicitudesPorEstado`, no un conteo aparte — igual criterio que `adopcionesConcretadas` en spec 009). `solicitudesCreadas` y `solicitudesPorEstado` cuentan solicitudes cuya `fechaAlta` cae en el período. `montoDonado` = suma de `Donacion.monto` con `fechaAlta` en el período ("declarado", mismo gap documentado en spec 009 §3 — `Donacion` no tiene campo de confirmación).

```
GET /api/v1/refugio/dashboard/exportar?desde=2026-03&hasta=2026-08
→ 200, Content-Type: text/csv, streamed
```

CSV: una fila por `Solicitud` recibida por el refugio en el período (columnas: `id, mascota, tipoSolicitud, estado, fechaAlta`), streamed por cursor igual que spec 009 §6.4. No es por-entidad como en admin: el refugio exporta un único reporte consolidado del período.

Errores: `403 { error: { codigo: "ROL_NO_AUTORIZADO", ... } }` si no es Refugio. `403 { error: { codigo: "SIN_REFUGIO", ... } }` si el usuario Refugio no tiene `refugioId` asignado. `400 { error: { codigo: "PERIODO_INVALIDO", ... } }` si el rango de meses es inválido.

## 6. Pantallas (frontend)

- GUI-38 Dashboard Refugio — solo **web-admin**, ya construida (`app/refugio/dashboard/page.tsx`, `components/dashboard/DonacionesChart.tsx`, `PeriodoSelector.tsx`, `ExportacionRefugio.tsx`).
- Reutiliza GUI-40 (vacío) y GUI-41 (error de exportación) de spec 009.

## 7. Reglas de negocio y validaciones

1. Solo rol Refugio accede, y solo ve datos de su propio `refugioId` (nunca recibe `refugioId` como parámetro del cliente — se resuelve del JWT vía `Usuario.refugioId`).
2. Los conteos excluyen bajas lógicas (`fechaBaja IS NULL`).
3. `donacion.monto` se reporta como "declarado", igual gap que spec 009 §3.
4. Export siempre por streams (regla transversal #12).
5. El `service.ts` de este módulo solo lee — sin reglas de auditoría de alta/baja propias.

## 8. Criterios de aceptación

- [ ] Given soy usuario Refugio autenticado con `refugioId` asignado, When pido `GET /refugio/dashboard?desde=...&hasta=...`, Then recibo métricas que solo incluyen datos de mi refugio.
- [ ] Given soy Adoptante o Administrador, When pido `GET /refugio/dashboard`, Then recibo 403 `ROL_NO_AUTORIZADO`.
- [ ] Given soy Refugio sin `refugioId` asignado, When pido el dashboard, Then recibo 403 `SIN_REFUGIO`.
- [ ] Given mi refugio no tiene datos operativos en el período, When pido el dashboard, Then los KPIs son 0 (no error) — habilita GUI-40.
- [ ] Given pido `desde`/`hasta` inválidos o `desde > hasta`, When llamo el endpoint, Then recibo 400 `PERIODO_INVALIDO`.
- [ ] Given pido exportar, When la descarga corre, Then el CSV tiene headers correctos y solo filas de solicitudes de mi refugio en el período, sin cargar el dataset completo en memoria.

## 9. Casos borde y errores

- Refugio sin datos en el período → KPIs en 0, export con solo headers.
- Rol insuficiente → 403, sin filtrar info parcial de otro refugio.
- Período mal formado → 400.

## 10. Notas y decisiones

- 2026-08-24: fixtures de prueba en `prisma/seed-dashboard-refugio.ts` (separado de `prisma/seed.ts` por el mismo motivo que `prisma/seed-dashboard-admin.ts` en spec 009 — no se corre automáticamente, se ejecuta a mano después de `npm run seed`). El seed de dashboard admin existente se renombró de `seed-dashboard.ts` a `seed-dashboard-admin.ts` para dejar claro a qué rol pertenecen los fixtures de cada archivo.

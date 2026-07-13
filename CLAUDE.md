# PETHOOD Backend — API REST

Express + TypeScript + PostgreSQL + Prisma. Sirve a la app mobile (Expo) y al panel admin (Next.js), ambos en el repo hermano `pethood-frontend`.

## Qué es PetHood

Plataforma híbrida de gestión de adopción de mascotas que conecta **adoptantes**, **refugios/protectoras** y un **administrador global**: publicación de mascotas, solicitudes de adopción, seguimiento post-adopción, historia clínica, chat, reputación, campañas de donación y mascotas perdidas/encontradas. Proyecto final académico (UTN Regional Mendoza, Ingeniería en Sistemas, Grupo N°09), basado en la Etapa 5 (relevamiento e ingeniería de requisitos) y el diagrama de clases del grupo.

## Documentos rectores (en `./docs/` de este repo)

- `docs/CONSTITUTION.md` — principios no negociables del proyecto.
- `docs/REQUISITOS.md` — requisitos funcionales y transversales, HUs por módulo, reglas de negocio. Su sección 10 lista ambigüedades del documento fuente todavía sin resolver — no asumir una interpretación silenciosa.
- `docs/MODELO_DATOS.md` — entidades, atributos, relaciones y cardinalidades. Fuente de verdad de nombres de campo.
- `docs/ROADMAP.md` — plan de desarrollo por fases y dependencias entre módulos.
- `docs/ARQUITECTURA.md` — árbol de directorios de este repo y de `pethood-frontend`, convención de branches.
- `docs/specs/` — una spec aprobada por módulo antes de codificarlo.

**Antes de cualquier modificación, releer `docs/ARQUITECTURA.md`, `docs/ROADMAP.md` y `docs/CONSTITUTION.md`** — definen cómo se organiza el código, en qué orden se construye y qué reglas son innegociables.

## Arquitectura general del proyecto

Dos frontends distintos consumiendo **una única API REST** de este backend. El frontend vive en el repo hermano `pethood-frontend`, organizado como monorepo:

| Capa | Tecnología | Destinatarios | Ubicación |
|---|---|---|---|
| App móvil híbrida | React Native + Expo | Adoptantes, rescatistas, personal de refugios en campo | `pethood-frontend/apps/mobile/` |
| Panel web de escritorio | Next.js + Tailwind CSS | Administradores globales y refugios verificados (dashboards, moderación, exportación) | `pethood-frontend/apps/web-admin/` |
| Tipos/API/validaciones comunes | TypeScript compartido | — | `pethood-frontend/packages/shared/` |
| API REST | Express + TypeScript | — | este repo |
| Base de datos | PostgreSQL | — | este repo |

**Por qué esta separación:** la app usa cámara nativa (seguimiento post-adopción, "pruebas de vida") y es mobile-first para uso en campo. El panel de escritorio necesita alta densidad de información para dashboards, moderación y exportación masiva a CSV.

**Geolocalización:** se capturan coordenadas (`animal_perdido_latitud`/`longitud` al reportar una mascota perdida/encontrada) pero **no hay mapa interactivo en la UI**. El usuario busca y filtra por ubicación administrativa (Provincia/Localidad), no por mapa. No integrar ningún SDK de mapas — ver `docs/MODELO_DATOS.md` y `docs/REQUISITOS.md` sección 10.

**Hogares de tránsito:** no es un módulo autónomo — sus necesidades quedan cubiertas dentro de Adopción y Reputación (un hogar de tránsito es un tipo de flujo dentro de Solicitud).

## Reglas transversales (aplican a backend Y frontend)

1. **Auditoría obligatoria en todas las entidades**: `usuario_alta`, `fecha_alta`, `usuario_modificacion`, `fecha_modificacion`, `usuario_baja`, `fecha_baja`. Bajas siempre lógicas, nunca DELETE físico (excepciones: `Mensaje` solo tiene alta; `Historia_Clinica` nunca se actualiza).
2. **RBAC** vía middleware. Roles: administrador global, refugio (validado/no validado), adoptante.
3. **Sesión stateless con JWT**, sin sesiones server-side.
4. **Compresión asíncrona de imágenes** en middleware antes de persistir cualquier archivo multimedia.
5. **Validación de campos estricta**: DNI 7-8 dígitos numéricos, email con `@` y dominio, nombres solo alfabéticos, imágenes/documentos ≤5MB, fechas nunca vacías/cero/negativas.
6. **Feedback visual** (toasts, voseo rioplatense) y modales de confirmación en acciones críticas.
7. **Quotas anti-spam**: máx. 5 publicaciones activas por adoptante, máx. 5 solicitudes "Pendiente" por usuario, máx. 5 campañas activas por refugio.
8. **Historia clínica inmutable**: nunca se edita un registro persistido; baja lógica + alta de uno nuevo.
9. **Seguimiento post-adopción anti-fraude**: la foto debe venir de la cámara nativa, bloqueando galería (regla de frontend mobile, pero el backend no debe asumir que toda imagen recibida es confiable).
10. **Cron jobs** con usuario "SISTEMA": solicitudes "Pendiente" > 6 meses → baja automática; campañas "Inactiva"→"Activa" al llegar `fecha_inicio`, →"Finalizada" al llegar `fecha_fin` o alcanzar el monto objetivo.
11. **Donaciones**: el monto declarado NUNCA impacta la barra de progreso automáticamente, solo cuando el refugio confirma manualmente.
12. **CSV (import/export masivo)** siempre por streams, nunca cargar el archivo completo en memoria.

## Comandos

```bash
npm install              # dependencias
docker compose up -d     # PostgreSQL local (puerto 5432)
npx prisma migrate dev   # aplica migraciones y regenera el cliente
npm run dev              # servidor en http://localhost:3000 (hot reload)
npm run build && npm start  # producción
npm run lint             # ESLint
```

## Estructura

Patrón en capas por módulo (detalle y justificación en `docs/ARQUITECTURA.md`):

```
src/
├── server.ts            # arranque (puerto, señales)
├── app.ts               # instancia Express, middlewares globales, rutas
├── config/env.ts        # variables de entorno validadas con Zod
├── middlewares/         # auth (JWT), roles, errorHandler, validate(zod)
├── routes/index.ts      # router raíz /api/v1
├── modules/<modulo>/    # un directorio por módulo de negocio:
│   ├── <modulo>.routes.ts      # define rutas y aplica validaciones
│   ├── <modulo>.controller.ts  # HTTP puro: extrae datos, llama servicio, responde
│   ├── <modulo>.service.ts     # lógica de negocio y reglas — NUNCA accede a Prisma directamente
│   ├── <modulo>.repository.ts  # único punto de acceso a datos (Prisma) del módulo
│   └── <modulo>.dto.ts         # schemas Zod de entrada/salida
├── jobs/                # cron jobs independientes y testeables sin servidor HTTP
│   ├── cancelar-solicitudes-vencidas.job.ts   # HU-7.6
│   └── transicion-estados-campana.job.ts      # HU-12.4
├── websockets/          # infraestructura de Chat en tiempo real (HU-5.2)
└── shared/              # mixin/base de auditoría, tipos comunes, utils
tests/
├── unit/
└── integration/
prisma/schema.prisma     # fuente de verdad física del modelo
```

## Convenciones

- Rutas bajo `/api/v1`, recursos en plural en español sin tildes (`/mascotas`, `/solicitudes`).
- Errores SIEMPRE con formato `{ error: { codigo, mensaje } }` vía `errorHandler`; los servicios lanzan `AppError(codigo, mensaje, httpStatus)`.
- Toda entrada se valida con Zod (`<modulo>.dto.ts`) antes de llegar al servicio.
- `service.ts` nunca importa Prisma directamente — todo acceso a datos pasa por `repository.ts` del mismo módulo, para poder testear el service mockeando el repository.
- Reglas de negocio (quotas, transiciones de estado, chat tras interacción) viven en servicios, nunca en el controller ni solo en el frontend.
- Cron jobs en `jobs/`, testeables sin levantar el servidor HTTP.
- Operaciones críticas escriben en `LogAuditoria`.
- Prisma: modificar `schema.prisma` → `npx prisma migrate dev --name descripcion` → actualizar `docs/MODELO_DATOS.md` si cambia el modelo conceptual.
- Nunca commitear `.env`; mantener `.env.example` al día.

## Cómo trabajar con esta documentación

- Antes de tocar código de una entidad, revisar `docs/MODELO_DATOS.md` para confirmar atributos, PK/FK y cardinalidades exactas — no inventar campos.
- Antes de implementar una funcionalidad, buscar la HU en `docs/REQUISITOS.md` y respetar los criterios de aceptación literalmente (textos de error, límites de caracteres, nombres de botones) — son parte de la consigna académica evaluable.
- Si una HU es ambigua o contradictoria (ver sección 10 de `docs/REQUISITOS.md`), preguntar al equipo antes de asumir.
- Mantener la separación estricta backend/frontend: el backend no conoce detalles de UI; el frontend valida solo para UX, el backend es la fuente de verdad de las reglas de negocio.
- Si cambia algo estructural acá (modelo de datos, roadmap, convenciones), propagarlo a mano al `CLAUDE.md` de `pethood-frontend` — no quedan sincronizados automáticamente.

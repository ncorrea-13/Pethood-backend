# CONSTITUTION — PETHOOD

Principios que rigen todo el desarrollo. Cualquier cambio a este documento requiere acuerdo de todo el equipo.

## 1. Spec primero, código después

Ningún módulo se implementa sin una spec aprobada en `docs/specs/`. La spec define endpoints, pantallas, criterios de aceptación y casos borde. Si durante el desarrollo surge algo no contemplado, se actualiza la spec antes de seguir.

## 2. Alcance cerrado del MVP

Lo excluido en el anteproyecto queda excluido: sin pasarela de pagos (solo alias/CBU informativo), sin contratos digitales, sin matching algorítmico, sin CMS, sin web para adoptantes. Toda idea nueva va a un backlog post-MVP, no al sprint.

## 3. Git Flow

- `main`: solo releases estables. Nunca se commitea directo.
- `dev`: rama de integración. Se llega por Pull Request desde ramas `dev-<nombre>` o `feature/<modulo>`.
- Todo PR requiere revisión de al menos un compañero antes de mergear.
- Commits en español, formato convencional: `feat: ...`, `fix: ...`, `docs: ...`, `refactor: ...`, `test: ...`.

## 4. Seguridad (innegociable)

- Credenciales y secretos SOLO en `.env` (gitignoreado). `.env.example` siempre actualizado como plantilla.
- Contraseñas hasheadas con bcrypt. Nunca en texto plano, nunca en logs.
- Autenticación con JWT; toda ruta privada pasa por middleware de auth y control de rol.
- Validación de entrada en TODOS los endpoints (Zod) — nunca confiar en el cliente.
- Operaciones críticas registran entrada de auditoría (quién, qué, cuándo) en un **archivo de texto append-only** (carpeta `logs/`, ya gitignoreada), nunca en una tabla de la base — no existe entidad `LogAuditoria` en `prisma/schema.prisma`.

## 5. Convenciones de código

- TypeScript en modo `strict` en ambos repos. Prohibido `any` salvo justificación comentada.
- ESLint + Prettier; el código no formateado no se mergea.
- Nombres: variables/funciones en camelCase, tipos/clases en PascalCase, sin tildes ni ñ en identificadores (la UI sí muestra español correcto).
- API REST bajo `/api/v1/`, recursos en plural (`/api/v1/mascotas`), respuestas de error con formato único `{ error: { codigo, mensaje } }`.

## 6. Base de datos

- El schema vive en `prisma/schema.prisma`; la base se modifica SOLO con migraciones (`prisma migrate dev`). Nunca a mano.
- `docs/MODELO_DATOS.md` es la fuente de verdad conceptual; si el schema diverge, se actualiza el documento en el mismo PR.

## 7. Reglas de negocio siempre vigentes

- Máx. 5 solicitudes de adopción activas por adoptante (se valida en backend, no solo en UI).
- Chat habilitado solo tras interacción previa (solicitud de adopción o reporte de mascota perdida).
- Rechazar una solicitud exige motivo obligatorio.
- Estados de entidades siguen las máquinas de estado de `docs/MODELO_DATOS.md`; las transiciones inválidas se rechazan en backend.

## 8. Definición de terminado (DoD)

Una historia está terminada cuando: cumple los criterios de aceptación de su spec, tiene validaciones de backend, pasa lint, formato, build y tests (CI en GitHub Actions), fue probada manualmente en mobile, el PR fue revisado y mergeado a `dev`, y la documentación afectada está actualizada.

# Spec NNN — <Nombre del módulo>

**Estado:** BORRADOR | EN REVISIÓN | APROBADA | IMPLEMENTADA
**Sprint:** N · **Responsable:** <nombre> · **Última actualización:** AAAA-MM-DD

## 1. Objetivo

Qué problema resuelve este módulo y para qué rol. Una o dos oraciones.

## 2. Alcance

- **Incluye:** …
- **NO incluye:** … (y dónde quedará: otra spec / post-MVP)

## 3. Entidades involucradas

Referencia a MODELO_DATOS.md. Indicar solo cambios o campos nuevos que esta spec introduce.

## 4. API (contrato backend)

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | /api/v1/... | rol | … |

Para cada endpoint no trivial: body de ejemplo, respuesta de ejemplo, errores posibles (`{ error: { codigo, mensaje } }`).

## 5. Pantallas (frontend)

Por pantalla: propósito, componentes clave, validaciones inline, estados (cargando/vacío/error), navegación. Referenciar el prototipo de Figma si existe.

## 6. Reglas de negocio y validaciones

Lista numerada. Indicar dónde se valida (backend siempre; frontend además si mejora UX).

## 7. Criterios de aceptación

Formato Given/When/Then o checklist verificable. Estos criterios son los que QA prueba.

- [ ] …

## 8. Casos borde y errores

Qué pasa con datos inválidos, permisos insuficientes, estados inconsistentes, conexión perdida.

## 9. Notas y decisiones

Decisiones tomadas durante la revisión, con fecha y quién.

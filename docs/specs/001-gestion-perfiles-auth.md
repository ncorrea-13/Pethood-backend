# Spec 001 — Gestión de Perfiles y Autenticación

**Estado:** BORRADOR
**Sprint:** 1 · **Responsable:** (asignar) · **Última actualización:** 2026-07-06

## 1. Objetivo

Permitir que cualquier persona se registre como Adoptante o Refugio, inicie sesión de forma segura y gestione su perfil. Es la base de todos los demás módulos.

## 2. Alcance

- **Incluye:** registro con selector de rol, login/logout, recuperación de contraseña, edición de perfil (foto, datos, contraseña), JWT + middleware de auth y roles.
- **NO incluye:** moderación/baneos (spec 008), verificación de refugios por admin (spec 008), login social (post-MVP).

## 3. Entidades involucradas

Usuario, Rol, Usuario_Rol, Bio_Usuario, Refugio, Refugio_Miembro (ver MODELO_DATOS.md). El registro como Refugio crea el Usuario + el Refugio en estado `PEND_VERIFICACION` y lo vincula vía Refugio_Miembro.

## 4. API

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | /api/v1/auth/registro | público | Crea usuario (rol ADOPTANTE o MIEMBRO_REFUGIO + datos de refugio) |
| POST | /api/v1/auth/login | público | Devuelve JWT + datos básicos del usuario |
| POST | /api/v1/auth/logout | JWT | Invalida sesión (client-side; opcional blacklist) |
| POST | /api/v1/auth/recuperar | público | Envía email con token de reseteo |
| POST | /api/v1/auth/resetear | token | Cambia la contraseña con token válido |
| GET | /api/v1/usuarios/me | JWT | Perfil propio (incluye bio y roles) |
| PATCH | /api/v1/usuarios/me | JWT | Edita datos, bio, foto de perfil |
| PATCH | /api/v1/usuarios/me/password | JWT | Cambia contraseña (requiere la actual) |

Ejemplo registro:

```json
POST /api/v1/auth/registro
{ "nombre": "Ana", "apellido": "Pérez", "email": "ana@mail.com",
  "password": "********", "telefono": "+54 261 ...", "rol": "ADOPTANTE" }
→ 201 { "usuario": { "id": 1, "email": "...", "roles": ["ADOPTANTE"] }, "token": "..." }
```

Errores: `400 VALIDACION`, `409 EMAIL_DUPLICADO`, `401 CREDENCIALES_INVALIDAS`, `429 DEMASIADOS_INTENTOS`.

## 5. Pantallas

1. **Registro:** foto opcional, datos personales, selector de rol (Adoptante/Refugio — si Refugio, campos extra del refugio), validaciones inline (email válido, contraseña ≥ 8 con mayúscula y número, confirmación).
2. **Login:** email + contraseña, link "¿Olvidaste tu contraseña?", errores sin revelar si el email existe.
3. **Recuperación:** ingreso de email → mensaje genérico de envío.
4. **Edición de perfil:** cambio de foto, datos y contraseña; modal de confirmación al descartar cambios sin guardar.

## 6. Reglas de negocio y validaciones

1. Email único (backend, índice único + error 409).
2. Contraseña hasheada con bcrypt (costo ≥ 10); nunca viaja ni se loguea en texto plano.
3. Usuario nuevo nace `PEND_VERIFICACION`; pasa a `ACTIVO` al verificar email (si el email no se implementa en sprint 1, nace ACTIVO y se documenta la deuda).
4. Refugio nuevo nace `PEND_VERIFICACION` hasta aprobación del admin (spec 008); mientras tanto puede completar su perfil pero no publicar.
5. JWT expira (ej. 7 días); rutas privadas exigen token válido; rutas de refugio exigen rol MIEMBRO_REFUGIO.
6. Registro y cambios de contraseña generan entrada en LogAuditoria.

## 7. Criterios de aceptación

- [ ] Puedo registrarme como adoptante y quedo logueado (token recibido).
- [ ] Puedo registrarme como refugio y se crea el refugio en PEND_VERIFICACION.
- [ ] No puedo registrarme con un email ya usado (mensaje claro).
- [ ] Login con credenciales inválidas devuelve error genérico sin distinguir email/contraseña.
- [ ] Puedo editar mi perfil y ver los cambios reflejados.
- [ ] Descartar cambios en edición muestra modal de confirmación.
- [ ] Un request sin token a una ruta privada devuelve 401.
- [ ] Las contraseñas en la base están hasheadas (verificable en la tabla).

## 8. Casos borde

Token expirado (401 + redirección a login) · doble submit de registro (idempotencia por email único) · pérdida de conexión al guardar perfil (reintento, sin duplicar) · usuario SUSPENDIDO intenta loguear (403 con mensaje de contacto).

## 9. Notas y decisiones

- 2026-07-06: spec inicial generada a partir de historias de usuario (Integrante 1). Pendiente revisión del equipo.

<div align="center">

<img src="docs/images/logo.png" alt="PetHood Logo" width="200" />

# PetHood Server

**API REST para adopción responsable y rescate animal**

[![CI](https://github.com/ncorrea-13/Pethood-backend/actions/workflows/ci.yml/badge.svg)](https://github.com/ncorrea-13/Pethood-backend/actions/workflows/ci.yml)
[![Node](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](#licencia)

</div>

---

Plataforma que conecta **adoptantes**, **refugios/protectoras** y un **administrador global**: publicación de mascotas, solicitudes de adopción, seguimiento post-adopción, historia clínica, chat, reputación, campañas de donación y mascotas perdidas/encontradas.

Proyecto final académico - UTN Regional Mendoza, Ingeniería en Sistemas

## Stack

| Capa | Tecnología |
| --- | --- |
| Runtime | Node.js 20+ |
| Lenguaje | TypeScript (strict) |
| Framework | Express |
| ORM | Prisma 6 |
| Base de datos | PostgreSQL 16 |
| Validación | Zod |
| Auth | JWT + Google OAuth 2.0 |
| Storage | Cloudflare R2 (S3-compatible) |
| Linting | ESLint 9 (flat config) + Prettier |

## Quick Start

```bash
# 1. Clonar e instalar
git clone https://github.com/ncorrea-13/Pethood-backend.git
cd Pethood-backend
npm install

# 2. Configurar entorno
cp .env.example .env
# Editar .env con tus valores (ver sección Variables de entorno)

# 3.Levantar PostgreSQL y aplicar migraciones
docker compose up -d
npx prisma migrate dev

# 4. Sembrar datos iniciales
npm run seed

# 5. Arrancar
npm run dev
# → http://localhost:3000/api/v1/health
```

## Variables de entorno

| Variable | Requerida | Descripción |
| --- | --- | --- |
| `DATABASE_URL` | Sí | URL de conexión a PostgreSQL |
| `PORT` | No | Puerto del servidor (default: 3000) |
| `JWT_SECRET` | Sí | Secreto para firmar tokens JWT |
| `JWT_EXPIRES_IN` | No | Expiración del token (default: 7d) |
| `NODE_ENV` | No | `development` / `production` |
| `GOOGLE_CLIENT_ID` | No | Client ID de Google OAuth |
| `GOOGLE_CLIENT_SECRET` | No | Client Secret de Google OAuth |
| `GOOGLE_REDIRECT_URI` | No | URI de callback para OAuth web |
| `FRONTEND_WEB_URL` | No | URL del panel web-admin (default: localhost:3001) |
| `R2_ENABLED` | No | `true` para habilitar upload de fotos a R2 |
| `R2_ACCOUNT_ID` | Cond. | Account ID de Cloudflare R2 |
| `R2_ACCESS_KEY_ID` | Cond. | Access Key de R2 |
| `R2_SECRET_ACCESS_KEY` | Cond. | Secret Key de R2 |
| `R2_BUCKET_NAME` | Cond. | Nombre del bucket R2 |
| `R2_PUBLIC_BASE_URL` | Cond. | URL pública base de R2 |

> Las variables marcadas "Cond." son requeridas solo si `R2_ENABLED=true`.

## Autenticación

```bash
POST /api/v1/auth/registro    # Registro con email
POST /api/v1/auth/login       # Login con email
POST /api/v1/auth/google      # Google ID token (mobile)
GET  /api/v1/auth/google      # Redirect OAuth (web)
```

## API Endpoints

El prefijo base es `/api/v1`. Rutas principales:

| Método | Ruta | Descripción |
| --- | --- | --- |
| `GET` | `/health` | Health check |
| `POST` | `/auth/registro` | Registro de usuario |
| `POST` | `/auth/login` | Login |
| `GET/POST` | `/auth/google` | Google OAuth |
| `GET` | `/mascotas` | Listado de mascotas |
| `POST` | `/mascotas` | Crear mascota |
| `GET` | `/mascotas/:id` | Detalle de mascota |
| `PUT` | `/mascotas/:id` | Editar mascota |
| `DELETE` | `/mascotas/:id` | Eliminar mascota |
| `GET` | `/publicaciones` | Listado de publicaciones |
| `POST` | `/solicitudes` | Crear solicitud de adopción |
| `GET` | `/solicitudes` | Listar solicitudes |
| `POST` | `/favoritos` | Agregar a favoritos |
| `DELETE` | `/favoritos/:id` | Quitar de favoritos |
| `GET` | `/dashboard/admin` | Dashboard administrador |
| `GET` | `/dashboard/refugio` | Dashboard refugio |

> Para documentación completa de cada endpoint, ver los specs en `docs/specs/`.

## Estructura del Proyecto

```
src/
├── server.ts              # Arranque del servidor
├── app.ts                 # Instancia Express, middlewares, rutas
├── config/env.ts          # Variables de entorno validadas con Zod
├── middlewares/           # Auth (JWT), roles, errorHandler, validate
├── routes/index.ts        # Router raíz /api/v1
├── modules/
│   ├── auth/              # Registro, login, OAuth
│   ├── mascotas/          # CRUD de mascotas
│   ├── publicaciones/     # Publicaciones de adopción
│   ├── solicitudes/       # Solicitudes de adopción
│   ├── favoritos/         # Sistema de favoritos
│   ├── usuarios/          # Perfil de usuario
│   ├── admin-usuarios/    # Gestión de usuarios (admin)
│   ├── catalogos/         # Especie, Raza, etc.
│   ├── dashboard-admin/   # KPIs panel administrador
│   └── dashboard-refugio/ # KPIs panel refugio
├── jobs/                  # Cron jobs (solicitudes vencidas, estados de campaña)
├── websockets/            # Chat en tiempo real
└── shared/                # Código compartido
    ├── prisma.ts          # Cliente Prisma singleton
    ├── auditoria.ts       # Helpers de auditoría
    ├── jwt.ts             # Firma y verificación de tokens
    ├── storage.ts         # Persistencia de archivos
    └── validation/        # Reglas de validación reutilizables
```

Cada módulo sigue el patrón en capas:

```
modulo/
├── modulo.routes.ts       # Define rutas y aplica validaciones
├── modulo.controller.ts   # HTTP: extrae datos, llama servicio, responde
├── modulo.service.ts      # Lógica de negocio y reglas
├── modulo.repository.ts   # Acceso a datos (Prisma)
└── modulo.dto.ts          # Schemas Zod de entrada/salida
```

## Desarrollo

### Comandos

```bash
npm run dev          # Desarrollo con hot-reload
npm run build        # Build de producción
npm start            # Ejecutar build
npm run seed         # Sembrar datos iniciales (catálogos + cuentas de prueba)
npm run lint         # Analizar con ESLint
npm run lint:fix     # Fix automático de ESLint
npm run format       # Formatear con Prettier
npm run format:check # Verificar formato (CI)
npm test             # Ejecutar tests
```

### Seeds por módulo (opcionales)

`npm run seed` corre solo `prisma/seed.ts`: catálogos y las cuentas de prueba
(`admin@` / `adoptante@` / `refugio@pethood.test`, contraseña `Pethood123`). Es el único que
se ejecuta automáticamente con `prisma db seed` y `migrate reset`.

Además hay seeds por módulo, que se corren **a mano y después** del anterior. Están separados
a propósito: son datos para desarrollar una pantalla puntual y no deberían imponerse a quien
está trabajando en otra fase. Todos son idempotentes y no corren con `NODE_ENV=production`.

```bash
npx tsx prisma/seed-chats.ts              # HU-5.1 — listado de conversaciones (GUI-08 / GUI-31)
npx tsx prisma/seed-dashboard-admin.ts    # spec 009 — dashboard admin
npx tsx prisma/seed-dashboard-refugio.ts  # spec 010 — dashboard refugio
npx tsx prisma/seed-admin-usuarios.ts     # spec 002 — gestión de usuarios y refugios
```

`seed-chats.ts` deja 6 conversaciones para `adoptante@pethood.test` que cubren todos los casos
del listado: chat con refugio y con otro adoptante, sala sin ningún mensaje, contacto dado de
baja, mensaje de solo foto, contador por encima de 99 y nombres largos para ver el truncado.
Los mensajes se fechan relativo al momento de correrlo, así se ven los distintos tramos de
tiempo relativo ("Hace 3 min", "Hace 2 horas", "Ayer", "Hace 4 días").

## Documentación

| Documento | Contenido |
| --- | --- |
| [`docs/CONSTITUTION.md`](docs/CONSTITUTION.md) | Principios no negociables del proyecto |
| [`docs/REQUISITOS.md`](docs/REQUISITOS.md) | Requisitos funcionales y transversales |
| [`docs/MODELO_DATOS.md`](docs/MODELO_DATOS.md) | Entidades, atributos y relaciones |
| [`docs/ROADMAP.md`](docs/ROADMAP.md) | Plan de desarrollo por fases |
| [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md) | Árbol de directorios y convenciones |
| [`docs/specs/`](docs/specs/) | Specs aprobadas por módulo |

## Equipo

Proyecto académico - **UTN Regional Mendoza**, Ingeniería en Sistemas.

- Camila Fabián
- Agustín Leyes
- Nicolás Correa
- Matías Hansen
- Juan Ignacio Castro

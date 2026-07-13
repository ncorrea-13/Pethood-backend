# ARQUITECTURA.md — PetHood

Define cómo se organiza el código en los dos repos de PetHood (`pethood-backend`, `pethood-frontend`) y la convención de branches por feature que usa el equipo en ambos.

## Repos del proyecto

| Repo | Contenido | Stack |
|---|---|---|
| `pethood-backend` | API REST única + esta documentación (`docs/`) | Express + TypeScript + PostgreSQL |
| `pethood-frontend` | Monorepo con ambas apps cliente (`apps/mobile`, `apps/web-admin`) y código compartido (`packages/shared`) | React Native + Expo / Next.js + Tailwind |

## `pethood-backend/` — estructura de directorios

Express no impone una convención de carpetas, así que la organización es por **capas dentro de cada módulo de dominio**, agrupando los módulos según las entidades de `MODELO_DATOS.md` y siguiendo el orden de `ROADMAP.md`. Patrón definido (decisión de equipo — ver `CLAUDE.md` operativo en la raíz del repo):

```
pethood-backend/
├── CLAUDE.md
├── docs/                          # esta carpeta de documentación
├── prisma/schema.prisma           # fuente de verdad física del modelo
├── src/
│   ├── server.ts                  # arranque (puerto, señales)
│   ├── app.ts                     # instancia Express, middlewares globales, rutas
│   ├── config/env.ts              # variables de entorno validadas con Zod
│   ├── middlewares/                # auth (JWT), roles, errorHandler, validate(zod)
│   ├── routes/index.ts            # router raíz /api/v1
│   ├── modules/<modulo>/          # un directorio por módulo de negocio:
│   │   ├── <modulo>.routes.ts      # define rutas y aplica validaciones
│   │   ├── <modulo>.controller.ts  # HTTP puro: extrae datos, llama servicio, responde
│   │   ├── <modulo>.service.ts     # lógica de negocio y reglas (quotas, transiciones de estado) — nunca accede a Prisma directamente
│   │   ├── <modulo>.repository.ts  # único punto de acceso a datos (Prisma) del módulo
│   │   └── <modulo>.dto.ts         # schemas Zod de entrada/salida
│   ├── jobs/                      # cron jobs independientes y testeables sin servidor HTTP
│   │   ├── cancelar-solicitudes-vencidas.job.ts   # HU-7.6
│   │   └── transicion-estados-campana.job.ts      # HU-12.4
│   ├── websockets/                # infraestructura de Chat en tiempo real (HU-5.2)
│   └── shared/                    # mixin/base de auditoría, tipos comunes, utils
├── tests/
│   ├── unit/
│   └── integration/
└── tsconfig.json
```

Notas:
- Cada módulo repite el mismo patrón interno (`routes → controller → service → repository → dto`) para que sea predecible navegarlos.
- `service.ts` nunca importa Prisma directamente — todo acceso a datos pasa por `repository.ts` del mismo módulo; esto permite testear el service mockeando el repository sin levantar base de datos.
- Las quotas anti-spam y la inmutabilidad de `historia-clinica` van en el `service`, nunca en el controller ni como constraint de base de datos.
- No crear un módulo hasta que su fase del `ROADMAP.md` esté habilitada (evita depender de FKs de entidades que todavía no existen).

## `pethood-frontend/` — estructura de directorios (monorepo)

Un solo repo con dos apps independientes como subcarpetas de `apps/`, más un paquete de código compartido en `packages/shared/` (tipos, cliente API base y validaciones comunes a ambas apps).

```
pethood-frontend/
├── CLAUDE.md
├── docs/
│   └── CLAUDE.md                  # contexto específico de frontend
├── package.json                    # workspaces raíz (npm/yarn/pnpm workspaces)
├── tsconfig.base.json
├── apps/
│   ├── mobile/                     # React Native + Expo
│   │   ├── package.json
│   │   ├── app.json
│   │   ├── App.tsx
│   │   ├── src/
│   │   │   ├── screens/
│   │   │   │   ├── auth/              # GUI-01, GUI-02
│   │   │   │   ├── perfil/            # GUI-09, GUI-15
│   │   │   │   ├── mascotas/          # GUI-04, GUI-16, GUI-30, GUI-29
│   │   │   │   ├── adopcion/          # GUI-05, GUI-10, GUI-27, GUI-11
│   │   │   │   ├── perdidas/          # GUI-06, GUI-25
│   │   │   │   ├── chat/              # GUI-08, GUI-31, GUI-14
│   │   │   │   ├── favoritos/         # GUI-12
│   │   │   │   ├── campanas/          # GUI-13
│   │   │   │   ├── historia-clinica/  # GUI-18, GUI-19, GUI-20
│   │   │   │   ├── seguimiento/       # GUI-21, GUI-22
│   │   │   │   └── filtros/           # GUI-23
│   │   │   ├── components/
│   │   │   │   ├── feedback/          # toasts GUI-0.1.x, modales de confirmación
│   │   │   │   └── ui/
│   │   │   ├── navigation/
│   │   │   ├── services/              # cliente API, manejo de token JWT (expo-secure-store)
│   │   │   ├── camera/                # wrapper de cámara nativa (bloquea galería en seguimiento)
│   │   │   ├── hooks/
│   │   │   ├── store/
│   │   │   └── theme/
│   │   └── assets/
│   └── web-admin/                  # Next.js + Tailwind
│       ├── package.json
│       ├── next.config.js
│       ├── tailwind.config.ts
│       ├── src/
│       │   ├── app/
│       │   │   ├── (auth)/login/
│       │   │   ├── (dashboard)/
│       │   │   │   ├── refugios/            # validación, alta/baja (HU-2.2, HU-2.4)
│       │   │   │   ├── usuarios/            # validación, baja (HU-2.3, HU-2.5)
│       │   │   │   ├── moderacion/          # reportes (Módulo 3)
│       │   │   │   ├── campanas/            # GUI-36, GUI-37
│       │   │   │   ├── perfil-refugio/      # GUI-26
│       │   │   │   ├── dashboard/           # GUI-38, GUI-39, GUI-40
│       │   │   │   ├── exportacion/         # GUI-41
│       │   │   │   └── catalogos/           # Especie, Raza, Estado_*, Rol
│       │   │   └── layout.tsx
│       │   ├── components/
│       │   ├── services/
│       │   ├── hooks/
│       │   └── types/
│       └── public/
└── packages/
    └── shared/
        ├── types/          # interfaces TS: Usuario, Mascota, etc. (espejo de MODELO_DATOS.md)
        ├── api/             # funciones fetch/axios al backend, tipadas
        └── validations/     # schemas zod/yup compartidos entre mobile y web-admin
```

Notas:
- Nombrar carpetas/componentes de pantalla con su `GUI-XX` cuando exista, para trazabilidad académica.
- Ambos frontends son "tontos" en reglas de negocio: validan solo para UX, el backend es la fuente de verdad — no duplicar lógica de quotas, transiciones de estado, etc.
- No armar contenido en `packages/shared` que no tenga una duplicación real entre `mobile` y `web-admin` que lo justifique — evitar abstracción prematura.

## Convención de branches por feature

Aplica igual en `pethood-backend` y `pethood-frontend` (cada repo lleva su propia numeración de branches).

- **`main`** — protegida, siempre en estado desplegable. No se commitea directo, solo vía PR.
- **Branches de feature:** `feature/<modulo>-<descripcion-corta>`, en minúsculas y con guiones. El módulo referencia el número de `REQUISITOS.md`/`ROADMAP.md` cuando aplica, para trazabilidad.
  - Ejemplos: `feature/mod1-registro-usuario`, `feature/mod6-crear-mascota`, `feature/mod12-confirmar-donacion`.
  - Idealmente una branch cubre una HU o un grupo chico de HUs relacionadas del mismo módulo — evita ramas gigantes que mezclen módulos de fases distintas del roadmap.
- **Otros prefijos:** `fix/<descripcion>` para bugs fuera de una feature en curso, `chore/<descripcion>` para tareas de infraestructura/tooling que no son HU (setup de linting, CI, etc.).
- **PRs:** título con el/los `HU-XX` que cierra el cambio, para que quede trazable con la consigna académica. Mergear a `main` con al menos una revisión del equipo antes de dar por cerrada la feature.
- No abrir una branch de una fase del `ROADMAP.md` si la fase de la que depende todavía no tiene sus endpoints/pantallas base funcionando.

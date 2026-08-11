# Pethood-backend

API REST de PETHOOD — Express + TypeScript + PostgreSQL + Prisma.

## Puesta en marcha

```bash
npm install
cp .env.example .env        # completar valores
docker compose up -d        # PostgreSQL local (puerto 5432)
npx prisma migrate dev      # aplica las migraciones existentes
npm run seed                # catálogos base (Especie, Raza, Estado_*, Rol, Tipo_Solicitud) + usuario SISTEMA
npm run dev                 # http://localhost:3000/api/v1/health
```

## ESLint + Prettier

El proyecto usa **ESLint 9** (flat config en `eslint.config.mjs`) y **Prettier** (`.prettierrc.json`). La constitución del proyecto exige que el código pase lint y esté formateado antes de mergear.

### 1. Instalar dependencias

Si acabás de clonar el repo:

```bash
npm install
```

Las herramientas de lint/format quedan en `devDependencies` (`eslint`, `typescript-eslint`, `prettier`, `eslint-config-prettier`, etc.).

### 2. Configuración (ya incluida en el repo)

| Archivo | Rol |
|---|---|
| `eslint.config.mjs` | Reglas ESLint (TypeScript strict, sin `any`, promesas, etc.) |
| `.prettierrc.json` | Estilo de formato (comillas simples, trailing commas, ancho 100) |
| `.prettierignore` | Archivos que Prettier no toca (`dist`, `node_modules`, migraciones…) |

No hace falta crear `.eslintrc.js`: ESLint 9 usa **flat config**. La config propuesta en formato legacy se migró y reforzó acá (type-aware rules, ignores, integración Prettier).

### 3. Comandos

```bash
# Analizar el código (reporta errores y warnings)
npm run lint

# Corregir automáticamente lo que ESLint pueda fixear
npm run lint:fix

# Formatear el código con Prettier
npm run format

# Verificar formato sin modificar archivos (útil en CI)
npm run format:check
```

Flujo típico antes de un commit o PR:

```bash
npm run lint:fix
npm run format
npm run lint
npm run format:check
```

### 4. Integración con el editor (Cursor / VS Code)

1. Instalá las extensiones **ESLint** (`dbaeumer.vscode-eslint`) y **Prettier** (`esbenp.prettier-vscode`).
2. Opcional: en settings del workspace, formatear al guardar:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  }
}
```

### 5. Qué falla el lint (reglas clave)

- `@typescript-eslint/no-explicit-any`: **error** — no usar `any` (alineado con TypeScript `strict` y Prisma).
- `@typescript-eslint/no-floating-promises`: **error** — no dejar promesas sin `await`/`.catch()`.
- `no-console`: **warn** — evitar `console.log`; se permiten `console.info` / `console.warn` / `console.error`.
- Variables no usadas: **warn**; podés prefijar con `_` si el parámetro es intencional (`_req`).

### 6. CI (GitHub Actions)

En cada push/PR a `dev` o `main`, el workflow [`.github/workflows/ci.yml`](.github/workflows/ci.yml) ejecuta:

1. `npm ci`
2. Preparar `.env` desde `.env.example`
3. `npx prisma generate`
4. `npm run format:check`
5. `npm run lint`
6. Typecheck (`tsc --noEmit`)
7. `npm run build`
8. `npm run test`

Si lint, formato, typecheck, build o tests fallan, el check de CI queda en rojo y el PR no debería mergearse.

## Documentación

Las convenciones y arquitectura están en `CLAUDE.md`. Los documentos rectores del proyecto (constitución, requisitos, modelo de datos, arquitectura y specs) viven en `docs/` de este mismo repo.

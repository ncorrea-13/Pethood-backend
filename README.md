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

## Scripts

```bash
npm run dev            # servidor con hot reload
npm run build           # compila a dist/
npm start                # corre dist/server.js (producción)
npm run lint             # ESLint
npm run format:check     # Prettier — verifica formato (npm run format para aplicar)
npm test                 # Vitest (tests/unit + tests/integration)
npm run prisma:studio    # explorador visual de la base
```

## CI

Cada push/PR a `dev` o `main` corre `.github/workflows/ci.yml`: instala dependencias, genera el cliente de Prisma, y valida formato, lint, typecheck, build y tests, en ese orden. Un PR con cualquiera de esos pasos en rojo no debería mergearse (ver DoD en `docs/CONSTITUTION.md`).

## Documentación

Las convenciones y arquitectura están en `CLAUDE.md`. Los documentos rectores del proyecto (constitución, requisitos, modelo de datos, arquitectura y specs) viven en `docs/` de este mismo repo.

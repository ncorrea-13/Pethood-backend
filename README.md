# Pethood-backend

API REST de PETHOOD — Express + TypeScript + PostgreSQL + Prisma.

## Puesta en marcha

```bash
npm install
cp .env.example .env        # completar valores
docker compose up -d        # PostgreSQL local
npx prisma migrate dev --name init
npm run dev                 # http://localhost:3000/api/v1/health
```

## Documentación

Las convenciones y arquitectura están en `CLAUDE.md`. Los documentos rectores del proyecto (constitución, requisitos, modelo de datos, arquitectura y specs) viven en `docs/` de este mismo repo.

---
name: setup-dev
description: Levantar el entorno completo de desarrollo de PetHood desde cero (PostgreSQL en Docker, este backend Express puerto 3001, app mobile Expo, panel web-admin Next.js, seed y login admin): usar ante errores de conexión a la BD, puertos ocupados, ECONNREFUSED, o setup inicial del equipo.
---

# Setup del entorno de desarrollo

Orden de levantado completo. Ojo: el **backend corre en el puerto 3001** (`.env` → `PORT=3001`), no 3000 — el 3000 lo ocupa web-admin.

## 1. Base de datos (PostgreSQL en Docker)

```bash
docker compose up -d        # contenedor pethood-db, puerto 5432 (desde la raíz de este repo)
docker ps | grep pethood-db # verificar que esté Up
```

## 2. Backend (Express + Prisma)

```bash
npm install
[ -f .env ] || cp .env.example .env   # verificar PORT=3001 y DATABASE_URL
npx prisma migrate dev                # aplica migraciones y genera el cliente
npm run seed                          # datos base (incluye admin@pethood.test)
npm run dev                           # tsx watch, escucha en http://localhost:3001
curl http://localhost:3001/api/v1/health  # {"ok":true,...} = listo
```

## 3. App mobile (Expo) — repo hermano del frontend

Requiere **Node 22 LTS** fijado en `.nvmrc`; solo npm (nunca yarn/pnpm/bun):

```bash
cd apps/mobile         # dentro del repo hermano
npm ci
npx expo-doctor        # chequeo de entorno
npx expo start --clear # abrir con Expo Go en el celular o emulador
```

## 4. Panel web-admin (Next.js) — repo hermano del frontend

```bash
cd apps/web-admin      # dentro del repo hermano
npm install
npm run dev            # http://localhost:3000
```

## 5. Login como admin

Desde la raíz del workspace (donde viven ambos repos clonados):

```bash
./set-admin-cookie.sh
```

Loguea contra el backend e imprime la línea JS para pegar en la consola del navegador (F12) parado en `http://localhost:3000`, que setea la cookie `phd_token` que lee `apps/web-admin/src/lib/auth.ts`.

## Diagnóstico rápido

| Síntoma | Causa típica |
|---|---|
| `ECONNREFUSED 127.0.0.1:5432` | Contenedor DB caído → paso 1 |
| Backend responde en 3000 | `.env` mal configurado; debe ser `PORT=3001` |
| `P1001: can't reach database` | DB levantada pero migraciones no aplicadas → paso 2 |
| Cookie admin no funciona | Regenerar token: si el backend se re-seedeó, el usuario cambió |
| Expo no arranca | Node ≠ 22 LTS → `node -v`, usar mise/nvm |

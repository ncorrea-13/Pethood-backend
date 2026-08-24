// Agrega el valor `Suspendido` al catálogo Estado_Refugio (spec 002, HU-2.2/2.4).
// Deliberadamente separado de seed.ts (mismo patrón que seed-dashboard.ts): es un ajuste de
// catálogo para este módulo, no se impone al correr `npx prisma migrate reset` para todos.
// Se corre a mano: npx tsx prisma/seed-admin-usuarios.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const sistema = await prisma.usuario.findUniqueOrThrow({
    where: { email: 'sistema@pethood.internal' },
  });

  await prisma.estadoRefugio.upsert({
    where: { nombre: 'Suspendido' },
    update: {},
    create: { nombre: 'Suspendido', usuarioAlta: sistema.id },
  });

  console.log('✅ Estado_Refugio.Suspendido sembrado.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

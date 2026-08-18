// Fixtures operativos para probar las agregaciones del dashboard admin (spec 009, Fase 12).
//
// Deliberadamente separado de seed.ts: este repo lo tocan varias personas y prisma.seed
// (npx prisma db seed / migrate reset) corre seed.ts automáticamente para todos. Estos datos
// son solo para desarrollar/probar el dashboard — no deben imponerse a quien está trabajando
// otra fase. Se corre a mano con `npm run seed:dashboard`, después de `npm run seed`.
//
// Idempotente igual que seed.ts (findFirst + create) aunque Mascota/Solicitud/Campania no
// tengan clave única natural para un upsert real.
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === 'production') {
    console.log('⏭️  NODE_ENV=production: seed-dashboard no corre (son datos de prueba).');
    return;
  }

  const sistema = await prisma.usuario.findUniqueOrThrow({
    where: { email: 'sistema@pethood.internal' },
  });
  const adoptante = await prisma.usuario.findUniqueOrThrow({
    where: { email: 'adoptante@pethood.test' },
  });
  const usuarioRefugio = await prisma.usuario.findUniqueOrThrow({
    where: { email: 'refugio@pethood.test' },
  });
  const refugio = await prisma.refugio.findUniqueOrThrow({ where: { id: 1 } });
  const raza = await prisma.raza.findFirstOrThrow({ where: { nombre: 'Mestizo' } });
  const tipoAdopcion = await prisma.tipoSolicitud.findUniqueOrThrow({
    where: { nombre: 'Adopcion' },
  });

  const usuarioAlta = sistema.id;

  const mascotas = await seedMascotas(usuarioAlta, refugio.id, usuarioRefugio.id, raza.id);
  const publicables = mascotas.filter((m) =>
    ['Disponible', 'En_Tratamiento', 'En_Transito'].includes(m.estadoNombre),
  );
  const publicaciones = await seedPublicaciones(usuarioAlta, usuarioRefugio.id, publicables);
  await seedSolicitudes(usuarioAlta, adoptante.id, tipoAdopcion.id, publicaciones);
  await seedCampaniasYDonaciones(usuarioAlta, refugio.id, adoptante.id);

  console.log('✅ seed-dashboard completo.');
}

async function seedMascotas(
  usuarioAlta: number,
  refugioId: number,
  usuarioId: number,
  razaId: number,
) {
  const estados = await prisma.estadoMascota.findMany();
  const estadoIdPorNombre = new Map(estados.map((e) => [e.nombre, e.id]));

  const definiciones = [
    { nombre: 'Dashboard Firulais', estadoNombre: 'Disponible' },
    { nombre: 'Dashboard Michi', estadoNombre: 'Disponible' },
    { nombre: 'Dashboard Rocky', estadoNombre: 'En_Tratamiento' },
    { nombre: 'Dashboard Luna', estadoNombre: 'Adoptado' },
    { nombre: 'Dashboard Toby', estadoNombre: 'Fallecido' },
    { nombre: 'Dashboard Nube', estadoNombre: 'En_Transito' },
  ];

  const resultado: { id: number; estadoNombre: string }[] = [];

  for (const def of definiciones) {
    let mascota = await prisma.mascota.findFirst({ where: { nombre: def.nombre } });
    if (!mascota) {
      mascota = await prisma.mascota.create({
        data: {
          nombre: def.nombre,
          genero: 'MACHO',
          razaId,
          refugioId,
          usuarioId,
          usuarioAlta,
        },
      });
      await prisma.mascotaEstado.create({
        data: {
          mascotaId: mascota.id,
          estadoMascotaId: estadoIdPorNombre.get(def.estadoNombre)!,
          usuarioAlta,
        },
      });
    }
    resultado.push({ id: mascota.id, estadoNombre: def.estadoNombre });
  }

  return resultado;
}

async function seedPublicaciones(
  usuarioAlta: number,
  usuarioId: number,
  mascotas: { id: number }[],
) {
  const publicaciones = [];
  for (const mascota of mascotas) {
    let publicacion = await prisma.publicacion.findFirst({ where: { mascotaId: mascota.id } });
    if (!publicacion) {
      publicacion = await prisma.publicacion.create({
        data: {
          titulo: `En adopción — mascota ${mascota.id}`,
          mascotaId: mascota.id,
          usuarioId,
          usuarioAlta,
        },
      });
    }
    publicaciones.push(publicacion);
  }
  return publicaciones;
}

async function seedSolicitudes(
  usuarioAlta: number,
  usuarioId: number,
  tipoSolicitudId: number,
  publicaciones: { id: number }[],
) {
  const estados = await prisma.estadoSolicitud.findMany();
  const nombresEstado = ['Pendiente', 'En_Revision', 'Aprobada', 'Rechazada', 'Cancelada'];

  for (let i = 0; i < nombresEstado.length && i < publicaciones.length; i++) {
    const publicacionId = publicaciones[i].id;
    let solicitud = await prisma.solicitud.findFirst({ where: { publicacionId, usuarioId } });
    if (!solicitud) {
      solicitud = await prisma.solicitud.create({
        data: {
          motivacion: 'Fixture de dashboard para probar agregaciones (seed-dashboard.ts).',
          publicacionId,
          usuarioId,
          tipoSolicitudId,
          usuarioAlta,
        },
      });
      const estadoId = estados.find((e) => e.nombre === nombresEstado[i])!.id;
      await prisma.solicitudEstado.create({
        data: { solicitudId: solicitud.id, estadoSolicitudId: estadoId, usuarioAlta },
      });
    }
  }
}

async function seedCampaniasYDonaciones(usuarioAlta: number, refugioId: number, donanteId: number) {
  const estados = await prisma.estadoCampania.findMany();
  const estadoIdPorNombre = new Map(estados.map((e) => [e.nombre, e.id]));

  const definiciones = [
    { titulo: 'Dashboard Campaña Activa', estadoNombre: 'Activa', montoDonacion: 15000 },
    { titulo: 'Dashboard Campaña Finalizada', estadoNombre: 'Finalizada', montoDonacion: 80000 },
  ];

  for (const def of definiciones) {
    let campania = await prisma.campania.findFirst({ where: { titulo: def.titulo } });
    if (!campania) {
      const hoy = new Date();
      const enUnMes = new Date(hoy);
      enUnMes.setMonth(enUnMes.getMonth() + 1);
      campania = await prisma.campania.create({
        data: {
          titulo: def.titulo,
          descripcion: 'Fixture de dashboard (seed-dashboard.ts).',
          objetivo: 100000,
          fechaInicio: hoy,
          fechaFin: enUnMes,
          refugioId,
          estadoCampaniaId: estadoIdPorNombre.get(def.estadoNombre)!,
          usuarioAlta,
        },
      });
    }

    const donacionExistente = await prisma.donacion.findFirst({
      where: { campaniaId: campania.id, usuarioId: donanteId },
    });
    if (!donacionExistente) {
      await prisma.donacion.create({
        data: {
          monto: def.montoDonacion,
          campaniaId: campania.id,
          usuarioId: donanteId,
          usuarioAlta,
        },
      });
    }
  }
}

main()
  .catch((err) => {
    console.error('❌ Error corriendo seed-dashboard:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

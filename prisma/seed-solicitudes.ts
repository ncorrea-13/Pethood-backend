// Fixtures para desarrollar/probar el módulo de Adopción (spec 003, HU-7.4/7.5/7.6).
// Mismo criterio que prisma/seed-dashboard-refugio.ts: separado de seed.ts porque estos
// datos son solo para levantar el módulo a mano, no para todo el equipo.
// Se corre después de `npm run seed`: npx tsx prisma/seed-solicitudes.ts
//
// Reutiliza las cuentas de prueba del refugio (refugio@pethood.test / adoptante@pethood.test)
// y crea mascotas + publicaciones propias (nombradas "Solicitudes Fixture ...") para no pisar
// las de seed-dashboard-refugio.ts. Cubre los escenarios que necesita el módulo:
//   1) Pendiente reciente        -> probar aceptar/rechazar (HU-7.4).
//   2) Pendiente vencida (200d)  -> probar el cron de cancelación sin esperar 6 meses reales (HU-7.6).
//   3) Aprobada con 2 estados en el histórico -> probar el detalle con historial (HU-7.5).
//   4) Rechazada                 -> variedad para el listado filtrado por estado (HU-7.5).
//   5) Pendiente "libre"         -> reservada para el script de concurrencia real (dos PATCH
//      simultáneos), que la consume y la deja resuelta — no la uses para otra cosa.
//
// Además crea DOS cuentas propias (no las de seed.ts, que ya tienen historial de otras
// pruebas manuales) para probar el caso que `mascotas.dto.ts` permite y la v1 de este
// módulo no cubría: un adoptante particular publicando su propia mascota, no un refugio.
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function haceDias(cantidad: number): Date {
  const hoy = new Date();
  hoy.setDate(hoy.getDate() - cantidad);
  return hoy;
}

async function main() {
  if (process.env.NODE_ENV === 'production') {
    console.log('⏭️  NODE_ENV=production: seed-solicitudes no corre (son datos de prueba).');
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
  const estadoDisponible = await prisma.estadoMascota.findUniqueOrThrow({
    where: { nombre: 'Disponible' },
  });
  const estados = await prisma.estadoSolicitud.findMany();
  const estadoIdPorNombre = new Map(estados.map((e) => [e.nombre, e.id]));
  const rolAdoptante = await prisma.rol.findUniqueOrThrow({ where: { nombre: 'Adoptante' } });
  const estadoUsuarioActivo = await prisma.estadoUsuario.findUniqueOrThrow({
    where: { nombre: 'Activo' },
  });

  const usuarioAlta = sistema.id;

  const publicaciones = await seedPublicaciones(
    usuarioAlta,
    refugio.id,
    usuarioRefugio.id,
    raza.id,
    estadoDisponible.id,
  );

  const { publicador, solicitante } = await seedActoresPersonales(
    usuarioAlta,
    estadoUsuarioActivo.id,
    rolAdoptante.id,
  );
  const publicacionPersonal = await seedPublicacionPersonal(
    usuarioAlta,
    publicador.id,
    raza.id,
    estadoDisponible.id,
  );
  await seedSolicitudPersonalPendiente(
    usuarioAlta,
    solicitante.id,
    tipoAdopcion.id,
    publicacionPersonal.id,
    estadoIdPorNombre.get('Pendiente')!,
  );

  await seedSolicitudPendienteReciente(
    usuarioAlta,
    adoptante.id,
    tipoAdopcion.id,
    publicaciones[0]!.id,
    estadoIdPorNombre.get('Pendiente')!,
  );

  await seedSolicitudPendienteVencida(
    usuarioAlta,
    adoptante.id,
    tipoAdopcion.id,
    publicaciones[1]!.id,
    estadoIdPorNombre.get('Pendiente')!,
  );

  await seedSolicitudAprobadaConHistorial(
    usuarioAlta,
    adoptante.id,
    tipoAdopcion.id,
    publicaciones[2]!.id,
    estadoIdPorNombre.get('Pendiente')!,
    estadoIdPorNombre.get('Aprobada')!,
  );

  await seedSolicitudRechazada(
    usuarioAlta,
    adoptante.id,
    tipoAdopcion.id,
    publicaciones[3]!.id,
    estadoIdPorNombre.get('Rechazada')!,
  );

  await seedSolicitudPendienteReciente(
    usuarioAlta,
    adoptante.id,
    tipoAdopcion.id,
    publicaciones[4]!.id,
    estadoIdPorNombre.get('Pendiente')!,
  );

  console.log('🔑 Cuentas de prueba: refugio@pethood.test / adoptante@pethood.test — Pethood123');
  console.log(
    '🔑 Cuentas personales: solicitudes-fixture-publicador@pethood.test / solicitudes-fixture-solicitante@pethood.test — Pethood123',
  );
  console.log('✅ seed-solicitudes completo.');
}

/** RolUsuario no tiene índice único, así que el upsert se hace a mano (mismo criterio que seed.ts). */
async function asignarRol(usuarioId: number, rolId: number, usuarioAlta: number) {
  const existente = await prisma.rolUsuario.findFirst({ where: { usuarioId, rolId, fechaBaja: null } });
  if (existente) return;

  await prisma.rolUsuario.create({ data: { usuarioId, rolId, usuarioAlta } });
}

/**
 * Dos adoptantes propios de este fixture (no los de seed.ts, que ya acumularon estado de
 * otras pruebas manuales): uno publica una mascota propia, el otro le pide adoptarla. Sin
 * esto no hay forma de probar en vivo el caso "adoptante particular publica su mascota" que
 * `mascotas.dto.ts` permite (actor ADOPTANTE + destino ADOPCION) y que la v1 de este módulo
 * no cubría.
 */
async function seedActoresPersonales(usuarioAlta: number, estadoActivoId: number, rolId: number) {
  const contrasena = await bcrypt.hash('Pethood123', 10);

  async function upsertActor(email: string, nombre: string, apellido: string) {
    const usuario = await prisma.usuario.upsert({
      where: { email },
      update: {},
      create: { nombre, apellido, email, contrasena, verificado: true, estadoId: estadoActivoId, usuarioAlta },
    });
    await asignarRol(usuario.id, rolId, usuarioAlta);
    return usuario;
  }

  const publicador = await upsertActor(
    'solicitudes-fixture-publicador@pethood.test',
    'Fixture',
    'Publicador',
  );
  const solicitante = await upsertActor(
    'solicitudes-fixture-solicitante@pethood.test',
    'Fixture',
    'Solicitante',
  );

  return { publicador, solicitante };
}

/** Mascota SIN refugio (refugioId null): la publica un adoptante particular a título propio. */
async function seedPublicacionPersonal(
  usuarioAlta: number,
  usuarioId: number,
  razaId: number,
  estadoMascotaId: number,
) {
  const nombre = 'Solicitudes Fixture Mia (personal)';

  let mascota = await prisma.mascota.findFirst({ where: { nombre } });
  if (!mascota) {
    mascota = await prisma.mascota.create({
      data: { nombre, genero: 'HEMBRA', razaId, refugioId: null, usuarioId, usuarioAlta },
    });
    await prisma.mascotaEstado.create({
      data: { mascotaId: mascota.id, estadoMascotaId, usuarioAlta },
    });
  }

  let publicacion = await prisma.publicacion.findFirst({ where: { mascotaId: mascota.id } });
  if (!publicacion) {
    publicacion = await prisma.publicacion.create({
      data: { titulo: `${nombre} busca hogar`, mascotaId: mascota.id, usuarioId, usuarioAlta },
    });
  }
  return publicacion;
}

async function seedSolicitudPersonalPendiente(
  usuarioAlta: number,
  usuarioId: number,
  tipoSolicitudId: number,
  publicacionId: number,
  estadoPendienteId: number,
) {
  const existente = await prisma.solicitud.findFirst({ where: { publicacionId, usuarioId } });
  if (existente) return existente;

  const solicitud = await prisma.solicitud.create({
    data: {
      motivacion: 'Fixture: solicitud sobre una mascota publicada por un adoptante particular.',
      publicacionId,
      usuarioId,
      tipoSolicitudId,
      usuarioAlta,
    },
  });
  await prisma.solicitudEstado.create({
    data: { solicitudId: solicitud.id, estadoSolicitudId: estadoPendienteId, usuarioAlta },
  });
  return solicitud;
}

async function seedPublicaciones(
  usuarioAlta: number,
  refugioId: number,
  usuarioId: number,
  razaId: number,
  estadoMascotaId: number,
) {
  const nombres = [
    'Solicitudes Fixture Toby',
    'Solicitudes Fixture Nina',
    'Solicitudes Fixture Rocky',
    'Solicitudes Fixture Luna',
    'Solicitudes Fixture Rex',
  ];

  const publicaciones = [];
  for (const nombre of nombres) {
    let mascota = await prisma.mascota.findFirst({ where: { nombre } });
    if (!mascota) {
      mascota = await prisma.mascota.create({
        data: { nombre, genero: 'MACHO', razaId, refugioId, usuarioId, usuarioAlta },
      });
      await prisma.mascotaEstado.create({
        data: { mascotaId: mascota.id, estadoMascotaId, usuarioAlta },
      });
    }

    let publicacion = await prisma.publicacion.findFirst({ where: { mascotaId: mascota.id } });
    if (!publicacion) {
      publicacion = await prisma.publicacion.create({
        data: { titulo: `${nombre} busca hogar`, mascotaId: mascota.id, usuarioId, usuarioAlta },
      });
    }
    publicaciones.push(publicacion);
  }
  return publicaciones;
}

async function seedSolicitudPendienteReciente(
  usuarioAlta: number,
  usuarioId: number,
  tipoSolicitudId: number,
  publicacionId: number,
  estadoPendienteId: number,
) {
  let solicitud = await prisma.solicitud.findFirst({ where: { publicacionId, usuarioId } });
  if (solicitud) return;

  solicitud = await prisma.solicitud.create({
    data: {
      motivacion: 'Fixture: pendiente recién creada, para probar aceptar/rechazar (HU-7.4).',
      publicacionId,
      usuarioId,
      tipoSolicitudId,
      usuarioAlta,
    },
  });
  await prisma.solicitudEstado.create({
    data: { solicitudId: solicitud.id, estadoSolicitudId: estadoPendienteId, usuarioAlta },
  });
}

async function seedSolicitudPendienteVencida(
  usuarioAlta: number,
  usuarioId: number,
  tipoSolicitudId: number,
  publicacionId: number,
  estadoPendienteId: number,
) {
  let solicitud = await prisma.solicitud.findFirst({ where: { publicacionId, usuarioId } });
  if (solicitud) return;

  // 200 días > los 180 (tipo_solicitud_secuencia_dias de "Adopcion"): el cron de HU-7.6 la
  // tiene que agarrar sin esperar 6 meses reales.
  const fechaAlta = haceDias(200);
  solicitud = await prisma.solicitud.create({
    data: {
      motivacion: 'Fixture: pendiente vencida, para probar el cron de cancelación (HU-7.6).',
      publicacionId,
      usuarioId,
      tipoSolicitudId,
      usuarioAlta,
      fechaAlta,
    },
  });
  await prisma.solicitudEstado.create({
    data: {
      solicitudId: solicitud.id,
      estadoSolicitudId: estadoPendienteId,
      usuarioAlta,
      fechaAlta,
    },
  });
}

async function seedSolicitudAprobadaConHistorial(
  usuarioAlta: number,
  usuarioId: number,
  tipoSolicitudId: number,
  publicacionId: number,
  estadoPendienteId: number,
  estadoAprobadaId: number,
) {
  let solicitud = await prisma.solicitud.findFirst({ where: { publicacionId, usuarioId } });
  if (solicitud) return;

  const fechaAlta = haceDias(10);
  const fechaRespuesta = haceDias(8);
  solicitud = await prisma.solicitud.create({
    data: {
      motivacion: 'Fixture: aprobada con historial de 2 estados, para probar HU-7.5.',
      comentario: 'Fixture: bienvenido a la familia.',
      publicacionId,
      usuarioId,
      tipoSolicitudId,
      usuarioAlta,
      fechaAlta,
      fechaRespuesta,
    },
  });
  await prisma.solicitudEstado.create({
    data: {
      solicitudId: solicitud.id,
      estadoSolicitudId: estadoPendienteId,
      usuarioAlta,
      fechaAlta,
    },
  });
  await prisma.solicitudEstado.create({
    data: {
      solicitudId: solicitud.id,
      estadoSolicitudId: estadoAprobadaId,
      usuarioAlta,
      fechaAlta: fechaRespuesta,
    },
  });
}

async function seedSolicitudRechazada(
  usuarioAlta: number,
  usuarioId: number,
  tipoSolicitudId: number,
  publicacionId: number,
  estadoRechazadaId: number,
) {
  let solicitud = await prisma.solicitud.findFirst({ where: { publicacionId, usuarioId } });
  if (solicitud) return;

  const fechaAlta = haceDias(15);
  const fechaRespuesta = haceDias(14);
  solicitud = await prisma.solicitud.create({
    data: {
      motivacion: 'Fixture: rechazada, variedad para el listado filtrado por estado (HU-7.5).',
      comentario: 'Fixture: no cumple los requisitos de la publicación.',
      publicacionId,
      usuarioId,
      tipoSolicitudId,
      usuarioAlta,
      fechaAlta,
      fechaRespuesta,
    },
  });
  await prisma.solicitudEstado.create({
    data: {
      solicitudId: solicitud.id,
      estadoSolicitudId: estadoRechazadaId,
      usuarioAlta,
      fechaAlta: fechaRespuesta,
    },
  });
}

main()
  .catch((err) => {
    console.error('❌ Error corriendo seed-solicitudes:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

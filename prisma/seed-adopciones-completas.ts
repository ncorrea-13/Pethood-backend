// Seed de solicitudes de adopción/tránsito ya en estado final ("Aprobada"), para poder
// desarrollar y probar el Módulo 9 (Seguimiento Post-Adopción — HU-9.1/HU-9.2).
//
// Todavía no existe en el sistema el flujo real de "solicitar adopción" (ver ROADMAP.md), así
// que HU-9.1/9.2 no tienen de dónde partir: sus precondiciones piden "tiene completa
// formalmente una solicitud de adopción o de tránsito". Este seed deja sembrado justo eso —
// Solicitud + Solicitud_Estado="Aprobada", como si un adoptante ya hubiese pasado por ese
// proceso y tuviera la mascota a su cargo — sin implementar nada del módulo de Solicitudes en
// sí (ni endpoints, ni lógica de revisión/aprobación, ni las quotas de la regla transversal 7).
//
// Deliberadamente separado de seed.ts, igual que seed-chats.ts y seed-dashboard-*.ts. Se corre
// a mano, DESPUÉS de `npm run seed`:
//
//     npx tsx prisma/seed-adopciones-completas.ts
//
// Reutiliza adoptante@pethood.test y refugio@pethood.test (creados por seed.ts) y crea sus
// propias mascotas/publicaciones ("Seguimiento *"), para no interferir con los fixtures de
// favoritos, feed o dashboard que ya usan otros nombres.
//
// `diasDesdeAprobacion` está escalonado a propósito en distintos tramos desde "hoy" hacia
// atrás, cubriendo los escenarios que va a necesitar la lógica de seguimiento cuando se
// implemente (secuencias de HU-9.2: adopción [2,5,5,5,7,7,14,14,30,30,60,90,180,365,365],
// tránsito [2,2,3,4,5,5,...] y luego siempre cada 5 días):
//   - día 0: recién aprobada, todavía no llega el primer checkpoint.
//   - unos pocos días: cae dentro de la ventana de 48h del primer checkpoint (HU-9.1).
//   - más de una semana: el primer checkpoint ya venció sin respuesta (bloqueado, HU-9.2).
//   - varios meses / más de un año: mitad y final de la secuencia completa.
//
// No siembra Pregunta_Seguimiento ni Seguimiento: son parte de la implementación de
// HU-9.1/9.2 (generación de la pregunta activa según la secuencia de días), todavía no escrita.
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DIA = 24 * 60 * 60 * 1000;
const haceDias = (dias: number): Date => new Date(Date.now() - dias * DIA);

const foto = (id: string) => `https://images.unsplash.com/${id}?w=1200&q=80`;

interface DefinicionSolicitudCompleta {
  nombreMascota: string;
  especie: 'Perro' | 'Gato';
  raza: string;
  genero: 'MACHO' | 'HEMBRA';
  tamanio: 'PEQUENO' | 'MEDIANO' | 'GRANDE';
  tipoSolicitud: 'Adopcion' | 'Transito';
  estadoMascota: 'Adoptado' | 'En_Transito';
  diasDesdeAprobacion: number;
  notaTramo: string;
  imagenUrl: string;
}

const DEFINICIONES: DefinicionSolicitudCompleta[] = [
  {
    nombreMascota: 'Seguimiento Rex',
    especie: 'Perro',
    raza: 'Labrador',
    genero: 'MACHO',
    tamanio: 'GRANDE',
    tipoSolicitud: 'Adopcion',
    estadoMascota: 'Adoptado',
    diasDesdeAprobacion: 0,
    notaTramo: 'Aprobada hoy: todavía no llega el primer checkpoint (día 2).',
    imagenUrl: foto('photo-1543466835-00a7907e9de1'),
  },
  {
    nombreMascota: 'Seguimiento Nina',
    especie: 'Perro',
    raza: 'Mestizo',
    genero: 'HEMBRA',
    tamanio: 'MEDIANO',
    tipoSolicitud: 'Adopcion',
    estadoMascota: 'Adoptado',
    diasDesdeAprobacion: 3,
    notaTramo: 'Aprobada hace 3 días: dentro de la ventana de 48h del checkpoint de día 2.',
    imagenUrl: foto('photo-1601979031925-424e53b6caaa'),
  },
  {
    nombreMascota: 'Seguimiento Toby',
    especie: 'Perro',
    raza: 'Bulldog',
    genero: 'MACHO',
    tamanio: 'MEDIANO',
    tipoSolicitud: 'Adopcion',
    estadoMascota: 'Adoptado',
    diasDesdeAprobacion: 6,
    notaTramo: 'Aprobada hace 6 días: el checkpoint de día 2 ya venció sin respuesta.',
    imagenUrl: foto('photo-1568572933382-74d440642117'),
  },
  {
    nombreMascota: 'Seguimiento Estrella',
    especie: 'Gato',
    raza: 'Siames',
    genero: 'HEMBRA',
    tamanio: 'PEQUENO',
    tipoSolicitud: 'Adopcion',
    estadoMascota: 'Adoptado',
    diasDesdeAprobacion: 100,
    notaTramo: 'Aprobada hace 100 días: mitad de la secuencia de adopción.',
    imagenUrl: foto('photo-1514888286974-6c03e2ca1dba'),
  },
  {
    nombreMascota: 'Seguimiento Pipo',
    especie: 'Perro',
    raza: 'Caniche',
    genero: 'MACHO',
    tamanio: 'PEQUENO',
    tipoSolicitud: 'Adopcion',
    estadoMascota: 'Adoptado',
    diasDesdeAprobacion: 900,
    notaTramo: 'Aprobada hace 900 días: agotó toda la secuencia (último hito, día 1179).',
    imagenUrl: foto('photo-1591160690555-5debfba289f0'),
  },
  {
    nombreMascota: 'Seguimiento Coty',
    especie: 'Gato',
    raza: 'Mestizo',
    genero: 'HEMBRA',
    tamanio: 'PEQUENO',
    tipoSolicitud: 'Transito',
    estadoMascota: 'En_Transito',
    diasDesdeAprobacion: 0,
    notaTramo: 'Tránsito aprobado hoy: todavía no llega el primer checkpoint (día 2).',
    imagenUrl: foto('photo-1518791841217-8f162f1e1131'),
  },
  {
    nombreMascota: 'Seguimiento Bimba',
    especie: 'Perro',
    raza: 'Mestizo',
    genero: 'HEMBRA',
    tamanio: 'MEDIANO',
    tipoSolicitud: 'Transito',
    estadoMascota: 'En_Transito',
    diasDesdeAprobacion: 3,
    notaTramo:
      'Tránsito aprobado hace 3 días: dentro de la ventana de 48h del checkpoint de día 2.',
    imagenUrl: foto('photo-1587300003388-59208cc962cb'),
  },
  {
    nombreMascota: 'Seguimiento Tobi',
    especie: 'Perro',
    raza: 'Labrador',
    genero: 'MACHO',
    tamanio: 'GRANDE',
    tipoSolicitud: 'Transito',
    estadoMascota: 'En_Transito',
    diasDesdeAprobacion: 10,
    notaTramo:
      'Tránsito aprobado hace 10 días: pasaron varios checkpoints (día 2, 4, 7) sin respuesta.',
    imagenUrl: foto('photo-1552053831-71594a27632d'),
  },
  {
    nombreMascota: 'Seguimiento Kiwi',
    especie: 'Gato',
    raza: 'Persa',
    genero: 'MACHO',
    tamanio: 'PEQUENO',
    tipoSolicitud: 'Transito',
    estadoMascota: 'En_Transito',
    diasDesdeAprobacion: 60,
    notaTramo: 'Tránsito aprobado hace 60 días: ya en el tramo estable de cada 5 días.',
    imagenUrl: foto('photo-1583337130417-3346a1be7dee'),
  },
];

async function main() {
  if (process.env.NODE_ENV === 'production') {
    console.log(
      '⏭️  NODE_ENV=production: seed-adopciones-completas no corre (son datos de prueba).',
    );
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
  const estadoAprobada = await prisma.estadoSolicitud.findUniqueOrThrow({
    where: { nombre: 'Aprobada' },
  });

  const tiposSolicitud = await prisma.tipoSolicitud.findMany();
  const tipoIdPorNombre = new Map(tiposSolicitud.map((t) => [t.nombre, t.id]));

  const estadosMascota = await prisma.estadoMascota.findMany();
  const estadoMascotaIdPorNombre = new Map(estadosMascota.map((e) => [e.nombre, e.id]));

  const usuarioAlta = sistema.id;
  let mascotasCreadas = 0;
  let solicitudesCreadas = 0;

  for (const def of DEFINICIONES) {
    const especie = await prisma.especie.findUniqueOrThrow({ where: { nombre: def.especie } });
    const raza = await prisma.raza.findUniqueOrThrow({
      where: { nombre_especieId: { nombre: def.raza, especieId: especie.id } },
    });

    let mascota = await prisma.mascota.findFirst({
      where: { nombre: def.nombreMascota, usuarioId: usuarioRefugio.id, fechaBaja: null },
    });

    if (!mascota) {
      mascota = await prisma.mascota.create({
        data: {
          nombre: def.nombreMascota,
          genero: def.genero,
          tamanio: def.tamanio,
          castrado: true,
          descripcion: `Fixture de ${def.tipoSolicitud.toLowerCase()} completa (seed-adopciones-completas.ts).`,
          imagenUrl: def.imagenUrl,
          razaId: raza.id,
          refugioId: refugio.id,
          usuarioId: usuarioRefugio.id,
          usuarioAlta,
          historicoEstados: {
            create: {
              estadoMascotaId: estadoMascotaIdPorNombre.get(def.estadoMascota)!,
              usuarioAlta,
            },
          },
        },
      });
      mascotasCreadas += 1;
    }

    let publicacion = await prisma.publicacion.findFirst({
      where: { mascotaId: mascota.id, fechaBaja: null },
    });

    if (!publicacion) {
      publicacion = await prisma.publicacion.create({
        data: {
          titulo: `${def.nombreMascota} busca hogar`,
          descripcion: 'Fixture de seguimiento post-adopción (seed-adopciones-completas.ts).',
          ubicacion: 'Mendoza',
          requisitos: [],
          personalidad: [],
          vacunas: 'Al día',
          imagenes: [def.imagenUrl],
          imagenUrl: def.imagenUrl,
          mascotaId: mascota.id,
          usuarioId: usuarioRefugio.id,
          usuarioAlta,
        },
      });
    }

    let solicitud = await prisma.solicitud.findFirst({
      where: { publicacionId: publicacion.id, usuarioId: adoptante.id },
    });

    if (!solicitud) {
      const fechaAprobacion = haceDias(def.diasDesdeAprobacion);
      solicitud = await prisma.solicitud.create({
        data: {
          motivacion: `Fixture de ${def.tipoSolicitud.toLowerCase()} completa para desarrollar HU-9.1/HU-9.2 (seed-adopciones-completas.ts).`,
          fechaRespuesta: fechaAprobacion,
          comentario:
            'Solicitud aprobada — fixture de seed, no pasó por un flujo real de revisión.',
          publicacionId: publicacion.id,
          usuarioId: adoptante.id,
          tipoSolicitudId: tipoIdPorNombre.get(def.tipoSolicitud)!,
          usuarioAlta,
          fechaAlta: fechaAprobacion,
        },
      });
      await prisma.solicitudEstado.create({
        data: {
          solicitudId: solicitud.id,
          estadoSolicitudId: estadoAprobada.id,
          usuarioAlta,
          fechaAlta: fechaAprobacion,
        },
      });
      solicitudesCreadas += 1;
    }

    console.log(`✅ ${def.nombreMascota} — ${def.tipoSolicitud} — ${def.notaTramo}`);
  }

  console.log('');
  console.log(
    `✅ seed-adopciones-completas: ${DEFINICIONES.length} solicitudes aprobadas (${solicitudesCreadas} nuevas, ${mascotasCreadas} mascotas nuevas).`,
  );
  console.log('🔑 Adoptante de prueba: adoptante@pethood.test — Pethood123');
}

main()
  .catch((err) => {
    console.error('❌ seed-adopciones-completas falló:', err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

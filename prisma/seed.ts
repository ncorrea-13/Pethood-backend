// Seed de catálogos base (Fase 0 — ROADMAP.md).
// Idempotente: se puede correr N veces sin duplicar filas (upsert por clave única).
//
// Siembra primero el usuario "SISTEMA" (usado como usuario_alta de todo lo demás y como
// autor de las bajas automáticas de los cron jobs, ej. cancelar-solicitudes-vencidas) porque
// las columnas de auditoría (*_usuario_alta) son enteros planos sin FK real — no hace falta
// que el usuario exista antes en la fila, pero sí lo necesitamos para no dejar el dato en null.
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SISTEMA_EMAIL = 'sistema@pethood.internal';

async function seedUsuarioSistema(estadoActivoId: number): Promise<number> {
  const passwordHash = await bcrypt.hash(`sistema-${crypto.randomUUID()}`, 10);

  const sistema = await prisma.usuario.upsert({
    where: { email: SISTEMA_EMAIL },
    update: {},
    create: {
      nombre: 'Sistema',
      apellido: 'PetHood',
      email: SISTEMA_EMAIL,
      contrasena: passwordHash, // nunca se usa para login real
      dni: '00000000',
      verificado: true,
      estadoId: estadoActivoId,
      usuarioAlta: 1, // se autorreferencia: es la primera fila, se crea a sí mismo
    },
  });

  return sistema.id;
}

async function seedEstadosUsuario(usuarioAlta: number) {
  const nombres = ['Pendiente_Verificacion', 'Activo', 'Suspendido', 'Inactivo'];
  for (const nombre of nombres) {
    await prisma.estadoUsuario.upsert({
      where: { nombre },
      update: {},
      create: { nombre, usuarioAlta },
    });
  }
}

async function seedEstadosRefugio(usuarioAlta: number) {
  const nombres = ['Pendiente_Verificacion', 'Activo', 'Inactivo'];
  for (const nombre of nombres) {
    await prisma.estadoRefugio.upsert({
      where: { nombre },
      update: {},
      create: { nombre, usuarioAlta },
    });
  }
}

async function seedEstadosMascota(usuarioAlta: number) {
  // Valores literales de MODELO_DATOS.md — "Perdido" NO es un estado propio de Mascota,
  // se rastrea aparte vía AnimalPerdido.mascotaId.
  const nombres = ['Disponible', 'En_Tratamiento', 'Adoptado', 'Fallecido', 'En_Transito'];
  for (const nombre of nombres) {
    await prisma.estadoMascota.upsert({
      where: { nombre },
      update: {},
      create: { nombre, usuarioAlta },
    });
  }
}

async function seedEstadosSolicitud(usuarioAlta: number) {
  const nombres = ['Pendiente', 'En_Revision', 'Aprobada', 'Rechazada', 'Cancelada'];
  for (const nombre of nombres) {
    await prisma.estadoSolicitud.upsert({
      where: { nombre },
      update: {},
      create: { nombre, usuarioAlta },
    });
  }
}

async function seedEstadosCampania(usuarioAlta: number) {
  // Valores literales de MODELO_DATOS.md.
  const nombres = ['Inactiva', 'Activa', 'Finalizada', 'Cancelada'];
  for (const nombre of nombres) {
    await prisma.estadoCampania.upsert({
      where: { nombre },
      update: {},
      create: { nombre, usuarioAlta },
    });
  }
}

async function seedEstadosAnimalPerdido(usuarioAlta: number) {
  const nombres = ['Perdido', 'Encontrado', 'Resuelto'];
  for (const nombre of nombres) {
    await prisma.estadoAnimalPerdido.upsert({
      where: { nombre },
      update: {},
      create: { nombre, usuarioAlta },
    });
  }
}

async function seedRoles(usuarioAlta: number) {
  const nombres = ['Administrador', 'Refugio', 'Adoptante'];
  for (const nombre of nombres) {
    await prisma.rol.upsert({
      where: { nombre },
      update: {},
      create: { nombre, usuarioAlta },
    });
  }
}

async function seedTiposSolicitud(usuarioAlta: number) {
  // secuenciaDias de "Adopcion" = 180 (6 meses), confirmado por la regla de cancelación
  // automática (CONSTITUTION.md / ROADMAP.md Fase 4). El de "Transito" es un placeholder
  // sin confirmar — ajustar cuando se defina la regla de negocio de tránsito.
  await prisma.tipoSolicitud.upsert({
    where: { nombre: 'Adopcion' },
    update: {},
    create: { nombre: 'Adopcion', secuenciaDias: 180, usuarioAlta },
  });
  await prisma.tipoSolicitud.upsert({
    where: { nombre: 'Transito' },
    update: {},
    create: { nombre: 'Transito', secuenciaDias: 180, usuarioAlta },
  });
}

async function seedEspeciesYRazas(usuarioAlta: number) {
  const perro = await prisma.especie.upsert({
    where: { nombre: 'Perro' },
    update: {},
    create: { nombre: 'Perro', usuarioAlta },
  });
  const gato = await prisma.especie.upsert({
    where: { nombre: 'Gato' },
    update: {},
    create: { nombre: 'Gato', usuarioAlta },
  });

  const razasPerro = ['Mestizo', 'Labrador', 'Caniche', 'Bulldog'];
  for (const nombre of razasPerro) {
    await prisma.raza.upsert({
      where: { nombre_especieId: { nombre, especieId: perro.id } },
      update: {},
      create: { nombre, especieId: perro.id, usuarioAlta },
    });
  }

  const razasGato = ['Mestizo', 'Siames', 'Persa'];
  for (const nombre of razasGato) {
    await prisma.raza.upsert({
      where: { nombre_especieId: { nombre, especieId: gato.id } },
      update: {},
      create: { nombre, especieId: gato.id, usuarioAlta },
    });
  }
}

/**
 * Cuentas de prueba para poder usar la app de punta a punta mientras no exista el registro
 * real. Nacen verificadas porque crear mascotas exige tener DNI y teléfono verificados.
 * No se siembran en producción: son credenciales conocidas y fijas.
 */
async function seedUsuariosDePrueba(usuarioAlta: number, estadoActivoUsuarioId: number) {
  if (process.env.NODE_ENV === 'production') {
    console.log('⏭️  NODE_ENV=production: se omiten las cuentas de prueba.');
    return;
  }

  const contrasena = await bcrypt.hash('Pethood123', 10);

  const rolAdoptante = await prisma.rol.findUniqueOrThrow({ where: { nombre: 'Adoptante' } });
  const rolRefugio = await prisma.rol.findUniqueOrThrow({ where: { nombre: 'Refugio' } });
  const estadoRefugioActivo = await prisma.estadoRefugio.findUniqueOrThrow({
    where: { nombre: 'Activo' },
  });

  // Adoptante particular.
  const adoptante = await prisma.usuario.upsert({
    where: { email: 'adoptante@pethood.test' },
    update: {},
    create: {
      nombre: 'Ana',
      apellido: 'Gomez',
      email: 'adoptante@pethood.test',
      contrasena,
      telefono: '2611111111',
      dni: '30111222',
      verificado: true,
      estadoId: estadoActivoUsuarioId,
      usuarioAlta,
    },
  });
  await asignarRol(adoptante.id, rolAdoptante.id, usuarioAlta);

  // Refugio ya validado por el admin, con su usuario operativo.
  const refugio = await prisma.refugio.upsert({
    where: { id: 1 },
    update: {},
    create: {
      nombre: 'Refugio Patitas',
      direccion: 'Av. San Martín 1234, Mendoza',
      telefono: '2612222222',
      email: 'contacto@patitas.test',
      verificado: true,
      estadoId: estadoRefugioActivo.id,
      usuarioAlta,
    },
  });

  const usuarioRefugio = await prisma.usuario.upsert({
    where: { email: 'refugio@pethood.test' },
    update: {},
    create: {
      nombre: 'Bruno',
      apellido: 'Diaz',
      email: 'refugio@pethood.test',
      contrasena,
      telefono: '2613333333',
      dni: '28444555',
      verificado: true,
      refugioId: refugio.id,
      estadoId: estadoActivoUsuarioId,
      usuarioAlta,
    },
  });
  await asignarRol(usuarioRefugio.id, rolRefugio.id, usuarioAlta);

  console.log('🔑 Cuentas de prueba: adoptante@pethood.test / refugio@pethood.test — Pethood123');
}

/** RolUsuario no tiene índice único, así que el upsert se hace a mano. */
async function asignarRol(usuarioId: number, rolId: number, usuarioAlta: number) {
  const existente = await prisma.rolUsuario.findFirst({
    where: { usuarioId, rolId, fechaBaja: null },
  });
  if (existente) return;

  await prisma.rolUsuario.create({ data: { usuarioId, rolId, usuarioAlta } });
}

/**
 * Mascotas del refugio + sus publicaciones + favoritos del adoptante, para poder ver
 * GUI-12 (HU-6.6) con datos reales.
 *
 * Las mascotas son del refugio y no del adoptante a propósito: el backend rechaza guardar
 * en favoritos una mascota propia, así que sembrarlas al revés daría datos que la API
 * nunca habría aceptado.
 *
 * Cada mascota lleva publicación activa (es requisito para guardarla) y su fila de
 * Mascota_Estado, sin la cual el listado la descartaría por no tener estado vigente.
 *
 * Los estados son variados a propósito, para ver los distintos badges: HU-6.6 pide que una
 * mascota siga en la lista aunque cambie de estado.
 */
async function seedFavoritosDePrueba(usuarioAlta: number) {
  if (process.env.NODE_ENV === 'production') return;

  const adoptante = await prisma.usuario.findUnique({
    where: { email: 'adoptante@pethood.test' },
  });
  const usuarioRefugio = await prisma.usuario.findUnique({
    where: { email: 'refugio@pethood.test' },
  });

  if (!adoptante || !usuarioRefugio) return;

  const especiePerro = await prisma.especie.findUniqueOrThrow({ where: { nombre: 'Perro' } });
  const raza = await prisma.raza.findUniqueOrThrow({
    where: { nombre_especieId: { nombre: 'Mestizo', especieId: especiePerro.id } },
  });

  const hoy = new Date();
  const haceDias = (dias: number) => new Date(hoy.getTime() - dias * 24 * 60 * 60 * 1000);
  const cumpleHaceAnios = (anios: number) =>
    new Date(hoy.getFullYear() - anios, hoy.getMonth(), hoy.getDate());

  // Los tres primeros son los de GUI-12. Son 5 en total (impar) a propósito: así se ve que
  // la última tarjeta de la grilla de dos columnas conserva su mitad y no se estira.
  const catalogo = [
    { nombre: 'Max', anios: 2, estado: 'Disponible', guardadoHaceDias: 0 },
    { nombre: 'Luna', anios: 1, estado: 'Disponible', guardadoHaceDias: 1 },
    { nombre: 'Toby', anios: 4, estado: 'En_Transito', guardadoHaceDias: 3 },
    { nombre: 'Rocky', anios: 6, estado: 'En_Tratamiento', guardadoHaceDias: 8 },
    { nombre: 'Mia', anios: 3, estado: 'Adoptado', guardadoHaceDias: 20 },
  ];

  for (const item of catalogo) {
    const estado = await prisma.estadoMascota.findUniqueOrThrow({
      where: { nombre: item.estado },
    });

    // Mascota no tiene clave natural única, así que el upsert se hace a mano igual que en
    // asignarRol: se busca por (nombre, dueño) y recién si no está se crea.
    let mascota = await prisma.mascota.findFirst({
      where: { nombre: item.nombre, usuarioId: usuarioRefugio.id, fechaBaja: null },
    });

    if (!mascota) {
      mascota = await prisma.mascota.create({
        data: {
          nombre: item.nombre,
          fechaNacimiento: cumpleHaceAnios(item.anios),
          genero: item.nombre === 'Luna' || item.nombre === 'Mia' ? 'HEMBRA' : 'MACHO',
          castrado: true,
          descripcion: `${item.nombre} está esperando una familia.`,
          razaId: raza.id,
          refugioId: usuarioRefugio.refugioId,
          usuarioId: usuarioRefugio.id,
          usuarioAlta,
          historicoEstados: { create: { estadoMascotaId: estado.id, usuarioAlta } },
        },
      });
    }

    const publicacion = await prisma.publicacion.findFirst({
      where: { mascotaId: mascota.id, fechaBaja: null },
    });

    if (!publicacion) {
      await prisma.publicacion.create({
        data: {
          titulo: `${item.nombre} busca hogar`,
          descripcion: 'Publicación de prueba del seed.',
          ubicacion: 'Mendoza',
          requisitos: [],
          personalidad: [],
          vacunas: 'Al día',
          imagenes: [],
          mascotaId: mascota.id,
          usuarioId: usuarioRefugio.id,
          usuarioAlta,
        },
      });
    }

    const favorito = await prisma.favorito.findFirst({
      where: { usuarioId: adoptante.id, mascotaId: mascota.id, fechaBaja: null },
    });

    if (!favorito) {
      // `fechaAlta` escalonada: el listado ordena por ella y así se nota el orden.
      await prisma.favorito.create({
        data: {
          usuarioId: adoptante.id,
          mascotaId: mascota.id,
          usuarioAlta: adoptante.id,
          fechaAlta: haceDias(item.guardadoHaceDias),
        },
      });
    }
  }

  console.log(`⭐ Favoritos de prueba: ${catalogo.length} para adoptante@pethood.test`);
}

async function main() {
  // 1) EstadoUsuario primero: Usuario.estadoId lo necesita como FK real.
  await seedEstadosUsuario(1);
  const estadoActivo = await prisma.estadoUsuario.findUniqueOrThrow({
    where: { nombre: 'Activo' },
  });

  // 2) Usuario SISTEMA: autor de todo lo demás.
  const sistemaId = await seedUsuarioSistema(estadoActivo.id);

  // 3) Resto de catálogos, ya con el id real de SISTEMA.
  await seedEstadosRefugio(sistemaId);
  await seedEstadosMascota(sistemaId);
  await seedEstadosSolicitud(sistemaId);
  await seedEstadosCampania(sistemaId);
  await seedEstadosAnimalPerdido(sistemaId);
  await seedRoles(sistemaId);
  await seedTiposSolicitud(sistemaId);
  await seedEspeciesYRazas(sistemaId);

  // 4) Cuentas de prueba (solo fuera de producción): necesitan Rol y Estado_Refugio ya sembrados.
  await seedUsuariosDePrueba(sistemaId, estadoActivo.id);

  // 5) Datos de prueba de favoritos: dependen de las cuentas y de Especie/Raza/EstadoMascota.
  await seedFavoritosDePrueba(sistemaId);

  console.log(`✅ Seed completo. Usuario SISTEMA id=${sistemaId}`);
}

main()
  .catch((err) => {
    console.error('❌ Error corriendo el seed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

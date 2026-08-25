// Seed del módulo admin-usuarios (spec 002).
//
// Dos responsabilidades:
//  1. Agrega el valor `Suspendido` al catálogo Estado_Refugio (HU-2.2/2.4) — es un ajuste
//     de catálogo que no va en seed.ts para no imponerse a todo el mundo en el reset.
//  2. Siembra un lote grande de usuarios y refugios cubriendo todos los estados que el
//     panel admin filtra (Activo/Pendiente_Verificacion/Suspendido × verificado sí/no),
//     para probar paginación (>20 filas por listado), filtros y las acciones de
//     verificar/suspender/reactivar contra datos reales.
//
// Requiere haber corrido seed.ts antes (estados, roles y el usuario SISTEMA).
// Idempotente: se puede correr N veces (upsert por email, búsqueda por nombre).
// Se corre a mano: npx tsx prisma/seed-admin-usuarios.ts
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CONTRASENA_PRUEBA = 'Pethood123';
const CANTIDAD_REFUGIOS = 24;
const CANTIDAD_ADOPTANTES = 24;

const NOMBRES = [
  'Lucía',
  'Martín',
  'Sofía',
  'Diego',
  'Camila',
  'Javier',
  'Valentina',
  'Andrés',
  'Micaela',
  'Facundo',
  'Julieta',
  'Gonzalo',
  'Rocío',
  'Nicolás',
  'Agustina',
  'Emiliano',
];
const APELLIDOS = [
  'Fernández',
  'Rodríguez',
  'Sosa',
  'Pereyra',
  'Aguirre',
  'Molina',
  'Castro',
  'Ortega',
];

const PREFIJOS_REFUGIO = [
  'Huellitas',
  'Garritas',
  'Colitas',
  'Amigos de Cuatro Patas',
  'El Hogar de Tomás',
  'Vida Animal',
  'Segunda Oportunidad',
  'Corazón Mendoza',
  'La Casita de Fierro',
  'Puertas Abiertas',
  'Manada Feliz',
  'Despertar Animal',
];
const LOCALIDADES_REFUGIO = ['Mendoza', 'Maipú', 'Luján de Cuyo', 'Godoy Cruz'];

/**
 * Escenarios por índice, ciclando para que cualquier página del listado mezcle casos:
 *  0 → Activo verificado | 1 → Activo sin verificar | 2 → Pendiente con DNI y teléfono
 *  (se puede verificar desde la API) | 3 → Pendiente sin teléfono (DATOS_INCOMPLETOS)
 *  4 → Suspendido
 */
function escenarioAdoptante(i: number) {
  switch (i % 5) {
    case 1:
      return { estado: 'Activo', verificado: false };
    case 2:
      return { estado: 'Pendiente_Verificacion', verificado: false };
    case 3:
      return { estado: 'Pendiente_Verificacion', verificado: false, sinTelefono: true };
    case 4:
      return { estado: 'Suspendido', verificado: true };
    default:
      return { estado: 'Activo', verificado: true };
  }
}

/**
 * Estados de refugio por índice: los dos primeros ciclos son Activo (verificado sí/no),
 * después Pendiente_Verificacion (nunca verificado) y Suspendido (verificado variando,
 * porque un refugio se suspende después de haber sido validado).
 */
function escenarioRefugio(i: number) {
  switch (i % 4) {
    case 1:
      return { estado: 'Activo', verificado: false };
    case 2:
      return { estado: 'Pendiente_Verificacion', verificado: false };
    case 3:
      return { estado: 'Suspendido', verificado: i % 8 === 3 };
    default:
      return { estado: 'Activo', verificado: true };
  }
}

/** RolUsuario no tiene índice único, así que el upsert se hace a mano (igual que seed.ts). */
async function asignarRol(usuarioId: number, rolId: number, usuarioAlta: number) {
  const existente = await prisma.rolUsuario.findFirst({
    where: { usuarioId, rolId, fechaBaja: null },
  });
  if (existente) return;

  await prisma.rolUsuario.create({ data: { usuarioId, rolId, usuarioAlta } });
}

async function main() {
  const sistema = await prisma.usuario.findUniqueOrThrow({
    where: { email: 'sistema@pethood.internal' },
  });

  // ── 1) Catálogo: Estado_Refugio.Suspendido (lo original de este seed) ──
  await prisma.estadoRefugio.upsert({
    where: { nombre: 'Suspendido' },
    update: {},
    create: { nombre: 'Suspendido', usuarioAlta: sistema.id },
  });

  if (process.env.NODE_ENV === 'production') {
    console.log('⏭️  NODE_ENV=production: se omiten los datos masivos de prueba.');
    return;
  }

  // ── 2) Catálogos necesarios (sembrados por seed.ts) ──
  const contrasena = await bcrypt.hash(CONTRASENA_PRUEBA, 10);
  const rolAdoptante = await prisma.rol.findUniqueOrThrow({ where: { nombre: 'Adoptante' } });
  const rolRefugio = await prisma.rol.findUniqueOrThrow({ where: { nombre: 'Refugio' } });
  const estadoUsuarioActivo = await prisma.estadoUsuario.findUniqueOrThrow({
    where: { nombre: 'Activo' },
  });
  const estadosUsuario = await Promise.all(
    ['Activo', 'Pendiente_Verificacion', 'Suspendido'].map((nombre) =>
      prisma.estadoUsuario.findUniqueOrThrow({ where: { nombre } }),
    ),
  );
  const estadosRefugio = await Promise.all(
    ['Activo', 'Pendiente_Verificacion', 'Suspendido'].map((nombre) =>
      prisma.estadoRefugio.findUniqueOrThrow({ where: { nombre } }),
    ),
  );

  // ── 3) Refugios + su operador ──
  // Refugio no tiene clave natural única: la búsqueda por nombre hace las veces de upsert.
  let nuevosRefugios = 0;

  for (let i = 1; i <= CANTIDAD_REFUGIOS; i += 1) {
    const prefijo = PREFIJOS_REFUGIO[i % PREFIJOS_REFUGIO.length];
    const localidad = LOCALIDADES_REFUGIO[Math.floor(i / PREFIJOS_REFUGIO.length)];
    const nombre = `${prefijo} de ${localidad}`;
    const escenario = escenarioRefugio(i);
    const estadoId = estadosRefugio.find((e) => e.nombre === escenario.estado)!.id;

    let refugio = await prisma.refugio.findFirst({ where: { nombre, fechaBaja: null } });

    if (!refugio) {
      refugio = await prisma.refugio.create({
        data: {
          nombre,
          direccion: `Calle ${i * 37} ${100 + i}, ${localidad}`,
          telefono: `2614${String(500000 + i * 137).slice(0, 6)}`,
          email: `contacto${i}@refugios.test`,
          descripcion: `Refugio de prueba ${i} para el panel de administración.`,
          verificado: escenario.verificado,
          estadoId,
          usuarioAlta: sistema.id,
        },
      });
      nuevosRefugios += 1;
    }

    // Operador del refugio: siempre Activo y verificado, como quedaría tras el alta admin.
    const emailOperador = `operador${i}@pethood.test`;
    const operador = await prisma.usuario.upsert({
      where: { email: emailOperador },
      update: {},
      create: {
        nombre: NOMBRES[i % NOMBRES.length],
        apellido: APELLIDOS[i % APELLIDOS.length],
        email: emailOperador,
        contrasena,
        telefono: `2615${String(600000 + i * 91).slice(0, 6)}`,
        dni: String(42000000 + i * 17),
        verificado: true,
        refugioId: refugio.id,
        estadoId: estadoUsuarioActivo.id,
        usuarioAlta: sistema.id,
      },
    });
    await asignarRol(operador.id, rolRefugio.id, sistema.id);
  }

  // ── 4) Adoptantes en distintos estados ──
  for (let i = 1; i <= CANTIDAD_ADOPTANTES; i += 1) {
    const escenario = escenarioAdoptante(i);
    const estadoId = estadosUsuario.find((e) => e.nombre === escenario.estado)!.id;
    const sinTelefono = 'sinTelefono' in escenario;

    await prisma.usuario.upsert({
      where: { email: `vecino${i}@pethood.test` },
      update: {},
      create: {
        nombre: NOMBRES[(i * 3) % NOMBRES.length],
        apellido: APELLIDOS[(i * 5) % APELLIDOS.length],
        email: `vecino${i}@pethood.test`,
        contrasena,
        telefono: sinTelefono ? null : `2616${String(700000 + i * 53).slice(0, 6)}`,
        dni: sinTelefono ? String(36000000 + i * 19) : String(35000000 + i * 23),
        verificado: escenario.verificado,
        estadoId,
        usuarioAlta: sistema.id,
      },
    });
    // El rol se asigna aparte porque upsert no lo cubre.
    const vecino = await prisma.usuario.findUniqueOrThrow({
      where: { email: `vecino${i}@pethood.test` },
    });
    await asignarRol(vecino.id, rolAdoptante.id, sistema.id);
  }

  // ── 5) Usuario multirol: adoptante que además pertenece a un refugio ──
  // Sirve para probar HU-2.1 (gestión de roles múltiples) desde el panel.
  const primerRefugio = await prisma.refugio.findFirstOrThrow({
    where: { nombre: { startsWith: PREFIJOS_REFUGIO[0] }, fechaBaja: null },
    orderBy: { id: 'asc' },
  });
  const multirol = await prisma.usuario.upsert({
    where: { email: 'multirol@pethood.test' },
    update: {},
    create: {
      nombre: 'Bruna',
      apellido: 'Salvatierra',
      email: 'multirol@pethood.test',
      contrasena,
      telefono: '2617777777',
      dni: '39999999',
      verificado: true,
      refugioId: primerRefugio.id,
      estadoId: estadoUsuarioActivo.id,
      usuarioAlta: sistema.id,
    },
  });
  await asignarRol(multirol.id, rolAdoptante.id, sistema.id);
  await asignarRol(multirol.id, rolRefugio.id, sistema.id);

  console.log('✅ Estado_Refugio.Suspendido sembrado.');
  console.log(`🏠 Refugios de prueba: ${CANTIDAD_REFUGIOS} (${nuevosRefugios} nuevos)`);
  console.log(
    `👥 Usuarios de prueba: ${CANTIDAD_REFUGIOS} operadores + ${CANTIDAD_ADOPTANTES} vecinos + 1 multirol`,
  );
  console.log(`🔑 Contraseña de todas las cuentas nuevas: ${CONTRASENA_PRUEBA}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

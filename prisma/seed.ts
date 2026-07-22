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

async function main() {
  // 1) EstadoUsuario primero: Usuario.estadoId lo necesita como FK real.
  await seedEstadosUsuario(1);
  const estadoActivo = await prisma.estadoUsuario.findUniqueOrThrow({ where: { nombre: 'Activo' } });

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

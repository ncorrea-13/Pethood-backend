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

/**
 * Mascotas publicadas para el feed de adopción.
 *
 * Son distintas de las de `seedFavoritosDePrueba` a propósito: el feed excluye lo que el
 * usuario ya guardó, así que si se reusaran esas cinco la pantalla arrancaría en el estado
 * vacío. Los atributos están variados para que los filtros de búsqueda tengan algo que
 * recortar: hay perros y gatos, los tres tamaños, ambos sexos y edades en los cuatro rangos.
 *
 * Las fotos son de Unsplash porque el seed no puede subir archivos al storage local; el
 * cliente las usa tal cual al ser absolutas. Cambiarlas por fotos propias es solo editar
 * esta lista.
 */
async function seedFeedDeAdopcion(usuarioAlta: number) {
  if (process.env.NODE_ENV === 'production') return;

  const usuarioRefugio = await prisma.usuario.findUnique({
    where: { email: 'refugio@pethood.test' },
  });

  if (!usuarioRefugio) return;

  const disponible = await prisma.estadoMascota.findUniqueOrThrow({
    where: { nombre: 'Disponible' },
  });

  const foto = (id: string) => `https://images.unsplash.com/${id}?w=1200&q=80`;

  const catalogo = [
    {
      nombre: 'Nala',
      especie: 'Perro',
      raza: 'Labrador',
      tamanio: 'GRANDE' as const,
      genero: 'HEMBRA' as const,
      anios: 2,
      castrada: true,
      personalidad: ['Juguetón', 'Cariñoso', 'Bueno con chicos'],
      requisitos: ['Casa con patio', 'Tiempo para paseos diarios'],
      vacunas: 'Rabia, Parvovirus, Moquillo',
      descripcion:
        'Nala llegó al refugio hace ocho meses después de que la encontraran sola en la ruta. ' +
        'Es una labradora enorme y torpe que todavía no entiende que ya no entra en ninguna falda. ' +
        'Aprende rapidísimo, ya sabe sentarse y dar la pata, y se lleva bien con todos los chicos ' +
        'que la visitan.',
      fotos: [
        'photo-1552053831-71594a27632d',
        'photo-1543466835-00a7907e9de1',
        'photo-1561037404-61cd46aa615b',
        'photo-1517423440428-a5a00ad493e8',
      ],
    },
    {
      nombre: 'Pipo',
      especie: 'Perro',
      raza: 'Caniche',
      tamanio: 'PEQUENO' as const,
      genero: 'MACHO' as const,
      anios: 8,
      castrada: true,
      personalidad: ['Tranquilo', 'Cariñoso', 'Bueno con otras mascotas'],
      requisitos: ['Ambiente tranquilo'],
      vacunas: 'Rabia, Quíntuple',
      descripcion:
        'Pipo es un señor mayor que ya hizo todo lo que tenía que hacer en la vida y ahora solo ' +
        'quiere un sillón cerca de una ventana. Duerme la mayor parte del día, camina despacio y ' +
        'convive sin problema con otros perros y con gatos. Busca una casa donde envejecer tranquilo.',
      fotos: [
        'photo-1591160690555-5debfba289f0',
        'photo-1526336024174-e58f5cdd8e13',
        'photo-1548199973-03cce0bbc87b',
      ],
    },
    {
      nombre: 'Simba',
      especie: 'Gato',
      raza: 'Siames',
      tamanio: 'PEQUENO' as const,
      genero: 'MACHO' as const,
      anios: 1,
      castrada: false,
      personalidad: ['Activo', 'Independiente', 'Juguetón'],
      requisitos: ['Balcón cerrado o red de protección'],
      vacunas: 'Triple felina',
      descripcion:
        'Simba tiene un año y la energía de tres gatos juntos. Se trepa a todo, abre puertas de ' +
        'placard y ya rompió dos macetas. Necesita una casa con ventanas protegidas y gente que le ' +
        'siga el ritmo. A cambio duerme sobre tu cabeza todas las noches.',
      fotos: [
        'photo-1514888286974-6c03e2ca1dba',
        'photo-1495360010541-f48722b34f7d',
        'photo-1518791841217-8f162f1e1131',
        'photo-1583337130417-3346a1be7dee',
        'photo-1596492784531-6e6eb5ea9993',
      ],
    },
    {
      nombre: 'Coco',
      especie: 'Perro',
      raza: 'Mestizo',
      tamanio: 'MEDIANO' as const,
      genero: 'MACHO' as const,
      anios: 4,
      castrada: true,
      personalidad: ['Sociable', 'Protector', 'Bueno con chicos', 'Bueno con otras mascotas'],
      requisitos: ['Familia con experiencia en perros medianos'],
      vacunas: 'Rabia, Séxtuple',
      descripcion:
        'Coco es el perro más equilibrado del refugio: ni tímido ni desbordado. Camina bien con ' +
        'correa, saluda a todo el mundo y se acuesta solo cuando ve que bajás el ritmo. Convive con ' +
        'perros, gatos y chicos sin que haya que explicarle nada.',
      fotos: [
        'photo-1568572933382-74d440642117',
        'photo-1587300003388-59208cc962cb',
        'photo-1601979031925-424e53b6caaa',
      ],
    },
    {
      nombre: 'Kira',
      especie: 'Gato',
      raza: 'Mestizo',
      tamanio: 'PEQUENO' as const,
      genero: 'HEMBRA' as const,
      anios: 5,
      castrada: true,
      personalidad: ['Tranquilo', 'Independiente'],
      requisitos: ['Casa sin perros'],
      vacunas: 'Triple felina, Rabia',
      descripcion:
        'Kira tarda en confiar, pero cuando lo hace no se despega. Prefiere una casa sin perros y ' +
        'sin demasiado movimiento. Le gusta mirar por la ventana durante horas y pide upa solo ' +
        'cuando ella lo decide.',
      fotos: [
        'photo-1596492784531-6e6eb5ea9993',
        'photo-1583337130417-3346a1be7dee',
        'photo-1514888286974-6c03e2ca1dba',
      ],
    },
    {
      nombre: 'Rocco',
      especie: 'Perro',
      raza: 'Bulldog',
      tamanio: 'MEDIANO' as const,
      genero: 'MACHO' as const,
      anios: 0,
      castrada: false,
      personalidad: ['Juguetón', 'Activo', 'Bueno con chicos'],
      requisitos: ['Disponibilidad para educar un cachorro', 'Control veterinario periódico'],
      vacunas: 'Primera dosis aplicada',
      descripcion:
        'Rocco tiene siete meses y todavía está aprendiendo todo. Muerde lo que encuentra, se ' +
        'emociona con cada visita y duerme profundo apenas se cansa. Necesita una familia con ' +
        'paciencia para acompañarlo en el primer año, que es el que más trabajo da.',
      fotos: [
        'photo-1601979031925-424e53b6caaa',
        'photo-1517423440428-a5a00ad493e8',
        'photo-1543466835-00a7907e9de1',
        'photo-1561037404-61cd46aa615b',
        'photo-1568572933382-74d440642117',
        'photo-1552053831-71594a27632d',
      ],
    },
  ];

  const hoy = new Date();
  // Los cachorros se guardan con meses y no con años, para que caigan en el rango 0–1.
  const cumpleHace = (anios: number) =>
    anios === 0
      ? new Date(hoy.getFullYear(), hoy.getMonth() - 7, hoy.getDate())
      : new Date(hoy.getFullYear() - anios, hoy.getMonth(), hoy.getDate());

  let creadas = 0;

  for (const item of catalogo) {
    const especie = await prisma.especie.findUniqueOrThrow({ where: { nombre: item.especie } });
    const raza = await prisma.raza.findUniqueOrThrow({
      where: { nombre_especieId: { nombre: item.raza, especieId: especie.id } },
    });

    const imagenes = item.fotos.map(foto);

    let mascota = await prisma.mascota.findFirst({
      where: { nombre: item.nombre, usuarioId: usuarioRefugio.id, fechaBaja: null },
    });

    if (!mascota) {
      mascota = await prisma.mascota.create({
        data: {
          nombre: item.nombre,
          fechaNacimiento: cumpleHace(item.anios),
          genero: item.genero,
          tamanio: item.tamanio,
          castrado: item.castrada,
          descripcion: item.descripcion,
          imagenUrl: imagenes[0],
          razaId: raza.id,
          refugioId: usuarioRefugio.refugioId,
          usuarioId: usuarioRefugio.id,
          usuarioAlta,
          historicoEstados: { create: { estadoMascotaId: disponible.id, usuarioAlta } },
        },
      });
      creadas += 1;
    }

    const publicacion = await prisma.publicacion.findFirst({
      where: { mascotaId: mascota.id, fechaBaja: null },
    });

    if (!publicacion) {
      await prisma.publicacion.create({
        data: {
          titulo: `${item.nombre} busca hogar`,
          descripcion: item.descripcion,
          ubicacion: 'Mendoza',
          requisitos: item.requisitos,
          personalidad: item.personalidad,
          desparasitado: true,
          vacunas: item.vacunas,
          imagenes,
          imagenUrl: imagenes[0],
          mascotaId: mascota.id,
          usuarioId: usuarioRefugio.id,
          usuarioAlta,
        },
      });
    }
  }

  console.log(`🐾 Feed de adopción: ${catalogo.length} publicaciones (${creadas} mascotas nuevas)`);
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

  // 6) Mascotas publicadas para el feed de adopción, que no están en favoritos.
  await seedFeedDeAdopcion(sistemaId);

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

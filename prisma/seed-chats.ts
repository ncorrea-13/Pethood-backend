// Fixtures para ver el listado de conversaciones de HU-5.1 (GUI-08 / GUI-31) con datos reales.
//
// Deliberadamente separado de seed.ts, igual que los seeds de dashboard: `prisma db seed` /
// `migrate reset` corren seed.ts para todo el equipo, y estos datos son solo para desarrollar
// el chat. Se corre a mano, DESPUÉS de `npm run seed`:
//
//     npx tsx prisma/seed-chats.ts
//
// Reutiliza las cuentas de seed.ts (adoptante@pethood.test, refugio@pethood.test, Refugio
// Patitas) y crea las contrapartes que faltaban. Idempotente: cada chat se busca por sus
// participantes antes de crearlo, así se puede correr las veces que haga falta.
//
// Los mensajes se fechan RELATIVO al momento de correrlo, para que el listado muestre los
// distintos tramos de tiempo relativo del criterio 6 sin importar cuándo se siembre.
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const MINUTO = 60_000;
const HORA = 60 * MINUTO;
const DIA = 24 * HORA;

const hace = (ms: number): Date => new Date(Date.now() - ms);

/**
 * Ayer a las 00:01, que es la forma confiable de caer en el tramo "Ayer": el criterio 6 lo
 * define como MÁS de 24 h Y día calendario anterior, y las dos cosas se cumplen a la vez
 * solo si la hora del mensaje es anterior a la hora actual. A las 00:01 siempre lo es.
 */
function ayerTemprano(): Date {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() - 1);
  fecha.setHours(0, 1, 0, 0);
  return fecha;
}

interface Mensaje {
  /** Quién lo mandó: 'yo' es el adoptante de prueba, 'otro' es la contraparte. */
  de: 'yo' | 'otro';
  contenido: string;
  fecha: Date;
  leido?: boolean;
  imagenUrl?: string;
}

async function main() {
  if (process.env.NODE_ENV === 'production') {
    console.log('⏭️  NODE_ENV=production: seed-chats no corre (son datos de prueba).');
    return;
  }

  const sistema = await prisma.usuario.findUniqueOrThrow({
    where: { email: 'sistema@pethood.internal' },
  });
  const ana = await prisma.usuario.findUniqueOrThrow({
    where: { email: 'adoptante@pethood.test' },
  });
  const bruno = await prisma.usuario.findUniqueOrThrow({
    where: { email: 'refugio@pethood.test' },
  });
  const patitas = await prisma.refugio.findUniqueOrThrow({ where: { id: 1 } });

  const usuarioAlta = sistema.id;

  // Contrapartes que seed.ts no crea.
  const carla = await crearAdoptante(usuarioAlta, {
    nombre: 'Carla',
    apellido: 'Ruiz',
    email: 'carla@pethood.test',
    dni: '31222333',
  });

  // Cuenta dada de baja: el chat tiene que seguir visible, con el contacto inactivo.
  const diego = await crearAdoptante(usuarioAlta, {
    nombre: 'Diego',
    apellido: 'Fernandez',
    email: 'diego@pethood.test',
    dni: '31333444',
    baja: true,
  });

  const elena = await crearAdoptante(usuarioAlta, {
    nombre: 'Elena',
    apellido: 'Martinez',
    email: 'elena@pethood.test',
    dni: '31444555',
  });

  // Segundo refugio, con nombre largo a propósito: es el que prueba el truncado con elipsis
  // de los criterios 4 y 5.
  const huellitas = await crearRefugio(
    usuarioAlta,
    'Asociación Civil Huellitas del Sur de Mendoza',
  );
  const nico = await crearAdoptante(usuarioAlta, {
    nombre: 'Nico',
    apellido: 'Peralta',
    email: 'huellitas@pethood.test',
    dni: '31555666',
    refugioId: huellitas.id,
  });

  // Tercer refugio, para el caso de sala abierta sin ningún mensaje.
  const sinMensajes = await crearRefugio(usuarioAlta, 'Refugio Cuatro Patas');
  const sofia = await crearAdoptante(usuarioAlta, {
    nombre: 'Sofia',
    apellido: 'Lopez',
    email: 'cuatropatas@pethood.test',
    dni: '31666777',
    refugioId: sinMensajes.id,
  });

  // ── Los chats. Ordenados como los va a devolver la API: del más reciente al más viejo.

  await crearChat({
    marca: 'seed-chat-refugio-patitas',
    usuarioAlta,
    yo: ana.id,
    otro: bruno.id,
    refugioId: patitas.id,
    mensajes: [
      {
        de: 'yo',
        contenido: '¡Hola! Vi a Kiwi en la app, ¿sigue disponible?',
        fecha: hace(4 * HORA),
        leido: true,
      },
      {
        de: 'otro',
        contenido: 'Hola Ana, sí, sigue disponible',
        fecha: hace(3 * HORA),
        leido: true,
      },
      {
        de: 'otro',
        contenido: '¿Te queda cómodo venir el sábado a la mañana?',
        fecha: hace(8 * MINUTO),
      },
      {
        de: 'otro',
        contenido: 'Podés venir cuando quieras entre 10 y 13',
        fecha: hace(5 * MINUTO),
      },
      { de: 'otro', contenido: 'Dale, te espero el sábado a las 10', fecha: hace(3 * MINUTO) },
    ],
  });

  // Sin refugio: coordinación entre adoptantes por una mascota perdida (HU-13.2).
  // El último mensaje es de Ana, así que el listado le muestra "Vos: ...".
  await crearChat({
    marca: 'seed-chat-perdido-carla',
    usuarioAlta,
    yo: ana.id,
    otro: carla.id,
    refugioId: null,
    mensajes: [
      {
        de: 'otro',
        contenido: 'Creo que vi a tu perro por el parque San Martín',
        fecha: hace(3 * HORA),
        leido: true,
      },
      { de: 'yo', contenido: 'Gracias! Voy para allá ahora', fecha: hace(2 * HORA), leido: true },
    ],
  });

  // Mensaje de SOLO FOTO (contenido vacío + imagen) y contador por encima de 99,
  // para ver el "99+" del badge.
  await crearChat({
    marca: 'seed-chat-huellitas-largo',
    usuarioAlta,
    yo: ana.id,
    otro: nico.id,
    refugioId: huellitas.id,
    mensajes: [
      ...Array.from({ length: 127 }, (_, i): Mensaje => ({
        de: 'otro',
        contenido: `Mensaje de prueba ${i + 1} para pasar el tope del badge`,
        fecha: hace(9 * HORA - i * MINUTO),
      })),
      {
        de: 'otro',
        contenido: '',
        imagenUrl: '/api/v1/archivos/mensajes/patio.jpg',
        fecha: hace(5 * HORA),
      },
    ],
  });

  // Contraparte dada de baja + tramo "Ayer".
  await crearChat({
    marca: 'seed-chat-usuario-baja',
    usuarioAlta,
    yo: ana.id,
    otro: diego.id,
    refugioId: null,
    mensajes: [
      {
        de: 'yo',
        contenido: '¿Seguís interesado en la gatita?',
        fecha: hace(3 * DIA),
        leido: true,
      },
      { de: 'otro', contenido: 'Sí, te confirmo mañana', fecha: ayerTemprano() },
    ],
  });

  // Sala abierta y todavía sin ningún mensaje: aparece igual, con el preview vacío y
  // ordenada por su fecha de creación.
  await crearChat({
    marca: 'seed-chat-sin-mensajes',
    usuarioAlta,
    yo: ana.id,
    otro: sofia.id,
    refugioId: sinMensajes.id,
    fechaAlta: hace(2 * DIA),
    mensajes: [],
  });

  // Tramo "Hace X días".
  await crearChat({
    marca: 'seed-chat-elena-vieja',
    usuarioAlta,
    yo: ana.id,
    otro: elena.id,
    refugioId: null,
    mensajes: [
      {
        de: 'otro',
        contenido: 'Perfecto, quedamos así entonces',
        fecha: hace(4 * DIA),
        leido: true,
      },
    ],
  });

  console.log('');
  console.log('✅ seed-chats completo. Entrá a la pestaña Chat con:');
  console.log('   • adoptante@pethood.test  (GUI-08) — ve 6 conversaciones');
  console.log('   • refugio@pethood.test    (GUI-31) — ve la conversación con Ana Gomez');
  console.log('   Contraseña de todas las cuentas: Pethood123');
}

interface DatosAdoptante {
  nombre: string;
  apellido: string;
  email: string;
  dni: string;
  refugioId?: number;
  /** Da de baja la cuenta, para probar el contacto inactivo del listado. */
  baja?: boolean;
}

async function crearAdoptante(usuarioAlta: number, datos: DatosAdoptante) {
  const existente = await prisma.usuario.findUnique({ where: { email: datos.email } });
  if (existente) return existente;

  const estadoActivo = await prisma.estadoUsuario.findUniqueOrThrow({
    where: { nombre: 'Activo' },
  });
  const rol = await prisma.rol.findUniqueOrThrow({
    where: { nombre: datos.refugioId ? 'Refugio' : 'Adoptante' },
  });

  const usuario = await prisma.usuario.create({
    data: {
      nombre: datos.nombre,
      apellido: datos.apellido,
      email: datos.email,
      dni: datos.dni,
      contrasena: await bcrypt.hash('Pethood123', 10),
      verificado: true,
      estadoId: estadoActivo.id,
      refugioId: datos.refugioId,
      usuarioAlta,
      // Baja lógica, nunca DELETE: el chat sigue existiendo y el listado lo marca inactivo.
      ...(datos.baja ? { usuarioBaja: usuarioAlta, fechaBaja: new Date() } : {}),
    },
  });

  await prisma.rolUsuario.create({ data: { usuarioId: usuario.id, rolId: rol.id, usuarioAlta } });

  return usuario;
}

async function crearRefugio(usuarioAlta: number, nombre: string) {
  const existente = await prisma.refugio.findFirst({ where: { nombre } });
  if (existente) return existente;

  const estadoActivo = await prisma.estadoRefugio.findUniqueOrThrow({
    where: { nombre: 'Activo' },
  });

  return prisma.refugio.create({
    data: {
      nombre,
      direccion: 'Av. Las Heras 500, Mendoza',
      verificado: true,
      estadoId: estadoActivo.id,
      usuarioAlta,
    },
  });
}

interface DatosChat {
  /** Solo para el log del seed. NO se escribe en la base. */
  marca: string;
  usuarioAlta: number;
  yo: number;
  otro: number;
  refugioId: number | null;
  mensajes: Mensaje[];
  /** Para la sala sin mensajes, que se ordena por su propia fecha de alta. */
  fechaAlta?: Date;
}

/**
 * La idempotencia va por la clave natural —los dos participantes activos más el refugio—
 * y NO por una marca en `chat_tipo`: los valores de esa columna siguen sin definirse
 * (MODELO_DATOS.md pide confirmarlos con el equipo) y el acuerdo fue no escribirla hasta
 * entonces. Un seed no es excusa para meter datos en un campo cuyo dominio nadie fijó.
 */
function buscarChatExistente(yo: number, otro: number, refugioId: number | null) {
  return prisma.chat.findFirst({
    where: {
      refugioId,
      fechaBaja: null,
      AND: [
        { participantes: { some: { usuarioId: yo, fechaBaja: null } } },
        { participantes: { some: { usuarioId: otro, fechaBaja: null } } },
      ],
    },
  });
}

async function crearChat(datos: DatosChat) {
  const { marca, usuarioAlta, yo, otro, refugioId, mensajes, fechaAlta } = datos;

  if (await buscarChatExistente(yo, otro, refugioId)) {
    console.log(`⏭️  ${marca} ya existe`);
    return;
  }

  const chat = await prisma.chat.create({
    data: {
      refugioId,
      usuarioAlta,
      ...(fechaAlta ? { fechaAlta } : {}),
    },
  });

  // Los DOS participantes llevan fila en UsuarioChat, incluido el miembro del refugio: es
  // la única tabla de pertenencia, y sin su fila el refugio no vería la sala en GUI-31.
  await prisma.usuarioChat.createMany({
    data: [
      { chatId: chat.id, usuarioId: yo, usuarioAlta },
      { chatId: chat.id, usuarioId: otro, usuarioAlta },
    ],
  });

  if (mensajes.length > 0) {
    await prisma.mensaje.createMany({
      data: mensajes.map((mensaje) => {
        const emisor = mensaje.de === 'yo' ? yo : otro;

        return {
          chatId: chat.id,
          usuarioId: emisor,
          contenido: mensaje.contenido,
          imagenUrl: mensaje.imagenUrl,
          // Los propios nunca cuentan como no leídos, así que da igual su valor; los
          // ajenos sin `leido` son justamente los que alimentan el badge.
          leido: mensaje.leido ?? false,
          usuarioAlta: emisor,
          fechaAlta: mensaje.fecha,
        };
      }),
    });
  }

  console.log(`✅ ${marca} (${mensajes.length} mensajes)`);
}

main()
  .catch((err) => {
    console.error('❌ seed-chats falló:', err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

-- CreateEnum
CREATE TYPE "GeneroMascota" AS ENUM ('MACHO', 'HEMBRA');

-- CreateTable
CREATE TABLE "especie" (
    "especie_id" SERIAL NOT NULL,
    "especie_nombre" TEXT NOT NULL,
    "especie_descripcion" TEXT,
    "especie_usuario_alta" INTEGER NOT NULL,
    "especie_fecha_alta" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "especie_usuario_modificacion" INTEGER,
    "especie_fecha_modificacion" TIMESTAMP(3),
    "especie_usuario_baja" INTEGER,
    "especie_fecha_baja" TIMESTAMP(3),

    CONSTRAINT "especie_pkey" PRIMARY KEY ("especie_id")
);

-- CreateTable
CREATE TABLE "raza" (
    "raza_id" SERIAL NOT NULL,
    "raza_nombre" TEXT NOT NULL,
    "especie_id" INTEGER NOT NULL,
    "raza_usuario_alta" INTEGER NOT NULL,
    "raza_fecha_alta" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "raza_usuario_modificacion" INTEGER,
    "raza_fecha_modificacion" TIMESTAMP(3),
    "raza_usuario_baja" INTEGER,
    "raza_fecha_baja" TIMESTAMP(3),

    CONSTRAINT "raza_pkey" PRIMARY KEY ("raza_id")
);

-- CreateTable
CREATE TABLE "estado_mascota" (
    "estado_mascota_id" SERIAL NOT NULL,
    "estado_mascota_nombre" TEXT NOT NULL,
    "estado_mascota_descripcion" TEXT,
    "estado_mascota_usuario_alta" INTEGER NOT NULL,
    "estado_mascota_fecha_alta" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado_mascota_usuario_modificacion" INTEGER,
    "estado_mascota_fecha_modificacion" TIMESTAMP(3),
    "estado_mascota_usuario_baja" INTEGER,
    "estado_mascota_fecha_baja" TIMESTAMP(3),

    CONSTRAINT "estado_mascota_pkey" PRIMARY KEY ("estado_mascota_id")
);

-- CreateTable
CREATE TABLE "estado_usuario" (
    "estado_usuario_id" SERIAL NOT NULL,
    "estado_usuario_nombre" TEXT NOT NULL,
    "estado_usuario_descripcion" TEXT,
    "estado_usuario_usuario_alta" INTEGER NOT NULL,
    "estado_usuario_fecha_alta" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado_usuario_usuario_modificacion" INTEGER,
    "estado_usuario_fecha_modificacion" TIMESTAMP(3),
    "estado_usuario_usuario_baja" INTEGER,
    "estado_usuario_fecha_baja" TIMESTAMP(3),

    CONSTRAINT "estado_usuario_pkey" PRIMARY KEY ("estado_usuario_id")
);

-- CreateTable
CREATE TABLE "estado_refugio" (
    "estado_refugio_id" SERIAL NOT NULL,
    "estado_refugio_nombre" TEXT NOT NULL,
    "estado_refugio_descripcion" TEXT,
    "estado_refugio_usuario_alta" INTEGER NOT NULL,
    "estado_refugio_fecha_alta" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado_refugio_usuario_modificacion" INTEGER,
    "estado_refugio_fecha_modificacion" TIMESTAMP(3),
    "estado_refugio_usuario_baja" INTEGER,
    "estado_refugio_fecha_baja" TIMESTAMP(3),

    CONSTRAINT "estado_refugio_pkey" PRIMARY KEY ("estado_refugio_id")
);

-- CreateTable
CREATE TABLE "estado_solicitud" (
    "estado_solicitud_id" SERIAL NOT NULL,
    "estado_solicitud_nombre" TEXT NOT NULL,
    "estado_solicitud_descripcion" TEXT,
    "estado_solicitud_usuario_alta" INTEGER NOT NULL,
    "estado_solicitud_fecha_alta" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado_solicitud_usuario_modificacion" INTEGER,
    "estado_solicitud_fecha_modificacion" TIMESTAMP(3),
    "estado_solicitud_usuario_baja" INTEGER,
    "estado_solicitud_fecha_baja" TIMESTAMP(3),

    CONSTRAINT "estado_solicitud_pkey" PRIMARY KEY ("estado_solicitud_id")
);

-- CreateTable
CREATE TABLE "estado_campania" (
    "estado_campania_id" SERIAL NOT NULL,
    "estado_campania_nombre" TEXT NOT NULL,
    "estado_campania_descripcion" TEXT,
    "estado_campania_usuario_alta" INTEGER NOT NULL,
    "estado_campania_fecha_alta" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado_campania_usuario_modificacion" INTEGER,
    "estado_campania_fecha_modificacion" TIMESTAMP(3),
    "estado_campania_usuario_baja" INTEGER,
    "estado_campania_fecha_baja" TIMESTAMP(3),

    CONSTRAINT "estado_campania_pkey" PRIMARY KEY ("estado_campania_id")
);

-- CreateTable
CREATE TABLE "estado_animal_perdido" (
    "estado_animal_perdido_id" SERIAL NOT NULL,
    "estado_animal_perdido_nombre" TEXT NOT NULL,
    "estado_animal_perdido_descripcion" TEXT,
    "estado_animal_perdido_usuario_alta" INTEGER NOT NULL,
    "estado_animal_perdido_fecha_alta" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado_animal_perdido_usuario_modificacion" INTEGER,
    "estado_animal_perdido_fecha_modificacion" TIMESTAMP(3),
    "estado_animal_perdido_usuario_baja" INTEGER,
    "estado_animal_perdido_fecha_baja" TIMESTAMP(3),

    CONSTRAINT "estado_animal_perdido_pkey" PRIMARY KEY ("estado_animal_perdido_id")
);

-- CreateTable
CREATE TABLE "tipo_solicitud" (
    "tipo_solicitud_id" SERIAL NOT NULL,
    "tipo_solicitud_nombre" TEXT NOT NULL,
    "tipo_solicitud_descripcion" TEXT,
    "tipo_solicitud_secuencia_dias" INTEGER NOT NULL,
    "tipo_solicitud_usuario_alta" INTEGER NOT NULL,
    "tipo_solicitud_fecha_alta" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipo_solicitud_usuario_modificacion" INTEGER,
    "tipo_solicitud_fecha_modificacion" TIMESTAMP(3),
    "tipo_solicitud_usuario_baja" INTEGER,
    "tipo_solicitud_fecha_baja" TIMESTAMP(3),

    CONSTRAINT "tipo_solicitud_pkey" PRIMARY KEY ("tipo_solicitud_id")
);

-- CreateTable
CREATE TABLE "rol" (
    "rol_id" SERIAL NOT NULL,
    "rol_nombre" TEXT NOT NULL,
    "rol_descripcion" TEXT,
    "rol_usuario_alta" INTEGER NOT NULL,
    "rol_fecha_alta" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rol_usuario_modificacion" INTEGER,
    "rol_fecha_modificacion" TIMESTAMP(3),
    "rol_usuario_baja" INTEGER,
    "rol_fecha_baja" TIMESTAMP(3),

    CONSTRAINT "rol_pkey" PRIMARY KEY ("rol_id")
);

-- CreateTable
CREATE TABLE "usuario" (
    "usuario_id" SERIAL NOT NULL,
    "usuario_nombre" TEXT NOT NULL,
    "usuario_apellido" TEXT NOT NULL,
    "usuario_email" TEXT NOT NULL,
    "usuario_contrasena" TEXT NOT NULL,
    "usuario_telefono" TEXT,
    "usuario_dni" TEXT NOT NULL,
    "usuario_verificado" BOOLEAN NOT NULL DEFAULT false,
    "usuario_imagen_url" TEXT,
    "refugio_id" INTEGER,
    "estado_id" INTEGER NOT NULL,
    "usuario_usuario_alta" INTEGER NOT NULL,
    "usuario_fecha_alta" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuario_usuario_modificacion" INTEGER,
    "usuario_fecha_modificacion" TIMESTAMP(3),
    "usuario_usuario_baja" INTEGER,
    "usuario_fecha_baja" TIMESTAMP(3),

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("usuario_id")
);

-- CreateTable
CREATE TABLE "rol_usuario" (
    "rol_usuario_id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "rol_id" INTEGER NOT NULL,
    "rol_usuario_usuario_alta" INTEGER NOT NULL,
    "rol_usuario_fecha_alta" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rol_usuario_usuario_modificacion" INTEGER,
    "rol_usuario_fecha_modificacion" TIMESTAMP(3),
    "rol_usuario_usuario_baja" INTEGER,
    "rol_usuario_fecha_baja" TIMESTAMP(3),

    CONSTRAINT "rol_usuario_pkey" PRIMARY KEY ("rol_usuario_id")
);

-- CreateTable
CREATE TABLE "refugio" (
    "refugio_id" SERIAL NOT NULL,
    "refugio_nombre" TEXT NOT NULL,
    "refugio_direccion" TEXT NOT NULL,
    "refugio_telefono" TEXT,
    "refugio_email" TEXT,
    "refugio_descripcion" TEXT,
    "refugio_verificado" BOOLEAN NOT NULL DEFAULT false,
    "refugio_imagen_url" TEXT,
    "estado_id" INTEGER NOT NULL,
    "refugio_usuario_alta" INTEGER NOT NULL,
    "refugio_fecha_alta" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "refugio_usuario_modificacion" INTEGER,
    "refugio_fecha_modificacion" TIMESTAMP(3),
    "refugio_usuario_baja" INTEGER,
    "refugio_fecha_baja" TIMESTAMP(3),

    CONSTRAINT "refugio_pkey" PRIMARY KEY ("refugio_id")
);

-- CreateTable
CREATE TABLE "mascota" (
    "mascota_id" SERIAL NOT NULL,
    "mascota_nombre" TEXT,
    "mascota_fecha_nacimiento" TIMESTAMP(3),
    "mascota_genero" "GeneroMascota" NOT NULL,
    "mascota_castrado" BOOLEAN NOT NULL DEFAULT false,
    "mascota_descripcion" TEXT,
    "mascota_imagen_url" TEXT,
    "raza_id" INTEGER NOT NULL,
    "refugio_id" INTEGER,
    "usuario_id" INTEGER NOT NULL,
    "mascota_usuario_alta" INTEGER NOT NULL,
    "mascota_fecha_alta" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mascota_usuario_modificacion" INTEGER,
    "mascota_fecha_modificacion" TIMESTAMP(3),
    "mascota_usuario_baja" INTEGER,
    "mascota_fecha_baja" TIMESTAMP(3),

    CONSTRAINT "mascota_pkey" PRIMARY KEY ("mascota_id")
);

-- CreateTable
CREATE TABLE "mascota_estado" (
    "mascota_estado_id" SERIAL NOT NULL,
    "mascota_id" INTEGER NOT NULL,
    "estado_mascota_id" INTEGER NOT NULL,
    "mascota_estado_usuario_alta" INTEGER NOT NULL,
    "mascota_estado_fecha_alta" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mascota_estado_usuario_baja" INTEGER,
    "mascota_estado_fecha_baja" TIMESTAMP(3),

    CONSTRAINT "mascota_estado_pkey" PRIMARY KEY ("mascota_estado_id")
);

-- CreateTable
CREATE TABLE "publicacion" (
    "publicacion_id" SERIAL NOT NULL,
    "publicacion_titulo" TEXT NOT NULL,
    "publicacion_descripcion" TEXT,
    "publicacion_imagen_url" TEXT,
    "mascota_id" INTEGER NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "publicacion_usuario_alta" INTEGER NOT NULL,
    "publicacion_fecha_alta" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publicacion_usuario_modificacion" INTEGER,
    "publicacion_fecha_modificacion" TIMESTAMP(3),
    "publicacion_usuario_baja" INTEGER,
    "publicacion_fecha_baja" TIMESTAMP(3),

    CONSTRAINT "publicacion_pkey" PRIMARY KEY ("publicacion_id")
);

-- CreateTable
CREATE TABLE "favorito" (
    "favorito_id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "mascota_id" INTEGER NOT NULL,
    "favorito_usuario_alta" INTEGER NOT NULL,
    "favorito_fecha_alta" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "favorito_usuario_modificacion" INTEGER,
    "favorito_fecha_modificacion" TIMESTAMP(3),
    "favorito_usuario_baja" INTEGER,
    "favorito_fecha_baja" TIMESTAMP(3),

    CONSTRAINT "favorito_pkey" PRIMARY KEY ("favorito_id")
);

-- CreateTable
CREATE TABLE "solicitud" (
    "solicitud_id" SERIAL NOT NULL,
    "solicitud_motivacion" TEXT NOT NULL,
    "solicitud_fecha_respuesta" TIMESTAMP(3),
    "solicitud_comentario" TEXT,
    "publicacion_id" INTEGER NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "tipo_solicitud_id" INTEGER NOT NULL,
    "solicitud_usuario_alta" INTEGER NOT NULL,
    "solicitud_fecha_alta" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "solicitud_usuario_modificacion" INTEGER,
    "solicitud_fecha_modificacion" TIMESTAMP(3),
    "solicitud_usuario_baja" INTEGER,
    "solicitud_fecha_baja" TIMESTAMP(3),

    CONSTRAINT "solicitud_pkey" PRIMARY KEY ("solicitud_id")
);

-- CreateTable
CREATE TABLE "solicitud_estado" (
    "solicitud_estado_id" SERIAL NOT NULL,
    "solicitud_id" INTEGER NOT NULL,
    "estado_solicitud_id" INTEGER NOT NULL,
    "solicitud_estado_usuario_alta" INTEGER NOT NULL,
    "solicitud_estado_fecha_alta" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "solicitud_estado_usuario_modificacion" INTEGER,
    "solicitud_estado_fecha_modificacion" TIMESTAMP(3),
    "solicitud_estado_usuario_baja" INTEGER,
    "solicitud_estado_fecha_baja" TIMESTAMP(3),

    CONSTRAINT "solicitud_estado_pkey" PRIMARY KEY ("solicitud_estado_id")
);

-- CreateTable
CREATE TABLE "historia_clinica" (
    "historia_clinica_id" SERIAL NOT NULL,
    "historia_clinica_fecha_visita" TIMESTAMP(3) NOT NULL,
    "historia_clinica_fecha_proxima" TIMESTAMP(3),
    "historia_clinica_requiere_revision" BOOLEAN NOT NULL DEFAULT false,
    "historia_clinica_vacunacion" BOOLEAN NOT NULL DEFAULT false,
    "historia_clinica_titulo" TEXT NOT NULL,
    "historia_clinica_descripcion" TEXT NOT NULL,
    "historia_clinica_documento_url" TEXT,
    "mascota_id" INTEGER NOT NULL,
    "historia_clinica_usuario_alta" INTEGER NOT NULL,
    "historia_clinica_fecha_alta" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "historia_clinica_usuario_modificacion" INTEGER,
    "historia_clinica_fecha_modificacion" TIMESTAMP(3),
    "historia_clinica_usuario_baja" INTEGER,
    "historia_clinica_fecha_baja" TIMESTAMP(3),

    CONSTRAINT "historia_clinica_pkey" PRIMARY KEY ("historia_clinica_id")
);

-- CreateTable
CREATE TABLE "pregunta_seguimiento" (
    "pregunta_seguimiento_id" SERIAL NOT NULL,
    "pregunta_seguimiento_texto" TEXT NOT NULL,
    "pregunta_seguimiento_posicion" INTEGER NOT NULL,
    "pregunta_seguimiento_es_adopcion" BOOLEAN NOT NULL,
    "pregunta_seguimiento_usuario_alta" INTEGER NOT NULL,
    "pregunta_seguimiento_fecha_alta" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pregunta_seguimiento_usuario_modificacion" INTEGER,
    "pregunta_seguimiento_fecha_modificacion" TIMESTAMP(3),
    "pregunta_seguimiento_usuario_baja" INTEGER,
    "pregunta_seguimiento_fecha_baja" TIMESTAMP(3),

    CONSTRAINT "pregunta_seguimiento_pkey" PRIMARY KEY ("pregunta_seguimiento_id")
);

-- CreateTable
CREATE TABLE "seguimiento" (
    "seguimiento_id" SERIAL NOT NULL,
    "seguimiento_descripcion" TEXT,
    "seguimiento_foto_url" TEXT,
    "seguimiento_plazo" TIMESTAMP(3),
    "solicitud_id" INTEGER NOT NULL,
    "pregunta_seguimiento_id" INTEGER NOT NULL,
    "seguimiento_usuario_alta" INTEGER NOT NULL,
    "seguimiento_fecha_alta" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "seguimiento_usuario_modificacion" INTEGER,
    "seguimiento_fecha_modificacion" TIMESTAMP(3),
    "seguimiento_usuario_baja" INTEGER,
    "seguimiento_fecha_baja" TIMESTAMP(3),

    CONSTRAINT "seguimiento_pkey" PRIMARY KEY ("seguimiento_id")
);

-- CreateTable
CREATE TABLE "resena" (
    "resena_id" SERIAL NOT NULL,
    "resena_puntuacion" INTEGER NOT NULL,
    "resena_comentario" TEXT,
    "resena_usuario_autor" INTEGER NOT NULL,
    "refugio_reportado_id" INTEGER,
    "usuario_reportado_id" INTEGER,
    "resena_usuario_alta" INTEGER NOT NULL,
    "resena_fecha_alta" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resena_usuario_modificacion" INTEGER,
    "resena_fecha_modificacion" TIMESTAMP(3),
    "resena_usuario_baja" INTEGER,
    "resena_fecha_baja" TIMESTAMP(3),

    CONSTRAINT "resena_pkey" PRIMARY KEY ("resena_id")
);

-- CreateTable
CREATE TABLE "chat" (
    "chat_id" SERIAL NOT NULL,
    "chat_tipo" TEXT,
    "refugio_id" INTEGER,
    "chat_usuario_alta" INTEGER NOT NULL,
    "chat_fecha_alta" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "chat_usuario_baja" INTEGER,
    "chat_fecha_baja" TIMESTAMP(3),

    CONSTRAINT "chat_pkey" PRIMARY KEY ("chat_id")
);

-- CreateTable
CREATE TABLE "usuario_chat" (
    "usuario_chat_id" SERIAL NOT NULL,
    "chat_id" INTEGER NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "usuario_chat_usuario_alta" INTEGER NOT NULL,
    "usuario_chat_fecha_alta" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuario_chat_usuario_modificacion" INTEGER,
    "usuario_chat_fecha_modificacion" TIMESTAMP(3),
    "usuario_chat_usuario_baja" INTEGER,
    "usuario_chat_fecha_baja" TIMESTAMP(3),

    CONSTRAINT "usuario_chat_pkey" PRIMARY KEY ("usuario_chat_id")
);

-- CreateTable
CREATE TABLE "mensaje" (
    "mensaje_id" SERIAL NOT NULL,
    "mensaje_contenido" TEXT NOT NULL,
    "mensaje_leido" BOOLEAN NOT NULL DEFAULT false,
    "mensaje_imagen_url" TEXT,
    "chat_id" INTEGER NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "mensaje_usuario_alta" INTEGER NOT NULL,
    "mensaje_fecha_alta" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mensaje_pkey" PRIMARY KEY ("mensaje_id")
);

-- CreateTable
CREATE TABLE "notificacion" (
    "notificacion_id" SERIAL NOT NULL,
    "notificacion_tipo" TEXT NOT NULL,
    "notificacion_mensaje" TEXT NOT NULL,
    "notificacion_leido" BOOLEAN NOT NULL DEFAULT false,
    "usuario_id" INTEGER NOT NULL,
    "notificacion_usuario_alta" INTEGER NOT NULL,
    "notificacion_fecha_alta" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notificacion_usuario_modificacion" INTEGER,
    "notificacion_fecha_modificacion" TIMESTAMP(3),
    "notificacion_usuario_baja" INTEGER,
    "notificacion_fecha_baja" TIMESTAMP(3),

    CONSTRAINT "notificacion_pkey" PRIMARY KEY ("notificacion_id")
);

-- CreateTable
CREATE TABLE "hogar" (
    "hogar_id" SERIAL NOT NULL,
    "hogar_direccion" TEXT NOT NULL,
    "hogar_tiene_patio" BOOLEAN NOT NULL DEFAULT false,
    "hogar_tiene_mascotas" BOOLEAN NOT NULL DEFAULT false,
    "hogar_descripcion" TEXT,
    "hogar_tipo_vivienda" TEXT,
    "hogar_inicio_disponibilidad" TIMESTAMP(3),
    "hogar_fin_disponibilidad" TIMESTAMP(3),
    "hogar_imagen_url" TEXT,
    "usuario_id" INTEGER NOT NULL,
    "hogar_usuario_alta" INTEGER NOT NULL,
    "hogar_fecha_alta" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hogar_usuario_modificacion" INTEGER,
    "hogar_fecha_modificacion" TIMESTAMP(3),
    "hogar_usuario_baja" INTEGER,
    "hogar_fecha_baja" TIMESTAMP(3),

    CONSTRAINT "hogar_pkey" PRIMARY KEY ("hogar_id")
);

-- CreateTable
CREATE TABLE "campania" (
    "campania_id" SERIAL NOT NULL,
    "campania_titulo" TEXT NOT NULL,
    "campania_descripcion" TEXT NOT NULL,
    "campania_objetivo" DECIMAL(12,2) NOT NULL,
    "campania_fecha_inicio" TIMESTAMP(3) NOT NULL,
    "campania_fecha_fin" TIMESTAMP(3) NOT NULL,
    "campania_imagen_url" TEXT,
    "refugio_id" INTEGER NOT NULL,
    "estado_campania_id" INTEGER NOT NULL,
    "campania_usuario_alta" INTEGER NOT NULL,
    "campania_fecha_alta" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "campania_usuario_modificacion" INTEGER,
    "campania_fecha_modificacion" TIMESTAMP(3),
    "campania_usuario_baja" INTEGER,
    "campania_fecha_baja" TIMESTAMP(3),

    CONSTRAINT "campania_pkey" PRIMARY KEY ("campania_id")
);

-- CreateTable
CREATE TABLE "donacion" (
    "donacion_id" SERIAL NOT NULL,
    "donacion_monto" DECIMAL(12,2) NOT NULL,
    "campania_id" INTEGER NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "donacion_usuario_alta" INTEGER NOT NULL,
    "donacion_fecha_alta" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "donacion_usuario_modificacion" INTEGER,
    "donacion_fecha_modificacion" TIMESTAMP(3),
    "donacion_usuario_baja" INTEGER,
    "donacion_fecha_baja" TIMESTAMP(3),

    CONSTRAINT "donacion_pkey" PRIMARY KEY ("donacion_id")
);

-- CreateTable
CREATE TABLE "animal_perdido" (
    "animal_perdido_id" SERIAL NOT NULL,
    "animal_perdido_descripcion" TEXT NOT NULL,
    "animal_perdido_imagen_url" TEXT NOT NULL,
    "animal_perdido_latitud" DOUBLE PRECISION NOT NULL,
    "animal_perdido_longitud" DOUBLE PRECISION NOT NULL,
    "animal_perdido_fecha_resuelto" TIMESTAMP(3),
    "usuario_reportante_id" INTEGER NOT NULL,
    "mascota_id" INTEGER,
    "estado_animal_perdido_id" INTEGER NOT NULL,
    "animal_perdido_usuario_alta" INTEGER NOT NULL,
    "animal_perdido_fecha_alta" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "animal_perdido_usuario_modificacion" INTEGER,
    "animal_perdido_fecha_modificacion" TIMESTAMP(3),
    "animal_perdido_usuario_baja" INTEGER,
    "animal_perdido_fecha_baja" TIMESTAMP(3),

    CONSTRAINT "animal_perdido_pkey" PRIMARY KEY ("animal_perdido_id")
);

-- CreateTable
CREATE TABLE "reporte_problema" (
    "reporte_problema_id" SERIAL NOT NULL,
    "reporte_problema_motivo" TEXT NOT NULL,
    "reporte_problema_respuesta" TEXT,
    "reporte_problema_resuelto" BOOLEAN NOT NULL DEFAULT false,
    "reporte_problema_mensaje_sistema" TEXT,
    "reporte_problema_usuario_alta" INTEGER NOT NULL,
    "reporte_problema_fecha_alta" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reporte_problema_usuario_modificacion" INTEGER,
    "reporte_problema_fecha_modificacion" TIMESTAMP(3),
    "reporte_problema_usuario_baja" INTEGER,
    "reporte_problema_fecha_baja" TIMESTAMP(3),

    CONSTRAINT "reporte_problema_pkey" PRIMARY KEY ("reporte_problema_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "especie_especie_nombre_key" ON "especie"("especie_nombre");

-- CreateIndex
CREATE UNIQUE INDEX "raza_raza_nombre_especie_id_key" ON "raza"("raza_nombre", "especie_id");

-- CreateIndex
CREATE UNIQUE INDEX "estado_mascota_estado_mascota_nombre_key" ON "estado_mascota"("estado_mascota_nombre");

-- CreateIndex
CREATE UNIQUE INDEX "estado_usuario_estado_usuario_nombre_key" ON "estado_usuario"("estado_usuario_nombre");

-- CreateIndex
CREATE UNIQUE INDEX "estado_refugio_estado_refugio_nombre_key" ON "estado_refugio"("estado_refugio_nombre");

-- CreateIndex
CREATE UNIQUE INDEX "estado_solicitud_estado_solicitud_nombre_key" ON "estado_solicitud"("estado_solicitud_nombre");

-- CreateIndex
CREATE UNIQUE INDEX "estado_campania_estado_campania_nombre_key" ON "estado_campania"("estado_campania_nombre");

-- CreateIndex
CREATE UNIQUE INDEX "estado_animal_perdido_estado_animal_perdido_nombre_key" ON "estado_animal_perdido"("estado_animal_perdido_nombre");

-- CreateIndex
CREATE UNIQUE INDEX "tipo_solicitud_tipo_solicitud_nombre_key" ON "tipo_solicitud"("tipo_solicitud_nombre");

-- CreateIndex
CREATE UNIQUE INDEX "rol_rol_nombre_key" ON "rol"("rol_nombre");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_usuario_email_key" ON "usuario"("usuario_email");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_usuario_dni_key" ON "usuario"("usuario_dni");

-- CreateIndex
CREATE INDEX "rol_usuario_usuario_id_rol_id_idx" ON "rol_usuario"("usuario_id", "rol_id");

-- CreateIndex
CREATE INDEX "favorito_usuario_id_mascota_id_idx" ON "favorito"("usuario_id", "mascota_id");

-- CreateIndex
CREATE INDEX "usuario_chat_chat_id_usuario_id_idx" ON "usuario_chat"("chat_id", "usuario_id");

-- AddForeignKey
ALTER TABLE "raza" ADD CONSTRAINT "raza_especie_id_fkey" FOREIGN KEY ("especie_id") REFERENCES "especie"("especie_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario" ADD CONSTRAINT "usuario_refugio_id_fkey" FOREIGN KEY ("refugio_id") REFERENCES "refugio"("refugio_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario" ADD CONSTRAINT "usuario_estado_id_fkey" FOREIGN KEY ("estado_id") REFERENCES "estado_usuario"("estado_usuario_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rol_usuario" ADD CONSTRAINT "rol_usuario_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("usuario_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rol_usuario" ADD CONSTRAINT "rol_usuario_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "rol"("rol_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refugio" ADD CONSTRAINT "refugio_estado_id_fkey" FOREIGN KEY ("estado_id") REFERENCES "estado_refugio"("estado_refugio_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mascota" ADD CONSTRAINT "mascota_raza_id_fkey" FOREIGN KEY ("raza_id") REFERENCES "raza"("raza_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mascota" ADD CONSTRAINT "mascota_refugio_id_fkey" FOREIGN KEY ("refugio_id") REFERENCES "refugio"("refugio_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mascota" ADD CONSTRAINT "mascota_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("usuario_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mascota_estado" ADD CONSTRAINT "mascota_estado_mascota_id_fkey" FOREIGN KEY ("mascota_id") REFERENCES "mascota"("mascota_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mascota_estado" ADD CONSTRAINT "mascota_estado_estado_mascota_id_fkey" FOREIGN KEY ("estado_mascota_id") REFERENCES "estado_mascota"("estado_mascota_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publicacion" ADD CONSTRAINT "publicacion_mascota_id_fkey" FOREIGN KEY ("mascota_id") REFERENCES "mascota"("mascota_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publicacion" ADD CONSTRAINT "publicacion_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("usuario_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorito" ADD CONSTRAINT "favorito_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("usuario_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorito" ADD CONSTRAINT "favorito_mascota_id_fkey" FOREIGN KEY ("mascota_id") REFERENCES "mascota"("mascota_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitud" ADD CONSTRAINT "solicitud_publicacion_id_fkey" FOREIGN KEY ("publicacion_id") REFERENCES "publicacion"("publicacion_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitud" ADD CONSTRAINT "solicitud_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("usuario_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitud" ADD CONSTRAINT "solicitud_tipo_solicitud_id_fkey" FOREIGN KEY ("tipo_solicitud_id") REFERENCES "tipo_solicitud"("tipo_solicitud_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitud_estado" ADD CONSTRAINT "solicitud_estado_solicitud_id_fkey" FOREIGN KEY ("solicitud_id") REFERENCES "solicitud"("solicitud_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitud_estado" ADD CONSTRAINT "solicitud_estado_estado_solicitud_id_fkey" FOREIGN KEY ("estado_solicitud_id") REFERENCES "estado_solicitud"("estado_solicitud_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historia_clinica" ADD CONSTRAINT "historia_clinica_mascota_id_fkey" FOREIGN KEY ("mascota_id") REFERENCES "mascota"("mascota_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seguimiento" ADD CONSTRAINT "seguimiento_solicitud_id_fkey" FOREIGN KEY ("solicitud_id") REFERENCES "solicitud"("solicitud_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seguimiento" ADD CONSTRAINT "seguimiento_pregunta_seguimiento_id_fkey" FOREIGN KEY ("pregunta_seguimiento_id") REFERENCES "pregunta_seguimiento"("pregunta_seguimiento_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resena" ADD CONSTRAINT "resena_resena_usuario_autor_fkey" FOREIGN KEY ("resena_usuario_autor") REFERENCES "usuario"("usuario_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resena" ADD CONSTRAINT "resena_refugio_reportado_id_fkey" FOREIGN KEY ("refugio_reportado_id") REFERENCES "refugio"("refugio_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resena" ADD CONSTRAINT "resena_usuario_reportado_id_fkey" FOREIGN KEY ("usuario_reportado_id") REFERENCES "usuario"("usuario_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat" ADD CONSTRAINT "chat_refugio_id_fkey" FOREIGN KEY ("refugio_id") REFERENCES "refugio"("refugio_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_chat" ADD CONSTRAINT "usuario_chat_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "chat"("chat_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_chat" ADD CONSTRAINT "usuario_chat_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("usuario_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensaje" ADD CONSTRAINT "mensaje_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "chat"("chat_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensaje" ADD CONSTRAINT "mensaje_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("usuario_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacion" ADD CONSTRAINT "notificacion_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("usuario_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hogar" ADD CONSTRAINT "hogar_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("usuario_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campania" ADD CONSTRAINT "campania_refugio_id_fkey" FOREIGN KEY ("refugio_id") REFERENCES "refugio"("refugio_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campania" ADD CONSTRAINT "campania_estado_campania_id_fkey" FOREIGN KEY ("estado_campania_id") REFERENCES "estado_campania"("estado_campania_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donacion" ADD CONSTRAINT "donacion_campania_id_fkey" FOREIGN KEY ("campania_id") REFERENCES "campania"("campania_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donacion" ADD CONSTRAINT "donacion_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("usuario_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animal_perdido" ADD CONSTRAINT "animal_perdido_usuario_reportante_id_fkey" FOREIGN KEY ("usuario_reportante_id") REFERENCES "usuario"("usuario_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animal_perdido" ADD CONSTRAINT "animal_perdido_mascota_id_fkey" FOREIGN KEY ("mascota_id") REFERENCES "mascota"("mascota_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animal_perdido" ADD CONSTRAINT "animal_perdido_estado_animal_perdido_id_fkey" FOREIGN KEY ("estado_animal_perdido_id") REFERENCES "estado_animal_perdido"("estado_animal_perdido_id") ON DELETE RESTRICT ON UPDATE CASCADE;

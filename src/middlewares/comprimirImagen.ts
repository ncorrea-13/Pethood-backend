import sharp from 'sharp';
import type { NextFunction, Request, Response } from 'express';

// Sin spec que fije estos números todavía — son defaults razonables de downscale para
// fotos de celular (regla transversal 4 de CLAUDE.md: compresión async antes de persistir).
// Ajustar si alguna spec de módulo pide otra cosa.
const ANCHO_MAXIMO_PX = 1600;
const CALIDAD = 75;

const FORMATO_POR_MIME: Record<string, 'jpeg' | 'png' | 'webp'> = {
  'image/jpeg': 'jpeg',
  'image/png': 'png',
  'image/webp': 'webp',
};

/**
 * Comprime asíncronamente req.file.buffer (si vino un archivo). No decide dónde ni cómo
 * se persiste — eso es responsabilidad del controller/service del módulo que lo use.
 */
export async function comprimirImagen(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  if (!req.file) {
    next();
    return;
  }

  try {
    const formato = FORMATO_POR_MIME[req.file.mimetype] ?? 'jpeg';

    const comprimida = await sharp(req.file.buffer)
      .resize({ width: ANCHO_MAXIMO_PX, withoutEnlargement: true })
      .toFormat(formato, { quality: CALIDAD })
      .toBuffer();

    req.file.buffer = comprimida;
    req.file.size = comprimida.length;

    next();
  } catch (err) {
    next(err);
  }
}

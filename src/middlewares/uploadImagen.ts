import multer from 'multer';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { AppError } from './errorHandler';

// Formatos y tamaño máximo según la tabla de validez de campos de REQUISITOS.md /
// regla transversal 5 de CLAUDE.md (imágenes/documentos ≤5MB, jpg/png/webp/jpeg).
const MIME_PERMITIDOS = new Set(['image/jpeg', 'image/png', 'image/webp']);
const TAMANO_MAXIMO_BYTES = 5 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: TAMANO_MAXIMO_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!MIME_PERMITIDOS.has(file.mimetype)) {
      cb(new AppError('ARCHIVO_INVALIDO', 'La imagen debe ser jpg, png o webp', 400));
      return;
    }
    cb(null, true);
  },
});

/**
 * Middleware de upload para un único campo de imagen (multipart/form-data).
 * Deja el archivo en memoria (`req.file.buffer`) para que comprimirImagen lo procese
 * antes de que el controller lo persista.
 */
export function uploadImagen(campo: string): RequestHandler {
  const middleware = upload.single(campo);

  return (req: Request, res: Response, next: NextFunction) => {
    middleware(req, res, (err: unknown) => {
      if (!err) {
        next();
        return;
      }
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        next(new AppError('ARCHIVO_DEMASIADO_GRANDE', 'La imagen supera el máximo de 5MB', 400));
        return;
      }
      next(err);
    });
  };
}

/**
 * Acepta multipart/form-data (con o sin archivo) y deja pasar JSON para no romper
 * clientes que siguen registrándose sin foto.
 */
export function uploadImagenOpcional(campo: string): RequestHandler {
  const middleware = uploadImagen(campo);

  return (req: Request, res: Response, next: NextFunction) => {
    const contentType = req.headers['content-type'] ?? '';
    if (contentType.toLowerCase().includes('multipart/form-data')) {
      middleware(req, res, next);
      return;
    }
    next();
  };
}

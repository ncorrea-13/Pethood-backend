import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('El correo no es válido'),
  contrasena: z.string().min(1, 'La contraseña es obligatoria'),
});

export type LoginDto = z.infer<typeof loginSchema>;

export interface UsuarioAutenticadoDto {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  verificado: boolean;
  refugioId: number | null;
  roles: string[];
}

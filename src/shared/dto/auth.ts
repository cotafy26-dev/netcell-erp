import { z } from 'zod';
import { ROLES } from '../roles';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  otp: z.string().length(6).optional(), // código 2FA quando exigido
});
export type LoginDto = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(ROLES).optional(),
});
export type RegisterDto = z.infer<typeof registerSchema>;

export const refreshSchema = z.object({
  refreshToken: z.string().min(10),
});
export type RefreshDto = z.infer<typeof refreshSchema>;

export const enable2faSchema = z.object({
  otp: z.string().length(6),
});
export type Enable2faDto = z.infer<typeof enable2faSchema>;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: (typeof ROLES)[number];
  twoFactorEnabled: boolean;
  customerId?: string | null;
}

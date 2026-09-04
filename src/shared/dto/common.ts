import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  orderBy: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
});
export type PaginationQuery = z.infer<typeof paginationSchema>;

export interface Paginated<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export const idParamSchema = z.object({ id: z.string().cuid() });

/** Endereço (usado no cadastro de cliente e busca por CEP). */
export const addressSchema = z.object({
  label: z.string().default('Principal'),
  zip: z.string().optional(),
  street: z.string().optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  district: z.string().optional(),
  city: z.string().optional(),
  state: z.string().length(2).optional(),
  isDefault: z.boolean().default(false),
});
export type AddressDto = z.infer<typeof addressSchema>;

import { z } from 'zod';
import { addressSchema } from './common';

// ── Clientes ─────────────────────────────────────────────────
export const customerSchema = z.object({
  type: z.enum(['PF', 'PJ']).default('PF'),
  name: z.string().min(2),
  tradeName: z.string().optional().nullable(),
  cpf: z.string().optional().nullable(),
  cnpj: z.string().optional().nullable(),
  rg: z.string().optional().nullable(),
  stateReg: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  phone: z.string().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  site: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  addresses: z.array(addressSchema).optional().default([]),
});
export type CustomerDto = z.infer<typeof customerSchema>;
export const customerUpdateSchema = customerSchema.partial();

// ── Equipamentos ─────────────────────────────────────────────
export const EQUIPMENT_STATUS = ['DISPONIVEL', 'LOCADO', 'MANUTENCAO', 'RESERVADO', 'BAIXADO'] as const;

export const equipmentSchema = z.object({
  categoryId: z.string().cuid().optional().nullable(),
  model: z.string().min(1),
  brand: z.string().optional().nullable(),
  serialNumber: z.string().optional().nullable(),
  assetTag: z.string().optional().nullable(),
  supplierId: z.string().cuid().optional().nullable(),
  purchaseDate: z.coerce.date().optional().nullable(),
  warrantyUntil: z.coerce.date().optional().nullable(),
  purchaseValue: z.coerce.number().nonnegative().optional().nullable(),
  dailyRate: z.coerce.number().nonnegative().optional().nullable(),
  weeklyRate: z.coerce.number().nonnegative().optional().nullable(),
  monthlyRate: z.coerce.number().nonnegative().optional().nullable(),
  yearlyRate: z.coerce.number().nonnegative().optional().nullable(),
  status: z.enum(EQUIPMENT_STATUS).default('DISPONIVEL'),
  location: z.string().optional().nullable(),
  photoUrl: z.string().url().optional().nullable().or(z.literal('')),
  manualUrl: z.string().url().optional().nullable().or(z.literal('')),
  barcode: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});
export type EquipmentDto = z.infer<typeof equipmentSchema>;
export const equipmentUpdateSchema = equipmentSchema.partial();

// ── Estoque ──────────────────────────────────────────────────
export const stockItemSchema = z.object({
  sku: z.string().optional().nullable(),
  name: z.string().min(1),
  unit: z.string().default('un'),
  quantity: z.coerce.number().default(0),
  minQuantity: z.coerce.number().default(0),
  cost: z.coerce.number().nonnegative().optional().nullable(),
  price: z.coerce.number().nonnegative().optional().nullable(),
  supplierId: z.string().cuid().optional().nullable(),
  warrantyDays: z.coerce.number().int().optional().nullable(),
  location: z.string().optional().nullable(),
});
export type StockItemDto = z.infer<typeof stockItemSchema>;
export const stockItemUpdateSchema = stockItemSchema.partial();

export const STOCK_MOVEMENT_TYPES = ['ENTRADA', 'SAIDA', 'TRANSFERENCIA', 'AJUSTE', 'INVENTARIO'] as const;
export const stockMovementSchema = z.object({
  type: z.enum(STOCK_MOVEMENT_TYPES),
  quantity: z.coerce.number().positive(),
  fromLocation: z.string().optional().nullable(),
  toLocation: z.string().optional().nullable(),
  unitCost: z.coerce.number().nonnegative().optional().nullable(),
  lot: z.string().optional().nullable(),
  reference: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
});
export type StockMovementDto = z.infer<typeof stockMovementSchema>;

// ── Ordens de Serviço ────────────────────────────────────────
export const SERVICE_ORDER_STATUS = [
  'ABERTA', 'EM_EXECUCAO', 'PAUSADA', 'AGUARDANDO_CLIENTE', 'FINALIZADA', 'CANCELADA',
] as const;

export const serviceOrderSchema = z.object({
  customerId: z.string().cuid(),
  tecnicoId: z.string().cuid().optional().nullable(),
  title: z.string().min(2),
  description: z.string().optional().nullable(),
  scheduledAt: z.coerce.date().optional().nullable(),
  laborValue: z.coerce.number().nonnegative().optional().nullable(),
  warrantyDays: z.coerce.number().int().optional().nullable(),
});
export type ServiceOrderDto = z.infer<typeof serviceOrderSchema>;
export const serviceOrderUpdateSchema = serviceOrderSchema.partial().extend({
  status: z.enum(SERVICE_ORDER_STATUS).optional(),
  timeSpentMin: z.coerce.number().int().optional(),
  clientSignatureUrl: z.string().optional(),
});

export const serviceOrderItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.coerce.number().positive().default(1),
  unitValue: z.coerce.number().nonnegative().default(0),
  isMaterial: z.boolean().default(true),
});
export const checklistItemSchema = z.object({
  label: z.string().min(1),
  done: z.boolean().default(false),
  order: z.coerce.number().int().default(0),
});

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function brl(value: number | string | null | undefined) {
  return Number(value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatDate(d: string | Date | null | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-BR');
}

export function onlyDigits(s: string) {
  return (s ?? '').replace(/\D+/g, '');
}

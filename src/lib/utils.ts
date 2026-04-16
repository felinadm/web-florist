import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const DEFAULT_FLOWER_IMAGE = "https://images.unsplash.com/photo-1507290439931-a861b5a38200?auto=format&fit=crop&w=800&q=80";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(amount: number) {
  return new Intl.NumberFormat('id-ID').format(amount);
}

export function parseNumber(value: string) {
  return Number(value.replace(/\D/g, ''));
}

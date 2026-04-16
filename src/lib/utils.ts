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

export function exportToCSV(data: any[], filename: string) {
  if (!data || data.length === 0) return;
  const headers = Object.keys(data[0]);
  const rows = data.map(obj => headers.map(header => {
    const val = obj[header];
    if (typeof val === 'object') return JSON.stringify(val).replace(/,/g, ';');
    return JSON.stringify(val);
  }).join(','));
  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

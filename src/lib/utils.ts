import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function sanitizeText(input: string): string {
  return input
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<\/?[a-z][^>]*>/gi, "")
    .trim();
}

export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export const categoryLabel: Record<string, string> = {
  ELETRONICOS: "Eletrônicos",
  DOCUMENTOS: "Documentos",
  VESTUARIO: "Vestuário",
  OUTROS: "Outros",
};

export const statusLabel: Record<string, string> = {
  PERDIDO: "Perdido",
  ENCONTRADO: "Encontrado",
  EM_VERIFICACAO: "Em verificação",
  DEVOLVIDO: "Devolvido",
};

export const typeLabel: Record<string, string> = {
  PERDIDO: "Perdido",
  ENCONTRADO: "Encontrado",
};

export const statusColor: Record<string, string> = {
  PERDIDO: "bg-red-100 text-red-800 border-red-200",
  ENCONTRADO: "bg-green-100 text-green-800 border-green-200",
  EM_VERIFICACAO: "bg-yellow-100 text-yellow-800 border-yellow-200",
  DEVOLVIDO: "bg-utfpr-100 text-utfpr-800 border-utfpr-200",
};

export const typeColor: Record<string, string> = {
  PERDIDO: "bg-red-100 text-red-800 border-red-200",
  ENCONTRADO: "bg-green-100 text-green-800 border-green-200",
};

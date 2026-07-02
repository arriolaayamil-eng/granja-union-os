import type { Role } from "@/lib/api/types";

const currency = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export function formatCurrency(value: number): string {
  return currency.format(value ?? 0);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 }).format(value ?? 0);
}

const isSameDay = (a: Date, b: Date) =>
  a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();

export function formatDate(input?: string | null): string {
  if (!input) return "—";
  const d = new Date(input);
  const now = new Date();
  const yesterday = new Date(now.getTime() - 864e5);
  const time = d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
  if (isSameDay(d, now)) return `Hoy ${time}`;
  if (isSameDay(d, yesterday)) return `Ayer ${time}`;
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });
}

export function formatDateLong(input?: string | null): string {
  if (!input) return "—";
  return new Date(input).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function daysUntil(input?: string | null): number | null {
  if (!input) return null;
  const diff = new Date(input).getTime() - Date.now();
  return Math.ceil(diff / 864e5);
}

export const roleLabel: Record<Role, string> = {
  general: "Administrador General",
  branch_admin: "Admin de Sucursal",
  cashier: "Cajero",
};

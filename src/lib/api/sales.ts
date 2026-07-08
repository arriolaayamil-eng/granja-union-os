import type { Sale, SaleStatus, ZoneValue } from "@/lib/api/types";
import { delay, request } from "@/lib/api/client";
import { sales } from "@/mocks/data";

export function getSales(branch?: string, status?: string, zona?: string): Promise<Sale[]> {
  const qs = new URLSearchParams();
  if (branch && branch !== "all") qs.set("branch", branch);
  if (status) qs.set("status", status);
  if (zona) qs.set("zona", zona);
  return request<Sale[]>(`/sales?${qs}`, {}, () => {
    let list = [...sales];
    if (branch && branch !== "all") list = list.filter((s) => s.branchId === branch);
    if (status) {
      const statuses = status.split(",");
      list = list.filter((s) => statuses.includes(s.status));
    }
    if (zona) list = list.filter((s) => s.customer.zona === zona);
    list.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    return delay(list);
  });
}

const MANUAL_NEXT: Partial<Record<SaleStatus, SaleStatus>> = {
  paid: "en_preparacion",
  en_preparacion: "en_camino",
  en_camino: "entregado",
};

/** Transición manual de estado (nunca "paid": eso lo pone el webhook de MP). */
export function transitionSale(id: string, to: "en_preparacion" | "en_camino" | "entregado" | "cancelled"): Promise<Sale> {
  return request<Sale>(`/sales/${id}/transition`, { method: "PUT", body: { to } }, () => {
    const s = sales.find((x) => x.id === id)!;
    if (to !== "cancelled" && MANUAL_NEXT[s.status] !== to) throw new Error(`No se puede pasar de "${s.status}" a "${to}"`);
    s.status = to;
    s.statusHistory = [...s.statusHistory, { status: to, at: new Date().toISOString() }];
    return delay(s);
  });
}

export function updateSaleZona(id: string, zona: ZoneValue): Promise<Sale> {
  return request<Sale>(`/sales/${id}/zona`, { method: "PUT", body: { zona } }, () => {
    const s = sales.find((x) => x.id === id)!;
    s.customer = { ...s.customer, zona };
    return delay(s);
  });
}

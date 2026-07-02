import type { Invoice } from "@/lib/api/types";
import { delay, request } from "@/lib/api/client";
import { invoices } from "@/mocks/data";

export function getInvoices(branch?: string): Promise<Invoice[]> {
  return request<Invoice[]>(`/invoices?branch=${branch ?? ""}`, {}, () => {
    let list = [...invoices];
    if (branch && branch !== "all") list = list.filter((i) => i.branchId === branch);
    list.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    return delay(list);
  });
}

export function emitInvoice(saleId: string): Promise<Invoice> {
  return request<Invoice>(`/invoices/${saleId}/emit`, { method: "POST" }, () => {
    const inv = invoices.find((i) => i.saleId === saleId);
    if (inv) {
      inv.status = "authorized";
      inv.numero = Math.floor(1000 + Math.random() * 9000);
      inv.cae = String(74000000000000 + Math.floor(Math.random() * 1e9));
      inv.caeVto = new Date(Date.now() + 10 * 864e5).toISOString();
    }
    return delay(inv!);
  });
}

export function voidInvoice(id: string): Promise<{ ok: true }> {
  return request<{ ok: true }>(`/invoices/${id}/void`, { method: "POST" }, () =>
    delay({ ok: true as const }),
  );
}

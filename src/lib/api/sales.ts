import type { Sale, SaleStatus } from "@/lib/api/types";
import { delay, request } from "@/lib/api/client";
import { sales } from "@/mocks/data";

export function getSales(branch?: string, status?: string): Promise<Sale[]> {
  const qs = new URLSearchParams();
  if (branch && branch !== "all") qs.set("branch", branch);
  if (status) qs.set("status", status);
  return request<Sale[]>(`/sales?${qs}`, {}, () => {
    let list = [...sales];
    if (branch && branch !== "all") list = list.filter((s) => s.branchId === branch);
    if (status) list = list.filter((s) => s.status === status);
    list.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    return delay(list);
  });
}

export function fulfillSale(id: string): Promise<Sale> {
  return request<Sale>(`/sales/${id}/fulfill`, { method: "PUT" }, () => {
    const s = sales.find((x) => x.id === id)!;
    s.status = "fulfilled" as SaleStatus;
    return delay(s);
  });
}

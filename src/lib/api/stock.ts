import type { BranchProduct, StockMovement } from "@/lib/api/types";
import { delay, request } from "@/lib/api/client";
import { branchProducts, stockMovements } from "@/mocks/data";

export function getStock(branch?: string): Promise<BranchProduct[]> {
  return request<BranchProduct[]>(`/stock?branch=${branch ?? ""}`, {}, () => {
    let list = [...branchProducts];
    if (branch && branch !== "all") list = list.filter((b) => b.branchId === branch);
    return delay(list);
  });
}

export function getStockMovements(branch?: string): Promise<StockMovement[]> {
  return request<StockMovement[]>(`/stock/movements?branch=${branch ?? ""}`, {}, () => {
    let list = [...stockMovements];
    if (branch && branch !== "all") list = list.filter((m) => m.branchId === branch);
    list.sort((a, b) => +new Date(b.at) - +new Date(a.at));
    return delay(list);
  });
}

export function getStockAlerts(branch?: string): Promise<BranchProduct[]> {
  return request<BranchProduct[]>(`/stock/alerts?branch=${branch ?? ""}`, {}, () => {
    let list = branchProducts.filter((b) => b.stock <= b.minStock);
    if (branch && branch !== "all") list = list.filter((b) => b.branchId === branch);
    return delay(list);
  });
}

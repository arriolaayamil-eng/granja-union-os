import type { PurchaseOrder, Supplier } from "@/lib/api/types";
import { delay, request } from "@/lib/api/client";
import { purchaseOrders, suppliers } from "@/mocks/data";

export function getSuppliers(): Promise<Supplier[]> {
  return request<Supplier[]>("/suppliers", {}, () => delay([...suppliers]));
}

export function saveSupplier(s: Supplier): Promise<Supplier> {
  return request<Supplier>(
    s.id ? `/suppliers/${s.id}` : "/suppliers",
    { method: s.id ? "PUT" : "POST", body: s },
    () => {
      if (s.id) {
        const i = suppliers.findIndex((x) => x.id === s.id);
        if (i >= 0) suppliers[i] = s;
      } else {
        s.id = `sup${suppliers.length + 1}`;
        suppliers.push(s);
      }
      return delay(s);
    },
  );
}

export function getPurchaseOrders(branch?: string): Promise<PurchaseOrder[]> {
  return request<PurchaseOrder[]>(`/purchase-orders?branch=${branch ?? ""}`, {}, () => {
    let list = [...purchaseOrders];
    if (branch && branch !== "all") list = list.filter((p) => p.branchId === branch);
    list.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    return delay(list);
  });
}

export function receivePurchaseOrder(id: string): Promise<PurchaseOrder> {
  return request<PurchaseOrder>(`/purchase-orders/${id}/receive`, { method: "POST" }, () => {
    const po = purchaseOrders.find((p) => p.id === id)!;
    po.status = "received";
    po.receivedAt = new Date().toISOString();
    return delay(po);
  });
}

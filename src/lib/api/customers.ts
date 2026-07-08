import type { Customer } from "@/lib/api/types";
import { delay, request } from "@/lib/api/client";
import { customers, sales } from "@/mocks/data";

export function getCustomers(zona?: string): Promise<Customer[]> {
  const qs = zona ? `?zona=${zona}` : "";
  return request<Customer[]>(`/customers${qs}`, {}, () => {
    const withStats = customers.map((c) => {
      const compras = sales.filter((s) => s.customerId === c.id);
      const paid = compras.filter((s) => s.paymentStatus === "paid");
      const lastOrderAt = compras.length
        ? compras.reduce((a, s) => (new Date(s.createdAt) > new Date(a) ? s.createdAt : a), compras[0].createdAt)
        : undefined;
      return {
        ...c,
        orderCount: compras.length,
        totalSpent: paid.reduce((a, s) => a + s.total, 0),
        lastOrderAt,
      };
    });
    const list = zona ? withStats.filter((c) => c.zona === zona) : withStats;
    return delay(list);
  });
}

export function saveCustomer(c: Customer): Promise<Customer> {
  return request<Customer>(
    c.id ? `/customers/${c.id}` : "/customers",
    { method: c.id ? "PUT" : "POST", body: c },
    () => {
      if (c.id) {
        const i = customers.findIndex((x) => x.id === c.id);
        if (i >= 0) customers[i] = c;
      } else {
        c.id = `c${customers.length + 1}`;
        customers.push(c);
      }
      return delay(c);
    },
  );
}

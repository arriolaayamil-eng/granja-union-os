import type { Customer } from "@/lib/api/types";
import { delay, request } from "@/lib/api/client";
import { customers } from "@/mocks/data";

export function getCustomers(): Promise<Customer[]> {
  return request<Customer[]>("/customers", {}, () => delay([...customers]));
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

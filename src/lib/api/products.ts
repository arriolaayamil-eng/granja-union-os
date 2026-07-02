import type { BranchProduct, Product } from "@/lib/api/types";
import { delay, request } from "@/lib/api/client";
import { branchProducts, products } from "@/mocks/data";

export function getProducts(): Promise<Product[]> {
  return request<Product[]>("/products", {}, () => delay([...products]));
}

export function getBranchProducts(): Promise<BranchProduct[]> {
  return request<BranchProduct[]>("/branch-products", {}, () => delay([...branchProducts]));
}

export function saveProduct(product: Product): Promise<Product> {
  return request<Product>(
    product.id ? `/products/${product.id}` : "/products",
    { method: product.id ? "PUT" : "POST", body: product },
    () => {
      if (product.id) {
        const i = products.findIndex((p) => p.id === product.id);
        if (i >= 0) products[i] = product;
      } else {
        product.id = `p${products.length + 1}`;
        product.image = product.image || `/images/${product.id}.webp`;
        products.push(product);
        for (const bp of new Set(branchProducts.map((b) => b.branchId))) {
          branchProducts.push({ branchId: bp, productId: product.id, price: null, active: null, stock: 0, minStock: 10 });
        }
      }
      return delay(product);
    },
  );
}

export function deleteProduct(id: string): Promise<{ ok: true }> {
  return request<{ ok: true }>(`/products/${id}`, { method: "DELETE" }, () => {
    const i = products.findIndex((p) => p.id === id);
    if (i >= 0) products.splice(i, 1);
    return delay({ ok: true as const });
  });
}

export function saveBranchOverride(override: BranchProduct): Promise<BranchProduct> {
  return request<BranchProduct>(
    `/branches/${override.branchId}/products/${override.productId}`,
    { method: "PUT", body: override },
    () => {
      const i = branchProducts.findIndex(
        (b) => b.branchId === override.branchId && b.productId === override.productId,
      );
      if (i >= 0) branchProducts[i] = override;
      else branchProducts.push(override);
      return delay(override);
    },
  );
}

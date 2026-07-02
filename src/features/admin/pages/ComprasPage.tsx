import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PackageCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { EmptyState, Loading, PageHeader, PhaseBadge } from "@/features/admin/components/shared";
import { getSuppliers, getPurchaseOrders, receivePurchaseOrder } from "@/lib/api/suppliers";
import { formatCurrency, formatDate } from "@/lib/format";
import { useAuth } from "@/lib/auth-store";

const poStatus: Record<string, { label: string; cls: string }> = {
  draft: { label: "Borrador", cls: "bg-muted text-muted-foreground" },
  ordered: { label: "Pedido", cls: "bg-amber-100 text-amber-800" },
  received: { label: "Recibido", cls: "bg-emerald-100 text-emerald-800" },
};

export function ComprasPage() {
  const { activeBranch } = useAuth();
  const qc = useQueryClient();
  const { data: suppliers, isLoading } = useQuery({ queryKey: ["suppliers"], queryFn: getSuppliers });
  const { data: orders = [] } = useQuery({ queryKey: ["purchase-orders", activeBranch], queryFn: () => getPurchaseOrders(activeBranch) });

  const receive = useMutation({
    mutationFn: receivePurchaseOrder,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchase-orders"] });
      toast.success("Orden recibida, stock actualizado");
    },
  });

  if (isLoading) return <Loading />;

  return (
    <div>
      <PageHeader title="Compras / Proveedores" phase subtitle="Proveedores y órdenes de compra" />
      <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
        <PhaseBadge label="Se activa por fase" /> Datos de demostración.
      </div>

      <Tabs defaultValue="suppliers">
        <TabsList>
          <TabsTrigger value="suppliers">Proveedores</TabsTrigger>
          <TabsTrigger value="orders">Órdenes de compra</TabsTrigger>
        </TabsList>

        <TabsContent value="suppliers" className="mt-4 space-y-2">
          {!suppliers || suppliers.length === 0 ? (
            <EmptyState message="Sin proveedores" />
          ) : (
            suppliers.map((s) => (
              <Card key={s.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-semibold">{s.name}</p>
                    <p className="text-xs text-muted-foreground">CUIT {s.cuit} · {s.contact} · {s.phone}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Saldo cta. cte.</p>
                    <p className={`font-bold tabular-nums ${s.balance > 0 ? "text-red-600" : ""}`}>{formatCurrency(s.balance)}</p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="orders" className="mt-4 space-y-2">
          {orders.length === 0 ? (
            <EmptyState message="Sin órdenes de compra" />
          ) : (
            orders.map((o) => {
              const st = poStatus[o.status];
              return (
                <Card key={o.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-semibold">Orden {o.id}</p>
                      <p className="text-xs text-muted-foreground">{o.items.length} ítems · {formatDate(o.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold tabular-nums">{formatCurrency(o.total)}</span>
                      <Badge className={st.cls}>{st.label}</Badge>
                      {o.status !== "received" && (
                        <Button size="sm" variant="outline" disabled={receive.isPending} onClick={() => receive.mutate(o.id)}>
                          <PackageCheck className="mr-1 h-4 w-4" /> Recibir
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageCircle, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  EmptyState,
  ErrorState,
  ListSkeleton,
  PageHeader,
  PhaseBadge,
  StatusBadge,
} from "@/features/admin/components/shared";
import { getSales, fulfillSale } from "@/lib/api/sales";
import { getBranches } from "@/lib/api/branches";
import { getProducts } from "@/lib/api/products";
import { formatCurrency, formatDate } from "@/lib/format";
import { useAuth } from "@/lib/auth-store";
import type { Sale } from "@/lib/api/types";

const FILTERS = [
  { value: "paid", label: "Pagados sin entregar" },
  { value: "all", label: "Todos" },
  { value: "pending_payment", label: "Pendientes" },
  { value: "fulfilled", label: "Entregados" },
];

export function VentasPage() {
  const { activeBranch, isGeneral } = useAuth();
  const qc = useQueryClient();
  const [filter, setFilter] = useState("paid");
  const [detail, setDetail] = useState<Sale | null>(null);

  const { data: branches = [] } = useQuery({ queryKey: ["branches"], queryFn: getBranches });
  const branchName = (id: string) => branches.find((b) => b.id === id)?.name ?? id;

  const { data: sales, isLoading, isError, refetch } = useQuery({
    queryKey: ["sales", activeBranch, filter],
    queryFn: () => getSales(activeBranch, filter === "all" ? undefined : filter),
  });

  const fulfill = useMutation({
    mutationFn: fulfillSale,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Pedido marcado como entregado");
      setDetail(null);
    },
  });

  return (
    <div>
      <PageHeader title="Ventas" subtitle="Pedidos web y venta en mostrador" />

      <Tabs defaultValue="web">
        <TabsList>
          <TabsTrigger value="web">Pedidos web</TabsTrigger>
          <TabsTrigger value="pos">POS (mostrador)</TabsTrigger>
        </TabsList>

        {/* ── Pedidos web ── */}
        <TabsContent value="web" className="mt-4 space-y-3">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FILTERS.map((f) => (
                <SelectItem key={f.value} value={f.value}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {isLoading && <ListSkeleton />}
          {isError && <ErrorState onRetry={refetch} />}
          {sales && sales.length === 0 && <EmptyState message="No hay pedidos con este filtro" />}

          {sales && sales.length > 0 && (
            <div className="space-y-2">
              {sales.map((s) => (
                <Card key={s.id} className="cursor-pointer transition-colors hover:bg-muted/40" onClick={() => setDetail(s)}>
                  <CardContent className="flex items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold">{s.code}</span>
                        <StatusBadge status={s.status} />
                        {isGeneral && <span className="text-xs text-muted-foreground">· {branchName(s.branchId)}</span>}
                      </div>
                      <p className="mt-1 truncate text-sm text-muted-foreground">
                        {s.customer.nombre} · {s.items.length} ítems · {formatDate(s.createdAt)}
                      </p>
                    </div>
                    <span className="shrink-0 font-bold tabular-nums">{formatCurrency(s.total)}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── POS estructura lista ── */}
        <TabsContent value="pos" className="mt-4">
          <PosPlaceholder />
        </TabsContent>
      </Tabs>

      {/* Detalle de pedido */}
      <Sheet open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <SheetContent className="w-full overflow-auto sm:max-w-md">
          {detail && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  {detail.code} <StatusBadge status={detail.status} />
                </SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-4">
                <div className="rounded-lg border p-3 text-sm">
                  <p className="font-medium">{detail.customer.nombre}</p>
                  <p className="text-muted-foreground">{detail.customer.telefono}</p>
                  <p className="text-muted-foreground">{detail.customer.direccion} · {detail.customer.zona}</p>
                  {detail.customer.aclaraciones && (
                    <p className="mt-1 text-muted-foreground">Nota: {detail.customer.aclaraciones}</p>
                  )}
                </div>

                <div className="space-y-2">
                  {detail.items.map((it, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span>{it.qty} {it.unit} · {it.name}</span>
                      <span className="tabular-nums">{formatCurrency(it.price * it.qty)}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-1 border-t pt-3 text-sm">
                  <Row label="Subtotal" value={formatCurrency(detail.subtotal)} />
                  <Row label="Envío" value={formatCurrency(detail.shipping)} />
                  <Row label="Total" value={formatCurrency(detail.total)} bold />
                </div>

                {detail.customer.telefono && (
                  <Button variant="outline" className="w-full" asChild>
                    <a href={`https://wa.me/${detail.customer.telefono.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">
                      <MessageCircle className="mr-2 h-4 w-4" /> Contactar por WhatsApp
                    </a>
                  </Button>
                )}

                {detail.status === "paid" && (
                  <Button className="h-11 w-full" disabled={fulfill.isPending} onClick={() => fulfill.mutate(detail.id)}>
                    Marcar entregado
                  </Button>
                )}

                {/* FASE 2 */}
                <Button variant="secondary" className="w-full" disabled title="FASE 2">
                  Ajustar total al pesar (Fase 2)
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "font-bold" : "text-muted-foreground"}`}>
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

function PosPlaceholder() {
  const { data: products = [] } = useQuery({ queryKey: ["products"], queryFn: getProducts });
  const [cart, setCart] = useState<{ id: string; name: string; price: number; qty: number }[]>([]);
  const [q, setQ] = useState("");
  const total = cart.reduce((a, c) => a + c.price * c.qty, 0);
  const filtered = products.filter((p) => p.name.toLowerCase().includes(q.toLowerCase())).slice(0, 6);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 rounded-lg border border-dashed bg-muted/40 p-3 text-sm text-muted-foreground">
        <PhaseBadge label="Se activa en Fase 2" />
        Flujo de venta en mostrador listo. Cobro real disponible al activar Mercado Pago/POS.
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="space-y-3 p-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="pl-8" placeholder="Buscar producto…" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <div className="space-y-2">
              {filtered.map((p) => (
                <button
                  key={p.id}
                  className="flex w-full items-center justify-between rounded-lg border p-2 text-sm hover:bg-muted"
                  onClick={() =>
                    setCart((c) => {
                      const ex = c.find((x) => x.id === p.id);
                      if (ex) return c.map((x) => (x.id === p.id ? { ...x, qty: x.qty + 1 } : x));
                      return [...c, { id: p.id, name: p.name, price: p.basePrice, qty: 1 }];
                    })
                  }
                >
                  <span>{p.name}</span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    {formatCurrency(p.basePrice)} <Plus className="h-4 w-4" />
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 p-4">
            <p className="font-medium">Ticket</p>
            {cart.length === 0 && <p className="text-sm text-muted-foreground">Agregá productos…</p>}
            {cart.map((c) => (
              <div key={c.id} className="flex items-center justify-between text-sm">
                <span>{c.qty}× {c.name}</span>
                <span className="flex items-center gap-2">
                  <span className="tabular-nums">{formatCurrency(c.price * c.qty)}</span>
                  <button onClick={() => setCart((x) => x.filter((i) => i.id !== c.id))}>
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </button>
                </span>
              </div>
            ))}
            <div className="flex justify-between border-t pt-2 font-bold">
              <span>Total</span>
              <span className="tabular-nums">{formatCurrency(total)}</span>
            </div>
            <Select disabled>
              <SelectTrigger><SelectValue placeholder="Medio de pago" /></SelectTrigger>
              <SelectContent><SelectItem value="efectivo">Efectivo</SelectItem></SelectContent>
            </Select>
            <div className="grid grid-cols-2 gap-2">
              <Button disabled>Cobrar</Button>
              <Button variant="outline" disabled>Cobrar y facturar</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

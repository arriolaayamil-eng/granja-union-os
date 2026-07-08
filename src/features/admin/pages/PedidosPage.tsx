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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  EmptyState,
  ErrorState,
  ListSkeleton,
  PageHeader,
  StatusBadge,
  ZoneLabel,
} from "@/features/admin/components/shared";
import { getSales, transitionSale, updateSaleZona } from "@/lib/api/sales";
import { getBranches } from "@/lib/api/branches";
import { getProducts } from "@/lib/api/products";
import { formatCurrency, formatDate } from "@/lib/format";
import { useAuth } from "@/lib/auth-store";
import { ZONES, ZONE_LABELS } from "@/lib/api/types";
import type { Sale, SaleStatus, ZoneValue } from "@/lib/api/types";

const STATUS_FILTERS = [
  { value: "paid,en_preparacion", label: "Pedidos por entregar" },
  { value: "all", label: "Todos" },
  { value: "pending_payment", label: "Pendientes de pago" },
  { value: "paid", label: "Pagados" },
  { value: "en_preparacion", label: "En preparación" },
  { value: "en_camino", label: "En camino" },
  { value: "entregado", label: "Entregados" },
  { value: "cancelled", label: "Cancelados" },
];

// Próxima transición manual disponible por estado (null = sin acción, ya sea terminal o esperando webhook de MP).
const NEXT_ACTION: Partial<Record<SaleStatus, { to: "en_preparacion" | "en_camino" | "entregado"; label: string }>> = {
  paid: { to: "en_preparacion", label: "Marcar en preparación" },
  en_preparacion: { to: "en_camino", label: "Marcar en camino" },
  en_camino: { to: "entregado", label: "Confirmar entrega" },
};

function canCancel(status: SaleStatus) {
  return !["entregado", "fulfilled", "cancelled", "rejected"].includes(status);
}

export function PedidosPage() {
  const { activeBranch, isGeneral } = useAuth();
  const qc = useQueryClient();
  const [filter, setFilter] = useState("paid,en_preparacion");
  const [zonaFilter, setZonaFilter] = useState<string>("all");
  const [detail, setDetail] = useState<Sale | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ sale: Sale; to: "en_preparacion" | "en_camino" | "entregado" | "cancelled"; label: string } | null>(null);

  const { data: branches = [] } = useQuery({ queryKey: ["branches"], queryFn: getBranches });
  const branchName = (id: string) => branches.find((b) => b.id === id)?.name ?? id;

  const { data: sales, isLoading, isError, refetch } = useQuery({
    queryKey: ["sales", activeBranch, filter, zonaFilter],
    queryFn: () => getSales(activeBranch, filter === "all" ? undefined : filter, zonaFilter === "all" ? undefined : zonaFilter),
  });

  const transition = useMutation({
    mutationFn: ({ id, to }: { id: string; to: "en_preparacion" | "en_camino" | "entregado" | "cancelled" }) => transitionSale(id, to),
    onSuccess: (sale) => {
      qc.invalidateQueries({ queryKey: ["sales"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success(sale.status === "cancelled" ? "Pedido cancelado" : "Estado actualizado");
      setConfirmAction(null);
      setDetail((d) => (d && d.id === sale.id ? sale : d));
    },
    onError: () => toast.error("No se pudo actualizar el estado"),
  });

  const setZona = useMutation({
    mutationFn: ({ id, zona }: { id: string; zona: ZoneValue }) => updateSaleZona(id, zona),
    onSuccess: (sale) => {
      qc.invalidateQueries({ queryKey: ["sales"] });
      qc.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Zona actualizada");
      setDetail(sale);
    },
  });

  return (
    <div>
      <PageHeader title="Pedidos" subtitle="Pedidos web y venta en mostrador" />

      <Tabs defaultValue="web">
        <TabsList>
          <TabsTrigger value="web">Pedidos web</TabsTrigger>
          <TabsTrigger value="pos">POS (mostrador)</TabsTrigger>
        </TabsList>

        {/* ── Pedidos web ── */}
        <TabsContent value="web" className="mt-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-full sm:w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_FILTERS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={zonaFilter} onValueChange={setZonaFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las zonas</SelectItem>
                {ZONES.map((z) => (
                  <SelectItem key={z} value={z}>{ZONE_LABELS[z]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading && <ListSkeleton />}
          {isError && <ErrorState onRetry={refetch} />}
          {sales && sales.length === 0 && <EmptyState message="No hay pedidos con este filtro" />}

          {sales && sales.length > 0 && (
            <div className="space-y-2">
              {sales.map((s) => {
                const next = NEXT_ACTION[s.status];
                return (
                  <Card key={s.id} className="cursor-pointer transition-colors hover:bg-muted/40" onClick={() => setDetail(s)}>
                    <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold">{s.code}</span>
                          <StatusBadge status={s.status} />
                          {isGeneral && <span className="text-xs text-muted-foreground">· {branchName(s.branchId)}</span>}
                        </div>
                        <p className="mt-1 truncate text-sm text-muted-foreground">
                          {s.customer.nombre} · <ZoneLabel zona={s.customer.zona} /> · {formatDate(s.createdAt)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className="font-bold tabular-nums">{formatCurrency(s.total)}</span>
                        {next && (
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmAction({ sale: s, to: next.to, label: next.label });
                            }}
                          >
                            {next.label}
                          </Button>
                        )}
                        {canCancel(s.status) && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-muted-foreground hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmAction({ sale: s, to: "cancelled", label: "Cancelar pedido" });
                            }}
                          >
                            Cancelar
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ── POS estructura lista ── */}
        <TabsContent value="pos" className="mt-4">
          <PosPlaceholder />
        </TabsContent>
      </Tabs>

      {/* Confirmación simple de transición */}
      <AlertDialog open={!!confirmAction} onOpenChange={(o) => !o && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmAction?.label}</AlertDialogTitle>
            <AlertDialogDescription>
              Pedido {confirmAction?.sale.code} · {confirmAction?.sale.customer.nombre}
              {confirmAction?.to === "cancelled" && " — esta acción no se puede deshacer."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Volver</AlertDialogCancel>
            <AlertDialogAction
              disabled={transition.isPending}
              onClick={() => confirmAction && transition.mutate({ id: confirmAction.sale.id, to: confirmAction.to })}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
                  <p className="text-muted-foreground">{detail.customer.direccion}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Zona</span>
                    <Select
                      value={detail.customer.zona}
                      onValueChange={(v) => setZona.mutate({ id: detail.id, zona: v as ZoneValue })}
                    >
                      <SelectTrigger className="h-8 w-48"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ZONES.map((z) => <SelectItem key={z} value={z}>{ZONE_LABELS[z]}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  {detail.customer.aclaraciones && (
                    <p className="mt-2 text-muted-foreground">Nota: {detail.customer.aclaraciones}</p>
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

                <div className="space-y-1 border-t pt-3">
                  <p className="text-sm font-medium">Historial de estados</p>
                  {detail.statusHistory.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sin historial.</p>
                  ) : (
                    detail.statusHistory.map((h, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <StatusBadge status={h.status} />
                        <span className="text-xs text-muted-foreground">{formatDate(h.at)}</span>
                      </div>
                    ))
                  )}
                </div>

                {detail.customer.telefono && (
                  <Button variant="outline" className="w-full" asChild>
                    <a href={`https://wa.me/${detail.customer.telefono.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">
                      <MessageCircle className="mr-2 h-4 w-4" /> Contactar por WhatsApp
                    </a>
                  </Button>
                )}

                {NEXT_ACTION[detail.status] && (
                  <Button
                    className="h-11 w-full"
                    disabled={transition.isPending}
                    onClick={() => setConfirmAction({ sale: detail, to: NEXT_ACTION[detail.status]!.to, label: NEXT_ACTION[detail.status]!.label })}
                  >
                    {NEXT_ACTION[detail.status]!.label}
                  </Button>
                )}
                {canCancel(detail.status) && (
                  <Button
                    variant="outline"
                    className="w-full text-destructive hover:text-destructive"
                    onClick={() => setConfirmAction({ sale: detail, to: "cancelled", label: "Cancelar pedido" })}
                  >
                    Cancelar pedido
                  </Button>
                )}
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

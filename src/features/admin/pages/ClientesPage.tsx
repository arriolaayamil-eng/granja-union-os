import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageCircle, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { EmptyState, Loading, PageHeader, ZoneLabel } from "@/features/admin/components/shared";
import { getCustomers, saveCustomer } from "@/lib/api/customers";
import { formatCurrency, formatDate } from "@/lib/format";
import { ZONES, ZONE_LABELS } from "@/lib/api/types";
import type { Customer, ZoneValue } from "@/lib/api/types";

const emptyCustomer = (): Customer => ({
  id: "", name: "", phone: "", email: "", address: "", zona: "OTRA", docTipo: "DNI", docNro: "", condicionIVA: "Consumidor Final", notes: "",
});

export function ClientesPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [zonaFilter, setZonaFilter] = useState<string>("all");
  const [editing, setEditing] = useState<Customer | null>(null);
  const { data: customers, isLoading } = useQuery({
    queryKey: ["customers", zonaFilter],
    queryFn: () => getCustomers(zonaFilter === "all" ? undefined : zonaFilter),
  });

  const save = useMutation({
    mutationFn: saveCustomer,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["customers"] }); toast.success("Cliente guardado"); setEditing(null); },
  });

  if (isLoading) return <Loading />;
  const filtered = (customers ?? []).filter((c) => c.name.toLowerCase().includes(q.toLowerCase()) || c.phone.includes(q));

  return (
    <div>
      <PageHeader
        title="Clientes"
        subtitle="Fichas, zona y pedidos"
        actions={<Button onClick={() => setEditing(emptyCustomer())}><Plus className="mr-1 h-4 w-4" /> Nuevo</Button>}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="Buscar por nombre o teléfono…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select value={zonaFilter} onValueChange={setZonaFilter}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las zonas</SelectItem>
            {ZONES.map((z) => <SelectItem key={z} value={z}>{ZONE_LABELS[z]}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState message="Sin clientes" />
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <Card key={c.id} className="cursor-pointer hover:bg-muted/40" onClick={() => setEditing(c)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold">{c.name}</p>
                  <ZoneLabel zona={c.zona} />
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{c.phone}</span>
                  {c.phone && (
                    <a
                      href={`https://wa.me/${c.phone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-whatsapp hover:underline"
                    >
                      <MessageCircle className="h-3 w-3" /> WhatsApp
                    </a>
                  )}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {c.orderCount ?? 0} pedidos · {formatCurrency(c.totalSpent ?? 0)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Último pedido: {c.lastOrderAt ? formatDate(c.lastOrderAt) : "—"}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Sheet open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <SheetContent className="w-full overflow-auto sm:max-w-md">
          {editing && <CustomerForm customer={editing} onSave={(c) => save.mutate(c)} onCancel={() => setEditing(null)} saving={save.isPending} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function CustomerForm({
  customer, onSave, onCancel, saving,
}: {
  customer: Customer;
  onSave: (c: Customer) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<Customer>(customer);
  const set = (p: Partial<Customer>) => setForm((f) => ({ ...f, ...p }));
  return (
    <>
      <SheetHeader><SheetTitle>{customer.id ? "Editar cliente" : "Nuevo cliente"}</SheetTitle></SheetHeader>
      <div className="mt-4 space-y-4">
        <div className="space-y-1"><Label>Nombre</Label><Input value={form.name} onChange={(e) => set({ name: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1"><Label>Teléfono</Label><Input value={form.phone} onChange={(e) => set({ phone: e.target.value })} /></div>
          <div className="space-y-1"><Label>Email</Label><Input value={form.email} onChange={(e) => set({ email: e.target.value })} /></div>
        </div>
        <div className="space-y-1"><Label>Dirección</Label><Input value={form.address} onChange={(e) => set({ address: e.target.value })} /></div>
        <div className="space-y-1">
          <Label>Zona</Label>
          <Select value={form.zona} onValueChange={(v) => set({ zona: v as ZoneValue })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {ZONES.map((z) => <SelectItem key={z} value={z}>{ZONE_LABELS[z]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <p className="pt-2 text-sm font-medium">Datos fiscales</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label>Tipo doc.</Label>
            <Select value={form.docTipo} onValueChange={(v) => set({ docTipo: v as Customer["docTipo"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="DNI">DNI</SelectItem><SelectItem value="CUIT">CUIT</SelectItem><SelectItem value="CF">CF</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="space-y-1"><Label>Nro doc.</Label><Input value={form.docNro} onChange={(e) => set({ docNro: e.target.value })} /></div>
        </div>
        <div className="space-y-1"><Label>Condición IVA</Label><Input value={form.condicionIVA} onChange={(e) => set({ condicionIVA: e.target.value })} /></div>

        {customer.id && (
          <div className="space-y-1 border-t pt-3">
            <Label>Resumen</Label>
            <p className="text-sm text-muted-foreground">
              {customer.orderCount ?? 0} pedidos · {formatCurrency(customer.totalSpent ?? 0)} gastados
              {customer.lastOrderAt && ` · último el ${formatDate(customer.lastOrderAt)}`}
            </p>
          </div>
        )}
      </div>
      <SheetFooter className="mt-4">
        <Button variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button disabled={saving || !form.name} onClick={() => onSave(form)}>Guardar</Button>
      </SheetFooter>
    </>
  );
}

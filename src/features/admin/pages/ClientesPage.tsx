import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
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
import { EmptyState, Loading, PageHeader, PhaseBadge } from "@/features/admin/components/shared";
import { getCustomers, saveCustomer } from "@/lib/api/customers";
import { getSales } from "@/lib/api/sales";
import { formatCurrency } from "@/lib/format";
import type { Customer } from "@/lib/api/types";

const emptyCustomer = (): Customer => ({
  id: "", name: "", phone: "", email: "", address: "", docTipo: "DNI", docNro: "", condicionIVA: "Consumidor Final", notes: "",
});

export function ClientesPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Customer | null>(null);
  const { data: customers, isLoading } = useQuery({ queryKey: ["customers"], queryFn: getCustomers });
  const { data: sales = [] } = useQuery({ queryKey: ["sales-all"], queryFn: () => getSales() });

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
        phase
        subtitle="Fichas, datos fiscales e historial"
        actions={<Button onClick={() => setEditing(emptyCustomer())}><Plus className="mr-1 h-4 w-4" /> Nuevo</Button>}
      />
      <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
        <PhaseBadge label="Se activa por fase" /> Datos de demostración.
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input className="pl-8" placeholder="Buscar por nombre o teléfono…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState message="Sin clientes" />
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => {
            const compras = sales.filter((s) => s.customerId === c.id);
            const total = compras.reduce((a, s) => a + s.total, 0);
            return (
              <Card key={c.id} className="cursor-pointer hover:bg-muted/40" onClick={() => setEditing(c)}>
                <CardContent className="p-4">
                  <p className="font-semibold">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.phone} · {c.docTipo} {c.docNro}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{compras.length} compras · {formatCurrency(total)}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Sheet open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <SheetContent className="w-full overflow-auto sm:max-w-md">
          {editing && <CustomerForm customer={editing} onSave={(c) => save.mutate(c)} onCancel={() => setEditing(null)} saving={save.isPending} sales={sales.filter((s) => s.customerId === editing.id)} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function CustomerForm({
  customer, onSave, onCancel, saving, sales,
}: {
  customer: Customer;
  onSave: (c: Customer) => void;
  onCancel: () => void;
  saving: boolean;
  sales: { id: string; code: string; total: number }[];
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
          <div className="space-y-1">
            <Label>Historial de compras</Label>
            {sales.length === 0 ? <p className="text-sm text-muted-foreground">Sin compras registradas.</p> : sales.map((s) => (
              <div key={s.id} className="flex justify-between text-sm"><span>{s.code}</span><span className="tabular-nums">{formatCurrency(s.total)}</span></div>
            ))}
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

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, Paperclip, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { getExpenses, getExpenseCategories, saveExpense, markExpensePaid } from "@/lib/api/expenses";
import { formatCurrency, formatDateLong, daysUntil } from "@/lib/format";
import { useAuth } from "@/lib/auth-store";
import type { Expense, Recurrence } from "@/lib/api/types";

const statusMap: Record<string, { label: string; cls: string }> = {
  pending: { label: "Pendiente", cls: "bg-amber-100 text-amber-800" },
  paid: { label: "Pagado", cls: "bg-emerald-100 text-emerald-800" },
  overdue: { label: "Vencido", cls: "bg-red-100 text-red-800" },
};
const recurrenceLabel: Record<Recurrence, string> = {
  none: "Único", weekly: "Semanal", monthly: "Mensual", bimonthly: "Bimestral", yearly: "Anual",
};

export function GastosPage() {
  const { activeBranch } = useAuth();
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);

  const { data: expenses, isLoading } = useQuery({ queryKey: ["expenses", activeBranch], queryFn: () => getExpenses(activeBranch) });
  const { data: categories = [] } = useQuery({ queryKey: ["expense-categories"], queryFn: getExpenseCategories });

  const catName = (id: string) => categories.find((c) => c.id === id)?.name ?? id;

  const pay = useMutation({
    mutationFn: markExpensePaid,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["expenses"] }); toast.success("Gasto pagado"); },
  });
  const save = useMutation({
    mutationFn: saveExpense,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["expenses"] }); toast.success("Gasto guardado"); setCreating(false); },
  });

  if (isLoading) return <Loading />;

  const upcoming = (expenses ?? []).filter((e) => e.status !== "paid");

  return (
    <div>
      <PageHeader
        title="Gastos y Vencimientos"
        phase
        subtitle="Obligaciones, vencimientos y recurrencias"
        actions={<Button onClick={() => setCreating(true)}><Plus className="mr-1 h-4 w-4" /> Nuevo</Button>}
      />

      {/* Próximos vencimientos destacado */}
      <Card className="mb-4 border-primary/30">
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><CalendarClock className="h-4 w-4 text-primary" /> Próximos vencimientos</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay vencimientos pendientes.</p>
          ) : (
            upcoming.slice(0, 5).map((e) => {
              const d = daysUntil(e.dueDate);
              const overdue = e.status === "overdue" || (d ?? 0) < 0;
              return (
                <div key={e.id} className="flex items-center justify-between text-sm">
                  <span>{e.description}</span>
                  <span className={overdue ? "font-semibold text-red-600" : "text-muted-foreground"}>
                    {formatCurrency(e.amount)} · {overdue ? "Vencido" : `en ${d} días`}
                  </span>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
        <PhaseBadge label="Se activa por fase" /> Datos de demostración.
      </div>

      {!expenses || expenses.length === 0 ? (
        <EmptyState message="Sin gastos cargados" />
      ) : (
        <div className="space-y-2">
          {expenses.map((e) => {
            const st = statusMap[e.status];
            return (
              <Card key={e.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="font-semibold">{e.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {catName(e.categoryId)} · Vence {formatDateLong(e.dueDate)} · {recurrenceLabel[e.recurrence]}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold tabular-nums">{formatCurrency(e.amount)}</span>
                    <Badge className={st.cls}>{st.label}</Badge>
                    {e.status !== "paid" && (
                      <Button size="sm" variant="outline" disabled={pay.isPending} onClick={() => pay.mutate(e.id)}>Pagar</Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Sheet open={creating} onOpenChange={setCreating}>
        <SheetContent className="w-full overflow-auto sm:max-w-md">
          <ExpenseForm categories={categories} onSave={(e) => save.mutate(e)} saving={save.isPending} onCancel={() => setCreating(false)} branchId={activeBranch === "all" ? null : activeBranch} />
        </SheetContent>
      </Sheet>
    </div>
  );
}

function ExpenseForm({
  categories, onSave, saving, onCancel, branchId,
}: {
  categories: { id: string; name: string }[];
  onSave: (e: Expense) => void;
  saving: boolean;
  onCancel: () => void;
  branchId: string | null;
}) {
  const [form, setForm] = useState<Expense>({
    id: "", branchId, categoryId: categories[0]?.id ?? "", description: "", amount: 0,
    dueDate: new Date().toISOString().slice(0, 10), status: "pending", recurrence: "monthly",
  });
  const set = (p: Partial<Expense>) => setForm((f) => ({ ...f, ...p }));
  return (
    <>
      <SheetHeader><SheetTitle>Nuevo gasto</SheetTitle></SheetHeader>
      <div className="mt-4 space-y-4">
        <div className="space-y-1"><Label>Descripción</Label><Input value={form.description} onChange={(e) => set({ description: e.target.value })} /></div>
        <div className="space-y-1">
          <Label>Categoría</Label>
          <Select value={form.categoryId} onValueChange={(v) => set({ categoryId: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1"><Label>Monto</Label><Input type="number" value={form.amount} onChange={(e) => set({ amount: +e.target.value })} /></div>
          <div className="space-y-1"><Label>Vencimiento</Label><Input type="date" value={form.dueDate.slice(0, 10)} onChange={(e) => set({ dueDate: e.target.value })} /></div>
        </div>
        <div className="space-y-1">
          <Label>Recurrencia</Label>
          <Select value={form.recurrence} onValueChange={(v) => set({ recurrence: v as Recurrence })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{(Object.keys(recurrenceLabel) as Recurrence[]).map((r) => <SelectItem key={r} value={r}>{recurrenceLabel[r]}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Comprobante</Label>
          <Button type="button" variant="outline" size="sm" className="w-full"><Paperclip className="mr-1 h-4 w-4" /> Adjuntar (UI)</Button>
        </div>
      </div>
      <SheetFooter className="mt-4">
        <Button variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button disabled={saving || !form.description} onClick={() => onSave(form)}>Guardar</Button>
      </SheetFooter>
    </>
  );
}

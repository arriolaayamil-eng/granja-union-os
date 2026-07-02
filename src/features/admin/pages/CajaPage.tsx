import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownCircle, ArrowUpCircle, Lock, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { EmptyState, Loading, PageHeader, PhaseBadge } from "@/features/admin/components/shared";
import { getCash } from "@/lib/api/cash";
import { formatCurrency, formatDate } from "@/lib/format";
import { useAuth } from "@/lib/auth-store";

const methodLabel: Record<string, string> = {
  mp: "Mercado Pago", efectivo: "Efectivo", transferencia: "Transferencia", debito: "Débito",
};
const typeLabel: Record<string, string> = {
  sale: "Venta", expense: "Gasto", withdrawal: "Retiro", deposit: "Ingreso",
};

export function CajaPage() {
  const { activeBranch } = useAuth();
  const { data, isLoading } = useQuery({ queryKey: ["cash", activeBranch], queryFn: () => getCash(activeBranch) });

  if (isLoading) return <Loading />;
  const session = data?.session ?? null;
  const movements = data?.movements ?? [];
  const totalIn = movements.filter((m) => m.type !== "withdrawal" && m.type !== "expense").reduce((a, m) => a + m.amount, 0);
  const expected = (session?.openingAmount ?? 0) + totalIn - movements.filter((m) => m.type === "withdrawal" || m.type === "expense").reduce((a, m) => a + m.amount, 0);

  return (
    <div>
      <PageHeader title="Caja" phase subtitle="Apertura, movimientos y arqueo diario" />

      <div className="mb-4 flex items-center gap-2 rounded-lg border border-dashed bg-muted/40 p-3 text-sm text-muted-foreground">
        <PhaseBadge label="Se activa por fase" /> Datos de demostración.
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-base">Estado de caja</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {session ? (
              <>
                <div className="flex items-center gap-2 text-emerald-600"><Unlock className="h-5 w-5" /> Caja abierta</div>
                <p className="text-sm text-muted-foreground">Apertura: {formatCurrency(session.openingAmount)} · {formatDate(session.openedAt)}</p>
                <p className="text-sm">Esperado en caja: <span className="font-bold tabular-nums">{formatCurrency(expected)}</span></p>
                <CloseCashDialog expected={expected} />
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 text-muted-foreground"><Lock className="h-5 w-5" /> Caja cerrada</div>
                <OpenCashDialog />
              </>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Movimientos del día</CardTitle></CardHeader>
          <CardContent>
            {movements.length === 0 ? (
              <EmptyState message="Sin movimientos" />
            ) : (
              <div className="space-y-2">
                {movements.map((m) => {
                  const out = m.type === "withdrawal" || m.type === "expense";
                  return (
                    <div key={m.id} className="flex items-center justify-between border-b pb-2 text-sm last:border-0">
                      <div className="flex items-center gap-2">
                        {out ? <ArrowUpCircle className="h-4 w-4 text-red-500" /> : <ArrowDownCircle className="h-4 w-4 text-emerald-500" />}
                        <div>
                          <p>{typeLabel[m.type]} · {methodLabel[m.method]}</p>
                          <p className="text-xs text-muted-foreground">{m.note ?? m.reference ?? ""} {formatDate(m.at)}</p>
                        </div>
                      </div>
                      <span className={`font-semibold tabular-nums ${out ? "text-red-600" : "text-emerald-600"}`}>
                        {out ? "-" : "+"}{formatCurrency(m.amount)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function OpenCashDialog() {
  const [amount, setAmount] = useState("");
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button className="w-full">Abrir caja</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Abrir caja</DialogTitle></DialogHeader>
        <div className="space-y-1">
          <Label>Monto inicial</Label>
          <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" />
        </div>
        <DialogFooter>
          <Button onClick={() => { setOpen(false); toast.success("Caja abierta"); }}>Confirmar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CloseCashDialog({ expected }: { expected: number }) {
  const [counted, setCounted] = useState("");
  const [open, setOpen] = useState(false);
  const diff = (Number(counted) || 0) - expected;
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="outline" className="w-full">Cerrar caja (arqueo)</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Arqueo de caja</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <p className="text-sm">Esperado: <span className="font-semibold">{formatCurrency(expected)}</span></p>
          <div className="space-y-1">
            <Label>Contado</Label>
            <Input type="number" value={counted} onChange={(e) => setCounted(e.target.value)} />
          </div>
          {counted && (
            <p className={`text-sm font-semibold ${diff === 0 ? "text-emerald-600" : "text-red-600"}`}>
              Diferencia: {formatCurrency(diff)}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button onClick={() => { setOpen(false); toast.success("Caja cerrada"); }}>Cerrar caja</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { EmptyState, Loading, PageHeader, PhaseBadge } from "@/features/admin/components/shared";
import { getInvoices, emitInvoice } from "@/lib/api/invoices";
import { getFiscalConfig } from "@/lib/api/integrations";
import { getBranches } from "@/lib/api/branches";
import { formatCurrency, formatDate } from "@/lib/format";
import { useAuth } from "@/lib/auth-store";

const invStatus: Record<string, { label: string; cls: string }> = {
  pending: { label: "Pendiente", cls: "bg-amber-100 text-amber-800" },
  authorized: { label: "Autorizado", cls: "bg-emerald-100 text-emerald-800" },
  error: { label: "Error", cls: "bg-red-100 text-red-800" },
};

export function FacturacionPage() {
  const { activeBranch, isGeneral } = useAuth();
  const qc = useQueryClient();
  const { data: invoices, isLoading } = useQuery({ queryKey: ["invoices", activeBranch], queryFn: () => getInvoices(activeBranch) });
  const { data: fiscal } = useQuery({ queryKey: ["fiscal-config"], queryFn: getFiscalConfig });
  const { data: branches = [] } = useQuery({ queryKey: ["branches"], queryFn: getBranches });
  const bName = (id: string) => branches.find((b) => b.id === id)?.name ?? id;

  const emit = useMutation({
    mutationFn: (saleId: string) => emitInvoice(saleId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["invoices"] }); toast.success("Comprobante emitido"); },
  });

  if (isLoading) return <Loading />;
  const afipReady = fiscal && fiscal.status !== "not_configured";

  return (
    <div>
      <PageHeader title="Facturación" phase subtitle="Comprobantes electrónicos AFIP (WSFEv1)" />

      {!afipReady && (
        <Card className="mb-4 border-amber-300 bg-amber-50">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="flex items-center gap-2 text-sm text-amber-800">
              <AlertTriangle className="h-4 w-4" /> Conectá AFIP en Configuración para emitir comprobantes.
            </div>
            {isGeneral && (
              <Button size="sm" variant="outline" asChild><Link to="/admin/config">Ir a Configuración</Link></Button>
            )}
          </CardContent>
        </Card>
      )}

      <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
        <PhaseBadge label="Se activa por fase" /> Datos de demostración.
      </div>

      {!invoices || invoices.length === 0 ? (
        <EmptyState message="Sin comprobantes" />
      ) : (
        <div className="space-y-2">
          {invoices.map((inv) => {
            const st = invStatus[inv.status];
            return (
              <Card key={inv.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <p className="font-semibold">{inv.tipoLabel} · PV {String(inv.puntoVenta).padStart(4, "0")}-{inv.numero ? String(inv.numero).padStart(8, "0") : "—"}</p>
                    <p className="text-xs text-muted-foreground">
                      {isGeneral && bName(inv.branchId) + " · "}{inv.cliente.condicionIVA} · {formatDate(inv.createdAt)}
                      {inv.cae && ` · CAE ${inv.cae}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold tabular-nums">{formatCurrency(inv.total)}</span>
                    <Badge className={st.cls}>{st.label}</Badge>
                    {inv.status === "pending" && inv.saleId && (
                      <Button size="sm" variant="outline" disabled={!afipReady || emit.isPending} onClick={() => emit.mutate(inv.saleId!)}>Emitir</Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

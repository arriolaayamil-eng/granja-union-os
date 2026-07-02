import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard, Loading, PageHeader, PhaseBadge } from "@/features/admin/components/shared";
import { getDashboard } from "@/lib/api/reports";
import { getExpenses } from "@/lib/api/expenses";
import { formatCurrency } from "@/lib/format";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-store";

export function ReportesPage() {
  const { activeBranch } = useAuth();
  const { data: dash, isLoading } = useQuery({ queryKey: ["dashboard", activeBranch], queryFn: () => getDashboard(activeBranch) });
  const { data: expenses = [] } = useQuery({ queryKey: ["expenses", activeBranch], queryFn: () => getExpenses(activeBranch) });

  if (isLoading || !dash) return <Loading />;

  const egresos = expenses.reduce((a, e) => a + e.amount, 0);
  const ingresos = dash.salesMonth;
  const resultado = ingresos - egresos;

  return (
    <div>
      <PageHeader
        title="Contabilidad / Reportes"
        phase
        subtitle="Ingresos, egresos y resultado del período"
        actions={<Button variant="outline" onClick={() => toast.success("Exportación generada (demo)")}><Download className="mr-1 h-4 w-4" /> Exportar</Button>}
      />
      <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
        <PhaseBadge label="Se activa por fase" /> Datos de demostración.
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <KpiCard label="Ingresos del mes" value={formatCurrency(ingresos)} tone="good" />
        <KpiCard label="Egresos del mes" value={formatCurrency(egresos)} tone="danger" />
        <KpiCard label="Resultado" value={formatCurrency(resultado)} tone={resultado >= 0 ? "good" : "danger"} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Ventas por día</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dash.salesByDay}>
                <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={2} />
                <YAxis tick={{ fontSize: 11 }} width={48} tickFormatter={(v) => `$${Math.round(v / 1000)}k`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Bar dataKey="total" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Ventas por sucursal</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {dash.byBranch.map((b) => (
              <div key={b.branchId}>
                <div className="flex justify-between text-sm">
                  <span>{b.branchName}</span>
                  <span className="font-semibold tabular-nums">{formatCurrency(b.salesMonth)}</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${Math.min(100, (b.salesMonth / Math.max(1, ingresos)) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

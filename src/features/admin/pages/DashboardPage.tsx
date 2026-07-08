import { lazy, Suspense, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  AreaChart,
  Area,
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle, Clock, Package, Receipt, TrendingUp, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard, ErrorState, Loading, PageHeader } from "@/features/admin/components/shared";
import { getDashboard } from "@/lib/api/reports";
import { getSales } from "@/lib/api/sales";
import { formatCurrency } from "@/lib/format";
import { useAuth } from "@/lib/auth-store";
import { isCoreMode } from "@/lib/features";
import { cn } from "@/lib/utils";

// Leaflet toca `window`/`document`: solo se importa en el cliente (nunca en SSR).
const ClientesMap = lazy(() => import("@/features/admin/components/ClientesMap"));

export function DashboardPage() {
  const { activeBranch, isGeneral } = useAuth();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["dashboard", activeBranch],
    queryFn: () => getDashboard(activeBranch),
  });
  const { data: salesForMap } = useQuery({
    queryKey: ["sales-map", activeBranch],
    queryFn: () => getSales(activeBranch),
    enabled: mounted,
  });

  if (isLoading) return <Loading />;
  if (isError || !data) return <ErrorState onRetry={refetch} />;

  const coreMode = isCoreMode();

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Pedidos y ventas en tiempo real" />

      <div className={cn("grid grid-cols-2 gap-3 sm:grid-cols-3", coreMode ? "lg:grid-cols-4" : "lg:grid-cols-6")}>
        <KpiCard label="Ventas de hoy" value={formatCurrency(data.salesToday)} icon={<TrendingUp className="h-4 w-4" />} tone="good" />
        <KpiCard label="Ventas del mes" value={formatCurrency(data.salesMonth)} icon={<Wallet className="h-4 w-4" />} />
        <KpiCard label="Ticket promedio" value={formatCurrency(data.avgTicket)} icon={<Receipt className="h-4 w-4" />} />
        <Link to="/admin/ventas" className="block">
          <KpiCard label="Pedidos por entregar" value={data.paidUnfulfilled} hint="pedidos" icon={<Clock className="h-4 w-4" />} tone={data.paidUnfulfilled ? "warn" : "default"} />
        </Link>
        {!coreMode && (
          <KpiCard label="Próx. vencimientos" value={data.upcomingExpenses} hint="por pagar" icon={<AlertTriangle className="h-4 w-4" />} tone={data.upcomingExpenses ? "warn" : "default"} />
        )}
        {!coreMode && (
          <KpiCard label="Stock bajo" value={data.lowStock} hint="productos" icon={<Package className="h-4 w-4" />} tone={data.lowStock ? "danger" : "default"} />
        )}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Ventas últimos 14 días</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.salesByDay} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={1} />
                <YAxis tick={{ fontSize: 11 }} width={48} tickFormatter={(v) => `$${Math.round(v / 1000)}k`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Area type="monotone" dataKey="total" stroke="var(--color-primary)" fill="url(#salesGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {isGeneral && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Comparativa por sucursal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.byBranch.map((b) => (
                <div key={b.branchId} className="rounded-lg border p-3">
                  <p className="font-medium">{b.branchName}</p>
                  <div className="mt-1 flex justify-between text-sm text-muted-foreground">
                    <span>Hoy: {formatCurrency(b.salesToday)}</span>
                    <span>Mes: {formatCurrency(b.salesMonth)}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">Mapa de clientes</CardTitle>
        </CardHeader>
        <CardContent className="h-96 overflow-hidden rounded-b-lg p-0">
          {mounted ? (
            <Suspense fallback={<div className="flex h-full items-center justify-center text-sm text-muted-foreground">Cargando mapa…</div>}>
              <ClientesMap sales={salesForMap ?? []} />
            </Suspense>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Cargando mapa…</div>
          )}
        </CardContent>
      </Card>

      {data.byZone.length > 0 && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">Ventas por zona (este mes)</CardTitle>
          </CardHeader>
          <CardContent style={{ height: Math.max(160, data.byZone.length * 40) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.byZone} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${Math.round(v / 1000)}k`} />
                <YAxis type="category" dataKey="label" tick={{ fontSize: 12 }} width={110} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Bar dataKey="total" fill="var(--color-primary)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

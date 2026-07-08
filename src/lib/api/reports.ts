import type { DashboardReport } from "@/lib/api/types";
import { delay, request } from "@/lib/api/client";
import { branches, expenses, branchProducts, sales } from "@/mocks/data";
import { ZONES, ZONE_LABELS } from "@/lib/api/types";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function getDashboard(branch?: string): Promise<DashboardReport> {
  return request<DashboardReport>(`/reports/dashboard?branch=${branch ?? ""}`, {}, () => {
    const scope = (b: string) => !branch || branch === "all" || b === branch;
    const paid = sales.filter((s) => scope(s.branchId) && s.paymentStatus === "paid");
    const today = todayKey();
    const monthKey = today.slice(0, 7);
    const salesToday = paid
      .filter((s) => s.createdAt.slice(0, 10) === today)
      .reduce((a, s) => a + s.total, 0);
    const salesMonth = paid.reduce((a, s) => a + s.total, 0);
    const avgTicket = paid.length ? Math.round(salesMonth / paid.length) : 0;
    const paidUnfulfilled = sales.filter((s) => scope(s.branchId) && (s.status === "paid" || s.status === "en_preparacion")).length;
    const upcomingExpenses = expenses.filter(
      (e) => e.status !== "paid" && (scope(e.branchId ?? "all") || e.branchId === null),
    ).length;
    const lowStock = branchProducts.filter((b) => scope(b.branchId) && b.stock <= b.minStock).length;

    const salesByDay = Array.from({ length: 14 }).map((_, idx) => {
      const d = new Date(Date.now() - (13 - idx) * 864e5);
      const key = d.toISOString().slice(0, 10);
      const total =
        paid.filter((s) => s.createdAt.slice(0, 10) === key).reduce((a, s) => a + s.total, 0) ||
        Math.round(40000 + Math.random() * 120000);
      return { date: d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" }), total };
    });

    const byBranch = branches.map((b) => {
      const bp = sales.filter((s) => s.branchId === b.id && s.paymentStatus === "paid");
      return {
        branchId: b.id,
        branchName: b.name,
        salesToday: bp.filter((s) => s.createdAt.slice(0, 10) === today).reduce((a, s) => a + s.total, 0),
        salesMonth: bp.reduce((a, s) => a + s.total, 0),
      };
    });

    const byZone = ZONES.map((zona) => ({
      zona,
      label: ZONE_LABELS[zona],
      total: paid.filter((s) => s.createdAt.slice(0, 7) === monthKey && s.customer.zona === zona).reduce((a, s) => a + s.total, 0),
    })).filter((z) => z.total > 0);

    return delay({
      salesToday,
      salesMonth,
      avgTicket,
      paidUnfulfilled,
      upcomingExpenses,
      lowStock,
      salesByDay,
      byBranch,
      byZone,
    });
  });
}

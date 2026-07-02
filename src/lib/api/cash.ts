import type { CashMovement, CashSession } from "@/lib/api/types";
import { delay, request } from "@/lib/api/client";
import { cashMovements, cashSessions } from "@/mocks/data";

export function getCash(branch?: string): Promise<{ session: CashSession | null; movements: CashMovement[] }> {
  return request(`/cash?branch=${branch ?? ""}`, {}, () => {
    const session =
      cashSessions.find((s) => (branch && branch !== "all" ? s.branchId === branch : true) && s.status === "open") ??
      null;
    const movements = session ? cashMovements.filter((m) => m.sessionId === session.id) : [];
    return delay({ session, movements });
  });
}

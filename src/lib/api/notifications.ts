import type { Notification } from "@/lib/api/types";
import { delay, request } from "@/lib/api/client";
import { notifications } from "@/mocks/data";

export function getNotifications(branch?: string): Promise<Notification[]> {
  return request<Notification[]>(`/notifications?branch=${branch ?? ""}`, {}, () => {
    let list = [...notifications];
    if (branch && branch !== "all") list = list.filter((n) => !n.branchId || n.branchId === branch);
    list.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    return delay(list);
  });
}

export function markNotificationRead(id: string): Promise<{ ok: true }> {
  return request<{ ok: true }>(`/notifications/${id}/read`, { method: "PUT" }, () => {
    const n = notifications.find((x) => x.id === id);
    if (n) n.read = true;
    return delay({ ok: true as const });
  });
}

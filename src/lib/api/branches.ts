import type { Branch } from "@/lib/api/types";
import { delay, request } from "@/lib/api/client";
import { branches } from "@/mocks/data";

export function getBranches(): Promise<Branch[]> {
  return request<Branch[]>("/branches", {}, () => delay([...branches]));
}

export function saveBranch(branch: Branch): Promise<Branch> {
  return request<Branch>(
    branch.id ? `/branches/${branch.id}` : "/branches",
    { method: branch.id ? "PUT" : "POST", body: branch },
    () => {
      if (branch.id) {
        const i = branches.findIndex((b) => b.id === branch.id);
        if (i >= 0) branches[i] = branch;
      } else {
        branch.id = `b${branches.length + 1}`;
        branches.push(branch);
      }
      return delay(branch);
    },
  );
}

export function deleteBranch(id: string): Promise<{ ok: true }> {
  return request<{ ok: true }>(`/branches/${id}`, { method: "DELETE" }, () => {
    const i = branches.findIndex((b) => b.id === id);
    if (i >= 0) branches.splice(i, 1);
    return delay({ ok: true as const });
  });
}

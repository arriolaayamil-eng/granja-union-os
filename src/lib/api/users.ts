import type { User } from "@/lib/api/types";
import { delay, request } from "@/lib/api/client";
import { users } from "@/mocks/data";

export function getUsers(): Promise<User[]> {
  return request<User[]>("/users", {}, () => delay([...users]));
}

export function saveUser(user: User): Promise<User> {
  return request<User>(
    user.id ? `/users/${user.id}` : "/users",
    { method: user.id ? "PUT" : "POST", body: user },
    () => {
      if (user.id) {
        const i = users.findIndex((u) => u.id === user.id);
        if (i >= 0) users[i] = user;
      } else {
        user.id = `u${users.length + 1}`;
        users.push(user);
      }
      return delay(user);
    },
  );
}

export function deleteUser(id: string): Promise<{ ok: true }> {
  return request<{ ok: true }>(`/users/${id}`, { method: "DELETE" }, () => {
    const i = users.findIndex((u) => u.id === id);
    if (i >= 0) users.splice(i, 1);
    return delay({ ok: true as const });
  });
}

export function resetPassword(id: string): Promise<{ ok: true }> {
  return request<{ ok: true }>(`/users/${id}/reset-password`, { method: "POST" }, () =>
    delay({ ok: true as const }),
  );
}

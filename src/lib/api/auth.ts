import type { AuthResponse, User } from "@/lib/api/types";
import { delay, request } from "@/lib/api/client";
import { users } from "@/mocks/data";
import { getStoredUser } from "@/lib/auth-store";

export function loginRequest(email: string, password: string): Promise<AuthResponse> {
  return request<AuthResponse>(
    "/auth/login",
    { method: "POST", body: { email, password }, auth: false },
    () => {
      const user =
        users.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? users[0];
      return delay({ token: `mock-token-${user.id}-${Date.now()}`, user });
    },
  );
}

export function me(): Promise<User | null> {
  return request<User | null>("/me", {}, () => delay(getStoredUser()));
}

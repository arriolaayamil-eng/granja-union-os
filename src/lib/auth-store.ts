import { useEffect, useState } from "react";
import type { User } from "@/lib/api/types";
import { clearToken, getToken, setToken } from "@/lib/api/client";

const USER_KEY = "granja-admin-user";
const BRANCH_KEY = "granja-admin-active-branch"; // selección del general: "all" | branchId

type Listener = () => void;
const listeners = new Set<Listener>();
const emit = () => listeners.forEach((l) => l());

export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function login(token: string, user: User) {
  setToken(token);
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  window.localStorage.setItem(BRANCH_KEY, user.branchId ?? "all");
  emit();
}

export function logout() {
  clearToken();
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(USER_KEY);
    window.localStorage.removeItem(BRANCH_KEY);
  }
  emit();
}

export function isAuthenticated(): boolean {
  return !!getToken() && !!getStoredUser();
}

// Sucursal activa: para el general puede ser "all"; para branch_admin es su branchId.
export function getActiveBranch(): string {
  const user = getStoredUser();
  if (user?.role === "branch_admin") return user.branchId ?? "all";
  if (typeof window === "undefined") return "all";
  return window.localStorage.getItem(BRANCH_KEY) ?? "all";
}

export function setActiveBranch(branchId: string) {
  if (typeof window !== "undefined") window.localStorage.setItem(BRANCH_KEY, branchId);
  emit();
}

export function useAuth() {
  // Iniciar en null/"all" para que el primer render del cliente coincida con el SSR
  // (localStorage no existe en el server). Se hidrata en el effect → evita el
  // hydration mismatch (React #418).
  const [user, setUser] = useState<User | null>(null);
  const [activeBranch, setActiveBranchState] = useState<string>("all");

  useEffect(() => {
    setUser(getStoredUser());
    setActiveBranchState(getActiveBranch());
    const listener = () => {
      setUser(getStoredUser());
      setActiveBranchState(getActiveBranch());
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return {
    user,
    activeBranch,
    isAuthenticated: !!user,
    isGeneral: user?.role === "general",
    setActiveBranch,
    logout,
  };
}

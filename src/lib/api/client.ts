// Cliente HTTP cableado con fallback a mocks.
// Si VITE_API_BASE_URL está vacío o el fetch falla → se usa el fallback (mocks).
// Cambiar a la API real = setear VITE_API_BASE_URL y las funciones de src/lib/api/*
// dejan de caer al fallback.

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
export const TOKEN_KEY = "granja-admin-token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  if (typeof window !== "undefined") window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  if (typeof window !== "undefined") window.localStorage.removeItem(TOKEN_KEY);
}

export const API_ENABLED = BASE_URL.trim().length > 0;

type Options = {
  method?: string;
  body?: unknown;
  auth?: boolean;
};

/**
 * request<T>(path, options, fallback)
 * - Si no hay BASE_URL configurada → devuelve el fallback (modo mock).
 * - Si el fetch falla → devuelve el fallback (el mockup sigue funcionando).
 * - 401 → borra token y redirige a login.
 */
export async function request<T>(
  path: string,
  options: Options,
  fallback: () => T | Promise<T>,
): Promise<T> {
  if (!API_ENABLED) {
    return await fallback();
  }

  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (options.auth !== false) {
      const token = getToken();
      if (token) headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${BASE_URL}${path}`, {
      method: options.method ?? "GET",
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });

    if (res.status === 401) {
      clearToken();
      if (typeof window !== "undefined") window.location.assign("/admin/login");
      throw new Error("No autorizado");
    }

    if (!res.ok) throw new Error(`Error ${res.status}`);
    return (await res.json()) as T;
  } catch {
    // Fallback a mocks ante cualquier fallo de red.
    return await fallback();
  }
}

// Simula latencia para que skeletons/estados se vean en el mockup.
export function delay<T>(value: T, ms = 220): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

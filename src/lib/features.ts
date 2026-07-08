import { redirect } from "@tanstack/react-router";

export type FeatureLevel = "core" | "full";

/**
 * "core"  -> demo mode: solo Dashboard, Pedidos, Catálogo, Clientes y Configuración visibles; el resto queda oculto y bloqueado.
 * "full"  -> todos los módulos habilitados (comportamiento normal).
 */
export const FEATURES: FeatureLevel = "core";

export function isCoreMode() {
  return FEATURES === "core";
}

/** Usar en `beforeLoad` de las rutas ocultas en modo "core" para redirigir al Dashboard. */
export function coreGuard() {
  if (isCoreMode()) {
    throw redirect({ to: "/admin" });
  }
}

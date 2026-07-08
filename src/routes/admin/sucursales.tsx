import { createFileRoute } from "@tanstack/react-router";
import { SucursalesPage } from "@/features/admin/pages/SucursalesPage";
import { coreGuard } from "@/lib/features";

export const Route = createFileRoute("/admin/sucursales")({ beforeLoad: coreGuard, component: SucursalesPage });

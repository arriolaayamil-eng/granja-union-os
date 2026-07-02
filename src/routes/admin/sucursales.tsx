import { createFileRoute } from "@tanstack/react-router";
import { SucursalesPage } from "@/features/admin/pages/SucursalesPage";

export const Route = createFileRoute("/admin/sucursales")({ component: SucursalesPage });

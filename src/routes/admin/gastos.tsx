import { createFileRoute } from "@tanstack/react-router";
import { GastosPage } from "@/features/admin/pages/GastosPage";
import { coreGuard } from "@/lib/features";

export const Route = createFileRoute("/admin/gastos")({ beforeLoad: coreGuard, component: GastosPage });

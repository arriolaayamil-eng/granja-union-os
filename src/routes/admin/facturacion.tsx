import { createFileRoute } from "@tanstack/react-router";
import { FacturacionPage } from "@/features/admin/pages/FacturacionPage";
import { coreGuard } from "@/lib/features";

export const Route = createFileRoute("/admin/facturacion")({ beforeLoad: coreGuard, component: FacturacionPage });

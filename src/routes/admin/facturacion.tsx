import { createFileRoute } from "@tanstack/react-router";
import { FacturacionPage } from "@/features/admin/pages/FacturacionPage";

export const Route = createFileRoute("/admin/facturacion")({ component: FacturacionPage });

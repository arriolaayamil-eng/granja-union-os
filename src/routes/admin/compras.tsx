import { createFileRoute } from "@tanstack/react-router";
import { ComprasPage } from "@/features/admin/pages/ComprasPage";
import { coreGuard } from "@/lib/features";

export const Route = createFileRoute("/admin/compras")({ beforeLoad: coreGuard, component: ComprasPage });

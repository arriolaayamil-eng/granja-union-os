import { createFileRoute } from "@tanstack/react-router";
import { CajaPage } from "@/features/admin/pages/CajaPage";
import { coreGuard } from "@/lib/features";

export const Route = createFileRoute("/admin/caja")({ beforeLoad: coreGuard, component: CajaPage });

import { createFileRoute } from "@tanstack/react-router";
import { ReportesPage } from "@/features/admin/pages/ReportesPage";
import { coreGuard } from "@/lib/features";

export const Route = createFileRoute("/admin/reportes")({ beforeLoad: coreGuard, component: ReportesPage });

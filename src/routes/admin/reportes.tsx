import { createFileRoute } from "@tanstack/react-router";
import { ReportesPage } from "@/features/admin/pages/ReportesPage";

export const Route = createFileRoute("/admin/reportes")({ component: ReportesPage });

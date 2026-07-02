import { createFileRoute } from "@tanstack/react-router";
import { GastosPage } from "@/features/admin/pages/GastosPage";

export const Route = createFileRoute("/admin/gastos")({ component: GastosPage });

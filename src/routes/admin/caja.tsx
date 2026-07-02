import { createFileRoute } from "@tanstack/react-router";
import { CajaPage } from "@/features/admin/pages/CajaPage";

export const Route = createFileRoute("/admin/caja")({ component: CajaPage });

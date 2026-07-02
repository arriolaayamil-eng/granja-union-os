import { createFileRoute } from "@tanstack/react-router";
import { VentasPage } from "@/features/admin/pages/VentasPage";

export const Route = createFileRoute("/admin/ventas")({ component: VentasPage });

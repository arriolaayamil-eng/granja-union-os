import { createFileRoute } from "@tanstack/react-router";
import { PedidosPage } from "@/features/admin/pages/PedidosPage";

export const Route = createFileRoute("/admin/ventas")({ component: PedidosPage });

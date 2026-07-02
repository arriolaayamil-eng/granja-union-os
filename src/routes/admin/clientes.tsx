import { createFileRoute } from "@tanstack/react-router";
import { ClientesPage } from "@/features/admin/pages/ClientesPage";

export const Route = createFileRoute("/admin/clientes")({ component: ClientesPage });

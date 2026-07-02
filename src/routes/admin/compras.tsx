import { createFileRoute } from "@tanstack/react-router";
import { ComprasPage } from "@/features/admin/pages/ComprasPage";

export const Route = createFileRoute("/admin/compras")({ component: ComprasPage });

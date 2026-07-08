import { createFileRoute } from "@tanstack/react-router";
import { StockPage } from "@/features/admin/pages/StockPage";
import { coreGuard } from "@/lib/features";

export const Route = createFileRoute("/admin/stock")({ beforeLoad: coreGuard, component: StockPage });

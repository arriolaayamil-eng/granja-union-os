import { createFileRoute } from "@tanstack/react-router";
import { StockPage } from "@/features/admin/pages/StockPage";

export const Route = createFileRoute("/admin/stock")({ component: StockPage });

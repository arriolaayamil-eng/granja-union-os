import { createFileRoute } from "@tanstack/react-router";
import { ConfigPage } from "@/features/admin/pages/ConfigPage";

export const Route = createFileRoute("/admin/config")({ component: ConfigPage });

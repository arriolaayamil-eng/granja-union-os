import { createFileRoute } from "@tanstack/react-router";
import { CatalogoPage } from "@/features/admin/pages/CatalogoPage";

export const Route = createFileRoute("/admin/catalogo")({ component: CatalogoPage });

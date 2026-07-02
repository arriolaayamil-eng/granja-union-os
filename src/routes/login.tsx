import { createFileRoute } from "@tanstack/react-router";
import { LoginPage } from "@/features/admin/pages/LoginPage";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ name: "robots", content: "noindex,nofollow" }, { title: "Ingresar · Granja La Unión" }] }),
  component: LoginPage,
});

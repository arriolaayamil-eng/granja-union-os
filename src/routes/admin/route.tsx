import { useEffect } from "react";
import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { AdminLayout } from "@/features/admin/AdminLayout";
import { isAuthenticated } from "@/lib/auth-store";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ name: "robots", content: "noindex,nofollow" }, { title: "Panel · Granja La Unión" }] }),
  component: AdminRoute,
});

function AdminRoute() {
  const navigate = useNavigate();
  useEffect(() => {
    if (!isAuthenticated()) navigate({ to: "/login" });
  }, [navigate]);

  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );
}

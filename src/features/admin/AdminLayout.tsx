import { useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  Boxes,
  Building2,
  Calculator,
  ClipboardList,
  Clock,
  DollarSign,
  Drumstick,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Receipt,
  Settings,
  ShoppingCart,
  Truck,
  Users,
  KeyRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-store";
import { roleLabel, formatDate } from "@/lib/format";
import { getBranches } from "@/lib/api/branches";
import { getNotifications, markNotificationRead } from "@/lib/api/notifications";

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; generalOnly?: boolean };

const NAV: NavItem[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/ventas", label: "Ventas", icon: ShoppingCart },
  { to: "/admin/caja", label: "Caja", icon: DollarSign },
  { to: "/admin/catalogo", label: "Catálogo", icon: Drumstick },
  { to: "/admin/stock", label: "Stock", icon: Package },
  { to: "/admin/compras", label: "Compras / Proveedores", icon: Truck },
  { to: "/admin/gastos", label: "Gastos y Vencimientos", icon: Clock },
  { to: "/admin/facturacion", label: "Facturación", icon: Receipt },
  { to: "/admin/reportes", label: "Contabilidad / Reportes", icon: Calculator },
  { to: "/admin/clientes", label: "Clientes", icon: Users },
  { to: "/admin/sucursales", label: "Sucursales y Usuarios", icon: Building2, generalOnly: true },
  { to: "/admin/config", label: "Integraciones y Config", icon: Settings, generalOnly: true },
];

const BOTTOM_NAV: NavItem[] = [
  { to: "/admin", label: "Inicio", icon: LayoutDashboard },
  { to: "/admin/ventas", label: "Ventas", icon: ShoppingCart },
  { to: "/admin/catalogo", label: "Catálogo", icon: Drumstick },
  { to: "/admin/gastos", label: "Gastos", icon: Clock },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  const { user, isGeneral, activeBranch, setActiveBranch, logout } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);

  const items = NAV.filter((i) => !i.generalOnly || isGeneral);

  const { data: branches = [] } = useQuery({ queryKey: ["branches"], queryFn: getBranches });
  const { data: notifications = [], refetch } = useQuery({
    queryKey: ["notifications", activeBranch],
    queryFn: () => getNotifications(activeBranch),
  });
  const unread = notifications.filter((n) => !n.read).length;

  const activeBranchName =
    activeBranch === "all" ? "Todas las sucursales" : branches.find((b) => b.id === activeBranch)?.name ?? "";

  const isActive = (to: string) => (to === "/admin" ? pathname === "/admin" : pathname.startsWith(to));

  const doLogout = () => {
    logout();
    navigate({ to: "/admin/login" });
  };

  const NavList = ({ onClick }: { onClick?: () => void }) => (
    <nav className="space-y-1">
      {items.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          onClick={onClick}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
            isActive(item.to)
              ? "bg-primary text-primary-foreground"
              : "text-foreground hover:bg-muted",
          )}
        >
          <item.icon className="h-5 w-5 shrink-0" />
          <span className="truncate">{item.label}</span>
        </Link>
      ))}
    </nav>
  );

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Sidebar desktop */}
      <aside className="hidden w-64 shrink-0 border-r bg-card lg:block">
        <div className="flex h-16 items-center gap-2 border-b px-4">
          <Drumstick className="h-6 w-6 text-primary" />
          <span className="font-bold">Granja La Unión</span>
        </div>
        <div className="p-3">
          <NavList />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b bg-card/95 px-3 backdrop-blur sm:px-4">
          {/* Drawer mobile */}
          <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetHeader className="flex h-16 flex-row items-center gap-2 border-b px-4">
                <Drumstick className="h-6 w-6 text-primary" />
                <SheetTitle>Granja La Unión</SheetTitle>
              </SheetHeader>
              <div className="p-3">
                <NavList onClick={() => setDrawerOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>

          <Drumstick className="h-6 w-6 shrink-0 text-primary lg:hidden" />

          {/* Selector de sucursal (solo general) */}
          {isGeneral ? (
            <Select value={activeBranch} onValueChange={setActiveBranch}>
              <SelectTrigger className="h-9 w-[150px] sm:w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las sucursales</SelectItem>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Badge variant="secondary" className="truncate">
              {activeBranchName}
            </Badge>
          )}

          <div className="ml-auto flex items-center gap-1">
            {/* Notificaciones */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {unread > 0 && (
                    <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                      {unread}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-0">
                <div className="border-b px-4 py-3 font-semibold">Notificaciones</div>
                <div className="max-h-80 overflow-auto">
                  {notifications.length === 0 && (
                    <p className="px-4 py-6 text-center text-sm text-muted-foreground">Sin novedades</p>
                  )}
                  {notifications.map((n) => (
                    <button
                      key={n.id}
                      onClick={async () => {
                        await markNotificationRead(n.id);
                        refetch();
                      }}
                      className={cn(
                        "flex w-full flex-col items-start gap-1 border-b px-4 py-3 text-left text-sm hover:bg-muted",
                        !n.read && "bg-primary/5",
                      )}
                    >
                      <span className={cn(!n.read && "font-medium")}>{n.message}</span>
                      <span className="text-xs text-muted-foreground">{formatDate(n.createdAt)}</span>
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Menú de usuario */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {user?.name?.charAt(0) ?? "U"}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <p className="truncate">{user?.name}</p>
                  <p className="text-xs font-normal text-muted-foreground">
                    {user ? roleLabel[user.role] : ""}
                  </p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setPwOpen(true)}>
                  <KeyRound className="mr-2 h-4 w-4" /> Cambiar contraseña
                </DropdownMenuItem>
                <DropdownMenuItem onClick={doLogout}>
                  <LogOut className="mr-2 h-4 w-4" /> Salir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Badge de rol / sucursal */}
        <div className="flex flex-wrap items-center gap-2 border-b bg-muted/40 px-4 py-2 text-xs">
          <Badge variant="outline" className="gap-1">
            <ClipboardList className="h-3 w-3" /> {user ? roleLabel[user.role] : ""}
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Boxes className="h-3 w-3" /> {activeBranchName}
          </Badge>
        </div>

        <main className="min-w-0 flex-1 p-4 pb-24 sm:p-6 lg:pb-6">{children}</main>

        {/* Bottom nav mobile */}
        <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t bg-card lg:hidden">
          {BOTTOM_NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex flex-col items-center gap-1 py-2 text-[11px] font-medium",
                isActive(item.to) ? "text-primary" : "text-muted-foreground",
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Modal cambiar contraseña (UI-only) */}
      <Dialog open={pwOpen} onOpenChange={setPwOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar contraseña</DialogTitle>
            <DialogDescription>Ingresá tu contraseña actual y la nueva.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Contraseña actual</Label>
              <Input type="password" />
            </div>
            <div className="space-y-1">
              <Label>Nueva contraseña</Label>
              <Input type="password" />
            </div>
            <div className="space-y-1">
              <Label>Repetir nueva contraseña</Label>
              <Input type="password" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPwOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                setPwOpen(false);
                toast.success("Contraseña actualizada");
              }}
            >
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

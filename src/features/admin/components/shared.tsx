import type { ReactNode } from "react";
import { AlertTriangle, Clock, Inbox, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { SaleStatus } from "@/lib/api/types";

// ── Badge de estado de venta ──
const saleStatusMap: Record<SaleStatus, { label: string; className: string }> = {
  pending_payment: { label: "🟡 Esperando pago", className: "bg-amber-100 text-amber-800 border-amber-200" },
  paid: { label: "🟢 Pagado", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  fulfilled: { label: "🔵 Entregado", className: "bg-sky-100 text-sky-800 border-sky-200" },
  rejected: { label: "❌ Rechazado", className: "bg-red-100 text-red-800 border-red-200" },
  cancelled: { label: "Cancelado", className: "bg-muted text-muted-foreground" },
};

export function StatusBadge({ status }: { status: SaleStatus }) {
  const s = saleStatusMap[status];
  return <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium", s.className)}>{s.label}</span>;
}

// ── Badge de fase (Próximamente) ──
export function PhaseBadge({ label = "Se activa por fase" }: { label?: string }) {
  return (
    <Badge variant="outline" className="border-dashed text-muted-foreground">
      <Clock className="mr-1 h-3 w-3" /> {label}
    </Badge>
  );
}

// ── Encabezado de página ──
export function PageHeader({
  title,
  subtitle,
  phase,
  actions,
}: {
  title: string;
  subtitle?: string;
  phase?: boolean;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-5 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="truncate text-xl font-bold sm:text-2xl">{title}</h1>
          {phase && <PhaseBadge label="Próximamente" />}
        </div>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

// ── KPI ──
export function KpiCard({
  label,
  value,
  hint,
  icon,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  tone?: "default" | "warn" | "danger" | "good";
}) {
  const toneCls = {
    default: "",
    warn: "text-amber-600",
    danger: "text-red-600",
    good: "text-emerald-600",
  }[tone];
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          {icon && <span className="text-muted-foreground">{icon}</span>}
        </div>
        <p className={cn("mt-2 text-2xl font-bold tabular-nums", toneCls)}>{value}</p>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

// ── Estados de lista ──
export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
      ))}
    </div>
  );
}

export function EmptyState({ message = "No hay datos todavía", icon }: { message?: string; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
      <div className="mb-3 text-muted-foreground">{icon ?? <Inbox className="h-8 w-8" />}</div>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

export function ErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-destructive/40 py-12 text-center">
      <AlertTriangle className="mb-3 h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">No se pudieron cargar los datos.</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>
          Reintentar
        </Button>
      )}
    </div>
  );
}

export function Loading() {
  return (
    <div className="flex items-center justify-center py-16 text-muted-foreground">
      <Loader2 className="h-6 w-6 animate-spin" />
    </div>
  );
}

// ── Placeholder de imagen decorativa (no se generan imágenes) ──
export function ImgSlot({
  "data-img-ref": ref,
  alt,
  className,
}: {
  "data-img-ref": string;
  alt: string;
  className?: string;
}) {
  return (
    <div
      data-img-ref={ref}
      role="img"
      aria-label={alt}
      className={cn("flex items-center justify-center rounded-lg bg-muted text-[10px] text-muted-foreground", className)}
    >
      {ref}
    </div>
  );
}

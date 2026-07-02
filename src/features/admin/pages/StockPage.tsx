import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { EmptyState, Loading, PageHeader, PhaseBadge } from "@/features/admin/components/shared";
import { getStock, getStockAlerts } from "@/lib/api/stock";
import { getProducts } from "@/lib/api/products";
import { getBranches } from "@/lib/api/branches";
import { useAuth } from "@/lib/auth-store";

export function StockPage() {
  const { activeBranch, isGeneral } = useAuth();
  const { data: stock, isLoading } = useQuery({ queryKey: ["stock", activeBranch], queryFn: () => getStock(activeBranch) });
  const { data: alerts = [] } = useQuery({ queryKey: ["stock-alerts", activeBranch], queryFn: () => getStockAlerts(activeBranch) });
  const { data: products = [] } = useQuery({ queryKey: ["products"], queryFn: getProducts });
  const { data: branches = [] } = useQuery({ queryKey: ["branches"], queryFn: getBranches });

  const pName = (id: string) => products.find((p) => p.id === id)?.name ?? id;
  const bName = (id: string) => branches.find((b) => b.id === id)?.name ?? id;

  if (isLoading) return <Loading />;

  return (
    <div>
      <PageHeader
        title="Stock"
        phase
        subtitle="Existencias por producto y sucursal"
        actions={<MovementDialog products={products} />}
      />

      {alerts.length > 0 && (
        <Card className="mb-4 border-amber-300 bg-amber-50">
          <CardHeader><CardTitle className="flex items-center gap-2 text-base text-amber-800"><AlertTriangle className="h-4 w-4" /> Alertas de stock bajo</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {alerts.map((a) => (
              <Badge key={`${a.branchId}-${a.productId}`} variant="outline" className="border-amber-400 text-amber-800">
                {pName(a.productId)} {isGeneral && `(${bName(a.branchId)})`} · {a.stock}
              </Badge>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
        <PhaseBadge label="Se activa por fase" /> Datos de demostración.
      </div>

      {!stock || stock.length === 0 ? (
        <EmptyState message="Sin stock cargado" />
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {stock.map((s) => {
            const low = s.stock <= s.minStock;
            return (
              <Card key={`${s.branchId}-${s.productId}`}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium">{pName(s.productId)}</p>
                    <p className="text-xs text-muted-foreground">{isGeneral && bName(s.branchId) + " · "}mín. {s.minStock}</p>
                  </div>
                  <span className={`text-xl font-bold tabular-nums ${low ? "text-amber-600" : ""}`}>{s.stock}</span>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MovementDialog({ products }: { products: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("in");
  const [product, setProduct] = useState("");
  const [qty, setQty] = useState("");
  const [reason, setReason] = useState("");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button>Registrar movimiento</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Movimiento de stock</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Tipo</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="in">Ingreso</SelectItem>
                <SelectItem value="out">Egreso</SelectItem>
                <SelectItem value="adjustment">Ajuste</SelectItem>
                <SelectItem value="waste">Merma</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Producto</Label>
            <Select value={product} onValueChange={setProduct}>
              <SelectTrigger><SelectValue placeholder="Elegí producto" /></SelectTrigger>
              <SelectContent>{products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Cantidad</Label>
            <Input type="number" value={qty} onChange={(e) => setQty(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Motivo</Label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button disabled={!product || !qty} onClick={() => { setOpen(false); toast.success("Movimiento registrado"); }}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { EmptyState, ErrorState, ListSkeleton, PageHeader } from "@/features/admin/components/shared";
import { ImageUpload } from "@/features/admin/components/ImageUpload";
import { getProducts, getBranchProducts, saveProduct, saveBranchOverride } from "@/lib/api/products";
import { getBranches } from "@/lib/api/branches";
import { formatCurrency } from "@/lib/format";
import { useAuth } from "@/lib/auth-store";
import type { Product, ProductCategory, ProductUnit } from "@/lib/api/types";

const CATEGORIES: ProductCategory[] = ["Cortes", "Preparados", "Otros", "Ofertas"];
const UNITS: ProductUnit[] = ["kg", "unidad", "docena"];

const emptyProduct = (): Product => ({
  id: "",
  name: "",
  description: "",
  category: "Cortes",
  unit: "kg",
  basePrice: 0,
  cost: 0,
  taxRate: 21,
  image: "",
  active: true,
});

export function CatalogoPage() {
  const { activeBranch, isGeneral, user } = useAuth();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Product | null>(null);
  const [overrideBranch, setOverrideBranch] = useState(isGeneral ? "b1" : user?.branchId ?? "b1");

  const { data: products, isLoading, isError, refetch } = useQuery({ queryKey: ["products"], queryFn: getProducts });
  const { data: overrides = [] } = useQuery({ queryKey: ["branch-products"], queryFn: getBranchProducts });
  const { data: branches = [] } = useQuery({ queryKey: ["branches"], queryFn: getBranches });

  const scopeBranch = isGeneral ? overrideBranch : user?.branchId ?? "b1";

  const save = useMutation({
    mutationFn: saveProduct,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Producto guardado");
      setEditing(null);
    },
  });

  const toggleAvail = useMutation({
    mutationFn: (p: Product) => {
      const ov = overrides.find((o) => o.branchId === scopeBranch && o.productId === p.id);
      return saveBranchOverride({
        branchId: scopeBranch,
        productId: p.id,
        price: ov?.price ?? null,
        active: !(ov?.active ?? p.active),
        stock: ov?.stock ?? 0,
        minStock: ov?.minStock ?? 10,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["branch-products"] });
      toast.success("Disponibilidad actualizada");
    },
  });

  return (
    <div>
      <PageHeader
        title="Catálogo"
        subtitle="Productos, precios y disponibilidad por sucursal"
        actions={
          <Button onClick={() => setEditing(emptyProduct())}>
            <Plus className="mr-1 h-4 w-4" /> Nuevo
          </Button>
        }
      />

      <div className="mb-4 flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Disponibilidad de:</span>
        {isGeneral ? (
          <Select value={overrideBranch} onValueChange={setOverrideBranch}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
            </SelectContent>
          </Select>
        ) : (
          <Badge variant="secondary">{branches.find((b) => b.id === scopeBranch)?.name}</Badge>
        )}
      </div>

      {isLoading && <ListSkeleton />}
      {isError && <ErrorState onRetry={refetch} />}
      {products && products.length === 0 && <EmptyState message="No hay productos" />}

      {products && products.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => {
            const ov = overrides.find((o) => o.branchId === scopeBranch && o.productId === p.id);
            const price = ov?.price ?? p.basePrice;
            const available = ov?.active ?? p.active;
            return (
              <Card key={p.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.category} · por {p.unit}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setEditing(p)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="mt-3 flex items-end justify-between">
                    <div>
                      {p.basePrice > 0 ? (
                        <p className="text-lg font-bold tabular-nums">{formatCurrency(price)}</p>
                      ) : (
                        <Badge variant="outline" className="text-amber-600">sin precio — no se vende online</Badge>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t pt-3">
                    <span className={`text-sm font-medium ${available ? "text-emerald-600" : "text-muted-foreground"}`}>
                      {available ? "Disponible" : "Agotado"}
                    </span>
                    <Switch checked={available} onCheckedChange={() => toggleAvail.mutate(p)} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Editor */}
      <Sheet open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <SheetContent className="w-full overflow-auto sm:max-w-md">
          {editing && (
            <ProductForm
              product={editing}
              onCancel={() => setEditing(null)}
              onSave={(p) => save.mutate(p)}
              saving={save.isPending}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function ProductForm({
  product,
  onSave,
  onCancel,
  saving,
}: {
  product: Product;
  onSave: (p: Product) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<Product>(product);
  const set = (patch: Partial<Product>) => setForm((f) => ({ ...f, ...patch }));

  return (
    <>
      <SheetHeader>
        <SheetTitle>{product.id ? "Editar producto" : "Nuevo producto"}</SheetTitle>
      </SheetHeader>
      <div className="mt-4 space-y-4">
        <ImageUpload value={form.image} onChange={(url) => set({ image: url })} />
        <div className="space-y-1">
          <Label>Nombre</Label>
          <Input value={form.name} onChange={(e) => set({ name: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label>Descripción</Label>
          <Textarea value={form.description} onChange={(e) => set({ description: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label>Categoría</Label>
            <Select value={form.category} onValueChange={(v) => set({ category: v as ProductCategory })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Unidad</Label>
            <Select value={form.unit} onValueChange={(v) => set({ unit: v as ProductUnit })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Precio base</Label>
            <Input type="number" value={form.basePrice} onChange={(e) => set({ basePrice: +e.target.value })} />
          </div>
        </div>
        <div className="flex items-center justify-between rounded-lg border p-3">
          <Label>{form.active ? "Disponible" : "Agotado"}</Label>
          <Switch checked={form.active} onCheckedChange={(v) => set({ active: v })} />
        </div>
      </div>
      <SheetFooter className="mt-4">
        <Button variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button disabled={saving || !form.name} onClick={() => onSave(form)}>Guardar</Button>
      </SheetFooter>
    </>
  );
}

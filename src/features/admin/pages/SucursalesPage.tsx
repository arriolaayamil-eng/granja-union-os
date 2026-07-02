import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyRound, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { EmptyState, Loading, PageHeader } from "@/features/admin/components/shared";
import { getBranches, saveBranch } from "@/lib/api/branches";
import { getUsers, saveUser, resetPassword } from "@/lib/api/users";
import { roleLabel } from "@/lib/format";
import type { Branch, Role, User } from "@/lib/api/types";

const emptyBranch = (): Branch => ({ id: "", name: "", address: "", mapsUrl: "", phone: "", hours: "", puntoVentaAfip: 1, active: true });
const emptyUser = (): User => ({ id: "", name: "", email: "", role: "branch_admin", branchId: null, active: true });

export function SucursalesPage() {
  const qc = useQueryClient();
  const [editBranch, setEditBranch] = useState<Branch | null>(null);
  const [editUser, setEditUser] = useState<User | null>(null);

  const { data: branches, isLoading } = useQuery({ queryKey: ["branches"], queryFn: getBranches });
  const { data: users = [] } = useQuery({ queryKey: ["users"], queryFn: getUsers });

  const sBranch = useMutation({ mutationFn: saveBranch, onSuccess: () => { qc.invalidateQueries({ queryKey: ["branches"] }); toast.success("Sucursal guardada"); setEditBranch(null); } });
  const sUser = useMutation({ mutationFn: saveUser, onSuccess: () => { qc.invalidateQueries({ queryKey: ["users"] }); toast.success("Usuario guardado"); setEditUser(null); } });
  const reset = useMutation({ mutationFn: resetPassword, onSuccess: () => toast.success("Contraseña reseteada, se envió por email") });

  if (isLoading) return <Loading />;
  const bName = (id: string | null) => branches?.find((b) => b.id === id)?.name ?? "—";

  return (
    <div>
      <PageHeader title="Sucursales y Usuarios" subtitle="Gestión de locales y accesos" />
      <Tabs defaultValue="branches">
        <TabsList>
          <TabsTrigger value="branches">Sucursales</TabsTrigger>
          <TabsTrigger value="users">Usuarios</TabsTrigger>
        </TabsList>

        <TabsContent value="branches" className="mt-4 space-y-2">
          <Button onClick={() => setEditBranch(emptyBranch())}><Plus className="mr-1 h-4 w-4" /> Nueva sucursal</Button>
          {(branches ?? []).map((b) => (
            <Card key={b.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="font-semibold">{b.name} {!b.active && <Badge variant="outline">inactiva</Badge>}</p>
                  <p className="text-xs text-muted-foreground">{b.address} · PV AFIP {b.puntoVentaAfip} · {b.phone}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setEditBranch(b)}><Pencil className="h-4 w-4" /></Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="users" className="mt-4 space-y-2">
          <Button onClick={() => setEditUser(emptyUser())}><Plus className="mr-1 h-4 w-4" /> Nuevo usuario</Button>
          {users.length === 0 ? <EmptyState message="Sin usuarios" /> : users.map((u) => (
            <Card key={u.id}>
              <CardContent className="flex items-center justify-between gap-2 p-4">
                <div>
                  <p className="font-semibold">{u.name} {!u.active && <Badge variant="outline">inactivo</Badge>}</p>
                  <p className="text-xs text-muted-foreground">{u.email} · {roleLabel[u.role]} · {bName(u.branchId)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => reset.mutate(u.id)} title="Resetear contraseña"><KeyRound className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => setEditUser(u)}><Pencil className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Branch form */}
      <Sheet open={!!editBranch} onOpenChange={(o) => !o && setEditBranch(null)}>
        <SheetContent className="w-full overflow-auto sm:max-w-md">
          {editBranch && <BranchForm branch={editBranch} onSave={(b) => sBranch.mutate(b)} onCancel={() => setEditBranch(null)} saving={sBranch.isPending} />}
        </SheetContent>
      </Sheet>

      {/* User form */}
      <Sheet open={!!editUser} onOpenChange={(o) => !o && setEditUser(null)}>
        <SheetContent className="w-full overflow-auto sm:max-w-md">
          {editUser && <UserForm user={editUser} branches={branches ?? []} onSave={(u) => sUser.mutate(u)} onCancel={() => setEditUser(null)} saving={sUser.isPending} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function BranchForm({ branch, onSave, onCancel, saving }: { branch: Branch; onSave: (b: Branch) => void; onCancel: () => void; saving: boolean }) {
  const [form, setForm] = useState<Branch>(branch);
  const set = (p: Partial<Branch>) => setForm((f) => ({ ...f, ...p }));
  return (
    <>
      <SheetHeader><SheetTitle>{branch.id ? "Editar sucursal" : "Nueva sucursal"}</SheetTitle></SheetHeader>
      <div className="mt-4 space-y-4">
        <div className="space-y-1"><Label>Nombre</Label><Input value={form.name} onChange={(e) => set({ name: e.target.value })} /></div>
        <div className="space-y-1"><Label>Dirección</Label><Input value={form.address} onChange={(e) => set({ address: e.target.value })} /></div>
        <div className="space-y-1"><Label>URL Maps</Label><Input value={form.mapsUrl} onChange={(e) => set({ mapsUrl: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1"><Label>Teléfono</Label><Input value={form.phone} onChange={(e) => set({ phone: e.target.value })} /></div>
          <div className="space-y-1"><Label>PV AFIP</Label><Input type="number" value={form.puntoVentaAfip} onChange={(e) => set({ puntoVentaAfip: +e.target.value })} /></div>
        </div>
        <div className="space-y-1"><Label>Horarios</Label><Input value={form.hours} onChange={(e) => set({ hours: e.target.value })} /></div>
        <div className="flex items-center justify-between rounded-lg border p-3"><Label>Activa</Label><Switch checked={form.active} onCheckedChange={(v) => set({ active: v })} /></div>
      </div>
      <SheetFooter className="mt-4"><Button variant="outline" onClick={onCancel}>Cancelar</Button><Button disabled={saving || !form.name} onClick={() => onSave(form)}>Guardar</Button></SheetFooter>
    </>
  );
}

function UserForm({ user, branches, onSave, onCancel, saving }: { user: User; branches: Branch[]; onSave: (u: User) => void; onCancel: () => void; saving: boolean }) {
  const [form, setForm] = useState<User>(user);
  const set = (p: Partial<User>) => setForm((f) => ({ ...f, ...p }));
  return (
    <>
      <SheetHeader><SheetTitle>{user.id ? "Editar usuario" : "Nuevo usuario"}</SheetTitle></SheetHeader>
      <div className="mt-4 space-y-4">
        <div className="space-y-1"><Label>Nombre</Label><Input value={form.name} onChange={(e) => set({ name: e.target.value })} /></div>
        <div className="space-y-1"><Label>Email</Label><Input value={form.email} onChange={(e) => set({ email: e.target.value })} /></div>
        <div className="space-y-1">
          <Label>Rol</Label>
          <Select value={form.role} onValueChange={(v) => set({ role: v as Role, branchId: v === "general" ? null : form.branchId })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="general">Administrador General</SelectItem>
              <SelectItem value="branch_admin">Admin de Sucursal</SelectItem>
              <SelectItem value="cashier">Cajero</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {form.role !== "general" && (
          <div className="space-y-1">
            <Label>Sucursal asignada</Label>
            <Select value={form.branchId ?? ""} onValueChange={(v) => set({ branchId: v })}>
              <SelectTrigger><SelectValue placeholder="Elegí sucursal" /></SelectTrigger>
              <SelectContent>{branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        )}
        <div className="flex items-center justify-between rounded-lg border p-3"><Label>Activo</Label><Switch checked={form.active} onCheckedChange={(v) => set({ active: v })} /></div>
      </div>
      <SheetFooter className="mt-4"><Button variant="outline" onClick={onCancel}>Cancelar</Button><Button disabled={saving || !form.name} onClick={() => onSave(form)}>Guardar</Button></SheetFooter>
    </>
  );
}

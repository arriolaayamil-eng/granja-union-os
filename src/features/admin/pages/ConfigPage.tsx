import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, CreditCard, FileText, Plug, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loading, PageHeader } from "@/features/admin/components/shared";
import {
  getPaymentConfig, savePaymentConfig,
  getFiscalConfig, saveFiscalConfig, testIntegration,
} from "@/lib/api/integrations";
import { getSettings, saveSettings, getBusiness, saveBusiness, getOffer, saveOffer } from "@/lib/api/business";
import { getExpenseCategories, saveCategory } from "@/lib/api/expenses";
import { formatDate } from "@/lib/format";
import { ZONE_LABELS, ZONES, WEEKDAYS, type FiscalConfig, type IntegrationStatus, type PaymentConfig, type Weekday } from "@/lib/api/types";

const statusMap: Record<IntegrationStatus, { label: string; cls: string }> = {
  not_configured: { label: "🔴 No configurado", cls: "bg-red-100 text-red-800" },
  test: { label: "🟡 Test", cls: "bg-amber-100 text-amber-800" },
  live: { label: "🟢 En vivo", cls: "bg-emerald-100 text-emerald-800" },
};

export function ConfigPage() {
  const { data: payment, isLoading } = useQuery({ queryKey: ["payment-config"], queryFn: getPaymentConfig });
  const { data: fiscal } = useQuery({ queryKey: ["fiscal-config"], queryFn: getFiscalConfig });

  if (isLoading || !payment || !fiscal) return <Loading />;

  return (
    <div>
      <PageHeader title="Configuración" subtitle="Horarios, zonas, contacto e integraciones del negocio" />

      <Tabs defaultValue="horarios">
        <TabsList className="flex-wrap">
          <TabsTrigger value="horarios">Horarios</TabsTrigger>
          <TabsTrigger value="shipping">Envíos</TabsTrigger>
          <TabsTrigger value="business">Negocio</TabsTrigger>
          <TabsTrigger value="banner">Banner</TabsTrigger>
          <TabsTrigger value="integrations">Integraciones</TabsTrigger>
          <TabsTrigger value="categories">Categorías</TabsTrigger>
        </TabsList>

        <TabsContent value="horarios" className="mt-4"><HorariosSection /></TabsContent>
        <TabsContent value="shipping" className="mt-4"><ShippingSection /></TabsContent>
        <TabsContent value="business" className="mt-4"><BusinessSection /></TabsContent>
        <TabsContent value="banner" className="mt-4"><BannerSection /></TabsContent>

        <TabsContent value="integrations" className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="mb-2 rounded-lg border bg-primary/5 p-3 text-sm lg:col-span-2">
            El resto del sistema ya está cableado a estas conexiones: <strong>al activarlas, empieza a operar.</strong>
          </div>
          <PaymentCard config={payment} />
          <FiscalCard config={fiscal} />
        </TabsContent>
        <TabsContent value="categories" className="mt-4"><CategoriesSection /></TabsContent>
      </Tabs>
    </div>
  );
}

function PaymentCard({ config }: { config: PaymentConfig }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<PaymentConfig>(config);
  useEffect(() => setForm(config), [config]);
  const set = (p: Partial<PaymentConfig>) => setForm((f) => ({ ...f, ...p }));
  const save = useMutation({ mutationFn: savePaymentConfig, onSuccess: () => { qc.invalidateQueries({ queryKey: ["payment-config"] }); toast.success("Mercado Pago guardado"); } });
  const test = useMutation({ mutationFn: () => testIntegration("payment"), onSuccess: (r) => { qc.invalidateQueries({ queryKey: ["payment-config"] }); r.ok ? toast.success("Conexión OK") : toast.error("Configurá las credenciales primero"); } });
  const st = statusMap[form.status];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base"><CreditCard className="h-5 w-5" /> Mercado Pago</CardTitle>
          <Badge className={st.cls}>{st.label}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">Cobros online con cuenta central. Desbloquea: pagos web, links de cobro y conciliación.</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1"><Label>Access Token</Label><Input type="password" placeholder="APP_USR-…" value={form.hasAccessToken ? "••••••••••••" : ""} onChange={(e) => set({ hasAccessToken: e.target.value.length > 0 })} /></div>
        <div className="space-y-1"><Label>Public Key</Label><Input value={form.publicKey} onChange={(e) => set({ publicKey: e.target.value })} /></div>
        <div className="space-y-1">
          <Label>Entorno</Label>
          <Select value={form.env} onValueChange={(v) => set({ env: v as PaymentConfig["env"] })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="sandbox">Sandbox</SelectItem><SelectItem value="production">Producción</SelectItem></SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between rounded-lg border p-3"><Label>Habilitado</Label><Switch checked={form.enabled} onCheckedChange={(v) => set({ enabled: v })} /></div>
        {form.lastCheckAt && <p className="text-xs text-muted-foreground flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Último chequeo: {formatDate(form.lastCheckAt)} {form.lastCheckOk ? "OK" : "falló"}</p>}
        <div className="flex gap-2">
          <Button className="flex-1" onClick={() => save.mutate(form)} disabled={save.isPending}>Guardar</Button>
          <Button variant="outline" onClick={() => test.mutate()} disabled={test.isPending}><Plug className="mr-1 h-4 w-4" /> Probar</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function FiscalCard({ config }: { config: FiscalConfig }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<FiscalConfig>(config);
  useEffect(() => setForm(config), [config]);
  const set = (p: Partial<FiscalConfig>) => setForm((f) => ({ ...f, ...p }));
  const save = useMutation({ mutationFn: saveFiscalConfig, onSuccess: () => { qc.invalidateQueries({ queryKey: ["fiscal-config"] }); toast.success("AFIP guardado"); } });
  const test = useMutation({ mutationFn: () => testIntegration("fiscal"), onSuccess: (r) => { qc.invalidateQueries({ queryKey: ["fiscal-config"] }); r.ok ? toast.success("Conexión OK") : toast.error("Cargá el certificado y datos primero"); } });
  const st = statusMap[form.status];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base"><FileText className="h-5 w-5" /> AFIP</CardTitle>
          <Badge className={st.cls}>{st.label}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">Facturación electrónica directa (WSFEv1). Desbloquea: emisión de comprobantes con CAE.</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1"><Label>CUIT</Label><Input value={form.cuit} onChange={(e) => set({ cuit: e.target.value })} /></div>
          <div className="space-y-1"><Label>Ingresos Brutos</Label><Input value={form.ingresosBrutos} onChange={(e) => set({ ingresosBrutos: e.target.value })} /></div>
        </div>
        <div className="space-y-1"><Label>Razón social</Label><Input value={form.razonSocial} onChange={(e) => set({ razonSocial: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label>Condición fiscal</Label>
            <Select value={form.condicionFiscal} onValueChange={(v) => set({ condicionFiscal: v as FiscalConfig["condicionFiscal"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="RI">Responsable Inscripto</SelectItem><SelectItem value="Monotributo">Monotributo</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="space-y-1"><Label>Inicio actividades</Label><Input type="date" value={form.inicioActividades?.slice(0, 10) ?? ""} onChange={(e) => set({ inicioActividades: e.target.value })} /></div>
        </div>
        <div className="space-y-1">
          <Label>Certificado + clave</Label>
          <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => set({ hasCert: true })}>
            <Upload className="mr-1 h-4 w-4" /> {form.hasCert ? "Certificado cargado ✓" : "Subir certificado (UI)"}
          </Button>
        </div>
        <div className="space-y-1">
          <Label>Entorno</Label>
          <Select value={form.env} onValueChange={(v) => set({ env: v as FiscalConfig["env"] })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="homologacion">Homologación</SelectItem><SelectItem value="produccion">Producción</SelectItem></SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between rounded-lg border p-3"><Label>Habilitado</Label><Switch checked={form.enabled} onCheckedChange={(v) => set({ enabled: v })} /></div>
        {form.lastCheckAt && <p className="text-xs text-muted-foreground flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Último chequeo: {formatDate(form.lastCheckAt)} {form.lastCheckOk ? "OK" : "falló"}</p>}
        <div className="flex gap-2">
          <Button className="flex-1" onClick={() => save.mutate(form)} disabled={save.isPending}>Guardar</Button>
          <Button variant="outline" onClick={() => test.mutate()} disabled={test.isPending}><Plug className="mr-1 h-4 w-4" /> Probar</Button>
        </div>
      </CardContent>
    </Card>
  );
}

const WEEKDAY_LABELS: Record<Weekday, string> = {
  lunes: "Lunes", martes: "Martes", miercoles: "Miércoles", jueves: "Jueves",
  viernes: "Viernes", sabado: "Sábado", domingo: "Domingo",
};

function HorariosSection() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["settings"], queryFn: getSettings });
  const [form, setForm] = useState(data);
  useEffect(() => setForm(data), [data]);
  const save = useMutation({ mutationFn: saveSettings, onSuccess: () => { qc.invalidateQueries({ queryKey: ["settings"] }); toast.success("Horarios guardados"); } });
  if (!form) return <Loading />;
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle className="text-base">Horarios de atención</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {WEEKDAYS.map((day) => {
            const d = form.schedule[day];
            return (
              <div key={day} className="flex items-center gap-2">
                <span className="w-24 shrink-0 text-sm">{WEEKDAY_LABELS[day]}</span>
                <Input
                  type="time"
                  className="w-28"
                  disabled={d.closed}
                  value={d.open}
                  onChange={(e) => setForm({ ...form, schedule: { ...form.schedule, [day]: { ...d, open: e.target.value } } })}
                />
                <span className="text-xs text-muted-foreground">a</span>
                <Input
                  type="time"
                  className="w-28"
                  disabled={d.closed}
                  value={d.close}
                  onChange={(e) => setForm({ ...form, schedule: { ...form.schedule, [day]: { ...d, close: e.target.value } } })}
                />
                <div className="ml-auto flex items-center gap-2">
                  <Switch checked={!d.closed} onCheckedChange={(v) => setForm({ ...form, schedule: { ...form.schedule, [day]: { ...d, closed: !v } } })} />
                  <span className="text-xs text-muted-foreground">{d.closed ? "Cerrado" : "Abierto"}</span>
                </div>
              </div>
            );
          })}
          <Button className="mt-2" onClick={() => save.mutate(form)} disabled={save.isPending}>Guardar</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Override manual</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label>Cerrado ahora</Label>
              <p className="text-xs text-muted-foreground">Para feriados o imprevistos: fuerza "cerrado" en el sitio sin importar el horario.</p>
            </div>
            <Switch checked={form.forceClosed} onCheckedChange={(v) => setForm({ ...form, forceClosed: v })} />
          </div>
          <Button variant={form.forceClosed ? "default" : "outline"} onClick={() => save.mutate(form)} disabled={save.isPending}>
            {form.forceClosed ? "Guardar (sitio forzado a cerrado)" : "Guardar"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function ShippingSection() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["settings"], queryFn: getSettings });
  const [form, setForm] = useState(data);
  useEffect(() => setForm(data), [data]);
  const save = useMutation({ mutationFn: saveSettings, onSuccess: () => { qc.invalidateQueries({ queryKey: ["settings"] }); toast.success("Envíos guardados"); } });
  if (!form) return <Loading />;
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Zonas de entrega</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {form.zones.map((z, i) => (
          <div key={z.name} className="flex items-center gap-2">
            <span className="w-40 shrink-0 text-sm font-medium">{ZONE_LABELS[z.name]}</span>
            <Input type="number" className="w-32" value={z.cost} onChange={(e) => { const zones = [...form.zones]; zones[i] = { ...z, cost: +e.target.value }; setForm({ ...form, zones }); }} />
            <div className="flex items-center gap-2">
              <Switch checked={z.active} onCheckedChange={(v) => { const zones = [...form.zones]; zones[i] = { ...z, active: v }; setForm({ ...form, zones }); }} />
              <span className="text-xs text-muted-foreground">{z.active ? "Activa" : "Inactiva"}</span>
            </div>
          </div>
        ))}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1"><Label>Pedido mínimo</Label><Input type="number" value={form.minOrder} onChange={(e) => setForm({ ...form, minOrder: +e.target.value })} /></div>
          <div className="space-y-1"><Label>Envío gratis desde</Label><Input type="number" value={form.freeShippingFrom} onChange={(e) => setForm({ ...form, freeShippingFrom: +e.target.value })} /></div>
        </div>
        <Button onClick={() => save.mutate(form)} disabled={save.isPending}>Guardar</Button>
      </CardContent>
    </Card>
  );
}

function BannerSection() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["offer"], queryFn: getOffer });
  const [form, setForm] = useState(data);
  useEffect(() => setForm(data), [data]);
  const save = useMutation({ mutationFn: saveOffer, onSuccess: () => { qc.invalidateQueries({ queryKey: ["offer"] }); toast.success("Banner guardado"); } });
  if (!form) return <Loading />;
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle className="text-base">Banner</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1"><Label>Título</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div className="space-y-1"><Label>Subtítulo</Label><Input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label>CTA</Label><Input value={form.cta} onChange={(e) => setForm({ ...form, cta: e.target.value })} /></div>
            <div className="space-y-1"><Label>Destino CTA</Label><Input value={form.ctaTarget} onChange={(e) => setForm({ ...form, ctaTarget: e.target.value })} /></div>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3"><Label>Mostrar</Label><Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} /></div>
          <Button onClick={() => save.mutate(form)} disabled={save.isPending}>Guardar</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">Vista previa</CardTitle></CardHeader>
        <CardContent>
          <div className="rounded-lg bg-primary p-6 text-center text-primary-foreground">
            <p className="text-lg font-bold">{form.title || "Título"}</p>
            <p className="text-sm opacity-90">{form.subtitle}</p>
            <Button variant="secondary" size="sm" className="mt-3">{form.cta || "Ver más"}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function BusinessSection() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["business"], queryFn: getBusiness });
  const [form, setForm] = useState(data);
  useEffect(() => setForm(data), [data]);
  const save = useMutation({ mutationFn: saveBusiness, onSuccess: () => { qc.invalidateQueries({ queryKey: ["business"] }); toast.success("Datos guardados"); } });
  if (!form) return <Loading />;
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Datos del negocio</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1"><Label>Marca</Label><Input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} /></div>
        <div className="space-y-1"><Label>Tagline</Label><Input value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1"><Label>WhatsApp</Label><Input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} /></div>
          <div className="space-y-1"><Label>Teléfono</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
        </div>
        <div className="space-y-1"><Label>Email de avisos</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
        <div className="space-y-1"><Label>Dirección</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
        <div className="space-y-1"><Label>Horarios</Label><Input value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} /></div>
        <Button onClick={() => save.mutate(form)} disabled={save.isPending}>Guardar</Button>
      </CardContent>
    </Card>
  );
}

function CategoriesSection() {
  const qc = useQueryClient();
  const { data: categories = [] } = useQuery({ queryKey: ["expense-categories"], queryFn: getExpenseCategories });
  const [name, setName] = useState("");
  const save = useMutation({ mutationFn: saveCategory, onSuccess: () => { qc.invalidateQueries({ queryKey: ["expense-categories"] }); toast.success("Categoría agregada"); setName(""); } });
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Categorías de gasto</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">{categories.map((c) => <Badge key={c.id} variant="outline">{c.name}</Badge>)}</div>
        <div className="flex gap-2">
          <Input placeholder="Nueva categoría" value={name} onChange={(e) => setName(e.target.value)} />
          <Button disabled={!name || save.isPending} onClick={() => save.mutate(name)}>Agregar</Button>
        </div>
      </CardContent>
    </Card>
  );
}

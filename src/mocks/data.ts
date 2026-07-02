import type {
  Branch,
  BranchProduct,
  Business,
  CashMovement,
  CashSession,
  Customer,
  Expense,
  ExpenseCategory,
  FiscalConfig,
  Invoice,
  Notification,
  Offer,
  PaymentConfig,
  Product,
  PurchaseOrder,
  Sale,
  Settings,
  StockMovement,
  Supplier,
  User,
} from "@/lib/api/types";

// ── Fechas relativas para que los mocks siempre luzcan "actuales" ──
const now = new Date();
const iso = (d: Date) => d.toISOString();
const daysAgo = (n: number) => iso(new Date(now.getTime() - n * 864e5));
const daysAhead = (n: number) => iso(new Date(now.getTime() + n * 864e5));
const hoursAgo = (n: number) => iso(new Date(now.getTime() - n * 36e5));

// ── Sucursales ──
export const branches: Branch[] = [
  {
    id: "b1",
    name: "Ostende",
    address: "Av. Biarritz 1234, Ostende",
    mapsUrl: "https://maps.google.com/?q=Ostende",
    phone: "+542254480001",
    hours: "Lun a Dom 8:00 a 21:00",
    puntoVentaAfip: 1,
    active: true,
  },
  {
    id: "b2",
    name: "Valeria del Mar",
    address: "Av. Mar del Plata 550, Valeria del Mar",
    mapsUrl: "https://maps.google.com/?q=Valeria+del+Mar",
    phone: "+542254480002",
    hours: "Lun a Dom 8:30 a 20:30",
    puntoVentaAfip: 2,
    active: true,
  },
  {
    id: "b3",
    name: "Pinamar",
    address: "Av. Bunge 890, Pinamar",
    mapsUrl: "https://maps.google.com/?q=Pinamar",
    phone: "+542254480003",
    hours: "Lun a Dom 8:00 a 22:00",
    puntoVentaAfip: 3,
    active: true,
  },
];

// ── Usuarios ──
export const users: User[] = [
  {
    id: "u1",
    name: "Roberto Unión",
    email: "dueno@granjalaunion.com",
    role: "general",
    branchId: null,
    active: true,
    lastLoginAt: hoursAgo(2),
  },
  {
    id: "u2",
    name: "Marta Encargada",
    email: "ostende@granjalaunion.com",
    role: "branch_admin",
    branchId: "b1",
    active: true,
    lastLoginAt: hoursAgo(5),
  },
];

// ── Productos ──
const P = (
  id: string,
  name: string,
  category: Product["category"],
  unit: Product["unit"],
  basePrice: number,
  cost: number,
  description = "",
): Product => ({
  id,
  name,
  description,
  category,
  unit,
  basePrice,
  cost,
  taxRate: 21,
  image: `/images/${id}.webp`,
  active: true,
});

export const products: Product[] = [
  P("p1", "Pollo entero", "Cortes", "kg", 3200, 2100, "Pollo fresco de granja"),
  P("p2", "Pechuga sin hueso", "Cortes", "kg", 6800, 4500),
  P("p3", "Pata muslo", "Cortes", "kg", 3900, 2600),
  P("p4", "Suprema", "Cortes", "kg", 7200, 4800),
  P("p5", "Alitas", "Cortes", "kg", 3400, 2200),
  P("p6", "Menudos", "Cortes", "kg", 2200, 1300),
  P("p7", "Hígado de pollo", "Cortes", "kg", 2600, 1500),
  P("p8", "Milanesa de pollo", "Preparados", "kg", 7500, 5000),
  P("p9", "Pollo deshuesado relleno", "Preparados", "unidad", 12500, 8500),
  P("p10", "Hamburguesas de pollo x4", "Preparados", "unidad", 4200, 2600),
  P("p11", "Nuggets caseros", "Preparados", "kg", 6900, 4400),
  P("p12", "Pollo a la parrilla listo", "Preparados", "unidad", 9800, 6500),
  P("p13", "Huevos", "Otros", "docena", 3600, 2400),
  P("p14", "Chorizo de pollo", "Otros", "kg", 5200, 3300),
  P("p15", "Salchicha de pollo", "Otros", "kg", 4800, 3000),
  P("p16", "Pan rallado", "Otros", "unidad", 1800, 1000),
  P("p17", "Combo asado x2", "Ofertas", "unidad", 15900, 10500, "Pollo + chorizos + menudos"),
  P("p18", "Promo pechuga 2kg", "Ofertas", "kg", 12500, 8600),
];

// ── Overrides por sucursal (null = hereda global) ──
export const branchProducts: BranchProduct[] = [];
for (const b of branches) {
  for (const p of products) {
    const isOstende = b.id === "b1";
    branchProducts.push({
      branchId: b.id,
      productId: p.id,
      price: p.id === "p18" && b.id === "b3" ? 11900 : null,
      active: p.id === "p9" && b.id === "b2" ? false : null,
      stock: isOstende ? Math.round(20 + Math.random() * 40) : Math.round(5 + Math.random() * 30),
      minStock: 10,
    });
  }
}
// forzar algunas alertas de stock bajo
branchProducts[2].stock = 4;
branchProducts[5].stock = 2;

// ── Clientes ──
export const customers: Customer[] = [
  {
    id: "c1",
    name: "Laura Gómez",
    phone: "+542254511111",
    email: "laura@mail.com",
    address: "Calle 12 esq. 3, Ostende",
    docTipo: "DNI",
    docNro: "28345678",
    condicionIVA: "Consumidor Final",
    notes: "Cliente frecuente",
  },
  {
    id: "c2",
    name: "Distribuidora El Faro SRL",
    phone: "+542254522222",
    email: "compras@elfaro.com",
    address: "Av. Bunge 200, Pinamar",
    docTipo: "CUIT",
    docNro: "30712345678",
    condicionIVA: "Responsable Inscripto",
  },
  {
    id: "c3",
    name: "Juan Pérez",
    phone: "+542254533333",
    email: "juanp@mail.com",
    address: "Los Pinos 45, Valeria del Mar",
    docTipo: "DNI",
    docNro: "35111222",
    condicionIVA: "Consumidor Final",
  },
  {
    id: "c4",
    name: "Parrilla Don Carlos",
    phone: "+542254544444",
    email: "doncarlos@mail.com",
    address: "Av. del Mar 900, Valeria del Mar",
    docTipo: "CUIT",
    docNro: "20223344556",
    condicionIVA: "Monotributo",
  },
];

// ── Ventas ──
const item = (p: Product, qty: number): Sale["items"][number] => ({
  productId: p.id,
  name: p.name,
  qty,
  price: p.basePrice,
  unit: p.unit,
  taxRate: p.taxRate,
});
const mkSale = (
  id: string,
  code: string,
  branchId: string,
  channel: Sale["channel"],
  items: Sale["items"],
  customer: Sale["customer"],
  paymentMethod: Sale["paymentMethod"],
  paymentStatus: Sale["paymentStatus"],
  status: Sale["status"],
  createdAt: string,
  shipping = 0,
): Sale => {
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  return {
    id,
    code,
    branchId,
    channel,
    items,
    customer,
    subtotal,
    discount: 0,
    shipping,
    total: subtotal + shipping,
    paymentMethod,
    paymentStatus,
    mp: paymentMethod === "mp" ? { preferenceId: "pref_" + id, paymentId: "pay_" + id } : {},
    status,
    createdAt,
  };
};
const cust = (nombre: string, telefono: string, direccion: string, zona: string, aclaraciones = ""): Sale["customer"] => ({
  nombre,
  telefono,
  direccion,
  zona,
  aclaraciones,
});

export const sales: Sale[] = [
  mkSale("s1", "WEB-1042", "b1", "online", [item(products[1], 2), item(products[12], 1)], cust("Laura Gómez", "+542254511111", "Calle 12 esq. 3", "Ostende centro", "Sin menudos"), "mp", "paid", "paid", hoursAgo(3), 1500),
  mkSale("s2", "WEB-1043", "b1", "online", [item(products[0], 1.5), item(products[9], 1)], cust("Juan Pérez", "+542254533333", "Los Pinos 45", "Valeria"), "mp", "pending", "pending_payment", hoursAgo(1), 1500),
  mkSale("s3", "WEB-1044", "b3", "online", [item(products[16], 1)], cust("Parrilla Don Carlos", "+542254544444", "Av. del Mar 900", "Pinamar norte"), "mp", "paid", "paid", hoursAgo(6), 0),
  mkSale("s4", "WEB-1045", "b2", "online", [item(products[3], 1)], cust("Sofía Ruiz", "+542254566666", "Calle 40 120", "Valeria"), "mp", "rejected", "rejected", hoursAgo(20)),
  mkSale("s5", "POS-3301", "b1", "pos", [item(products[2], 2.3), item(products[12], 2)], cust("Mostrador", "", "", "Mostrador"), "efectivo", "paid", "fulfilled", hoursAgo(4)),
  mkSale("s6", "POS-3302", "b3", "pos", [item(products[7], 1.2)], cust("Mostrador", "", "", "Mostrador"), "debito", "paid", "fulfilled", daysAgo(1)),
  mkSale("s7", "WEB-1041", "b1", "online", [item(products[17], 2)], cust("Laura Gómez", "+542254511111", "Calle 12 esq. 3", "Ostende centro"), "mp", "paid", "fulfilled", daysAgo(1), 1500),
  mkSale("s8", "WEB-1046", "b2", "online", [item(products[10], 1), item(products[12], 1)], cust("Marina López", "+542254577777", "Av. Mar 33", "Valeria centro", "Tocar timbre 2"), "mp", "paid", "paid", hoursAgo(2), 1200),
];

// ── Caja ──
export const cashSessions: CashSession[] = [
  {
    id: "cs1",
    branchId: "b1",
    openedBy: "Marta Encargada",
    openedAt: hoursAgo(8),
    openingAmount: 20000,
    status: "open",
  },
];
export const cashMovements: CashMovement[] = [
  { id: "cm1", sessionId: "cs1", branchId: "b1", type: "sale", method: "efectivo", amount: 18450, reference: "POS-3301", at: hoursAgo(4) },
  { id: "cm2", sessionId: "cs1", branchId: "b1", type: "expense", method: "efectivo", amount: 5000, note: "Hielo", at: hoursAgo(3) },
  { id: "cm3", sessionId: "cs1", branchId: "b1", type: "withdrawal", method: "efectivo", amount: 10000, note: "Retiro a banco", at: hoursAgo(1) },
];

// ── Proveedores y compras ──
export const suppliers: Supplier[] = [
  { id: "sup1", name: "Granja Avícola del Sur", cuit: "30-70123456-7", contact: "Diego", phone: "+542216677889", email: "ventas@avidelsur.com", balance: 145000, notes: "Entrega martes y viernes" },
  { id: "sup2", name: "Distribuidora La Costa", cuit: "30-71122334-5", contact: "Ana", phone: "+542255112233", email: "pedidos@lacosta.com", balance: 0 },
  { id: "sup3", name: "Huevos San José", cuit: "20-22334455-6", contact: "José", phone: "+542254998877", email: "sanjose@mail.com", balance: 32000 },
];
export const purchaseOrders: PurchaseOrder[] = [
  { id: "po1", branchId: "b1", supplierId: "sup1", items: [{ productId: "p1", qty: 50, cost: 2100 }, { productId: "p2", qty: 20, cost: 4500 }], total: 195000, status: "received", receivedAt: daysAgo(1), createdAt: daysAgo(2) },
  { id: "po2", branchId: "b3", supplierId: "sup2", items: [{ productId: "p8", qty: 15, cost: 5000 }], total: 75000, status: "ordered", createdAt: daysAgo(1) },
  { id: "po3", branchId: "b1", supplierId: "sup3", items: [{ productId: "p13", qty: 30, cost: 2400 }], total: 72000, status: "draft", createdAt: hoursAgo(5) },
];

// ── Stock ──
export const stockMovements: StockMovement[] = [
  { id: "sm1", branchId: "b1", productId: "p1", type: "in", qty: 50, reason: "Recepción OC po1", reference: "po1", at: daysAgo(1) },
  { id: "sm2", branchId: "b1", productId: "p3", type: "out", qty: 2.3, reason: "Venta POS-3301", reference: "POS-3301", at: hoursAgo(4) },
  { id: "sm3", branchId: "b1", productId: "p6", type: "waste", qty: 3, reason: "Merma por vencimiento", at: hoursAgo(2) },
  { id: "sm4", branchId: "b3", productId: "p8", type: "adjustment", qty: -1.5, reason: "Ajuste de inventario", at: daysAgo(1) },
];

// ── Gastos y vencimientos ──
export const expenseCategories: ExpenseCategory[] = [
  { id: "ec1", name: "Alquiler" },
  { id: "ec2", name: "Servicios" },
  { id: "ec3", name: "Proveedores" },
  { id: "ec4", name: "Impuestos" },
  { id: "ec5", name: "Sueldos" },
  { id: "ec6", name: "Otros" },
];
export const expenses: Expense[] = [
  { id: "e1", branchId: "b1", categoryId: "ec1", description: "Alquiler local Ostende", amount: 450000, dueDate: daysAhead(5), status: "pending", recurrence: "monthly" },
  { id: "e2", branchId: "b1", categoryId: "ec2", description: "Luz - EDEA", amount: 68000, dueDate: daysAhead(2), status: "pending", recurrence: "bimonthly" },
  { id: "e3", branchId: "b3", categoryId: "ec2", description: "Gas - Camuzzi", amount: 24000, dueDate: daysAgo(3), status: "overdue", recurrence: "bimonthly" },
  { id: "e4", branchId: null, categoryId: "ec4", description: "IIBB ARBA", amount: 95000, dueDate: daysAhead(9), status: "pending", recurrence: "monthly" },
  { id: "e5", branchId: "b1", categoryId: "ec3", description: "Pago Granja Avícola del Sur", supplierId: "sup1", amount: 145000, dueDate: daysAhead(1), status: "pending", recurrence: "none" },
  { id: "e6", branchId: "b2", categoryId: "ec2", description: "Agua - ABSA", amount: 18000, dueDate: daysAgo(10), paidDate: daysAgo(9), status: "paid", recurrence: "monthly" },
];

// ── Facturación ──
export const invoices: Invoice[] = [
  { id: "inv1", branchId: "b1", saleId: "s1", tipo: 6, tipoLabel: "Factura B", puntoVenta: 1, numero: 1042, cliente: { docTipo: "DNI", docNro: "28345678", condicionIVA: "Consumidor Final" }, neto: 12314, iva: 2586, total: 14900, cae: "74123456789012", caeVto: daysAhead(10), status: "authorized", createdAt: hoursAgo(3) },
  { id: "inv2", branchId: "b3", saleId: "s3", tipo: 1, tipoLabel: "Factura A", puntoVenta: 3, numero: 305, cliente: { docTipo: "CUIT", docNro: "20223344556", condicionIVA: "Monotributo" }, neto: 13140, iva: 2760, total: 15900, cae: "74123456780055", caeVto: daysAhead(9), status: "authorized", createdAt: hoursAgo(6) },
  { id: "inv3", branchId: "b1", saleId: "s7", tipo: 6, tipoLabel: "Factura B", puntoVenta: 1, numero: null, cliente: { docTipo: "CF", docNro: "0", condicionIVA: "Consumidor Final" }, neto: 26281, iva: 5519, total: 31800, cae: null, caeVto: null, status: "pending", createdAt: daysAgo(1) },
  { id: "inv4", branchId: "b2", saleId: "s8", tipo: 6, tipoLabel: "Factura B", puntoVenta: 2, numero: null, cliente: { docTipo: "CF", docNro: "0", condicionIVA: "Consumidor Final" }, neto: 9008, iva: 1892, total: 10900, cae: null, caeVto: null, status: "error", createdAt: hoursAgo(2) },
];

// ── Integraciones (sin configurar, para mostrar el flujo de activación) ──
export const paymentConfig: PaymentConfig = {
  publicKey: "",
  hasAccessToken: false,
  env: "sandbox",
  status: "not_configured",
  enabled: false,
};
export const fiscalConfig: FiscalConfig = {
  cuit: "",
  razonSocial: "Granja La Unión",
  condicionFiscal: "RI",
  ingresosBrutos: "",
  inicioActividades: "",
  hasCert: false,
  env: "homologacion",
  status: "not_configured",
  enabled: false,
};

// ── Configuración ──
export const settings: Settings = {
  zones: [
    { name: "Ostende centro", cost: 1500, active: true },
    { name: "Valeria centro", cost: 1200, active: true },
    { name: "Pinamar norte", cost: 1800, active: true },
    { name: "Pinamar sur", cost: 2200, active: true },
  ],
  freeShippingFrom: 25000,
  minOrder: 8000,
};
export const business: Business = {
  brand: "Granja La Unión",
  tagline: "Pollo fresco de granja, todos los días",
  whatsapp: "+542254480001",
  phone: "+542254480001",
  email: "avisos@granjalaunion.com",
  hours: "Lun a Dom 8:00 a 21:00",
  branches: branches.map((b) => ({ id: b.id, name: b.name, address: b.address, mapsUrl: b.mapsUrl })),
};
export const offer: Offer = {
  title: "Combo Asado del finde",
  subtitle: "Pollo + chorizos + menudos a precio promo",
  cta: "Pedir ahora",
  ctaTarget: "/menu",
  active: true,
};

// ── Notificaciones ──
export const notifications: Notification[] = [
  { id: "n1", type: "expense", message: "Vence en 1 día: Pago Granja Avícola del Sur ($145.000)", branchId: "b1", read: false, createdAt: hoursAgo(2) },
  { id: "n2", type: "stock", message: "Stock bajo: Pata muslo en Ostende (4 kg)", branchId: "b1", read: false, createdAt: hoursAgo(3) },
  { id: "n3", type: "order", message: "Nuevo pedido web WEB-1043 esperando pago", branchId: "b1", read: false, createdAt: hoursAgo(1) },
  { id: "n4", type: "expense", message: "Gasto vencido: Gas - Camuzzi (Pinamar)", branchId: "b3", read: true, createdAt: daysAgo(1) },
];

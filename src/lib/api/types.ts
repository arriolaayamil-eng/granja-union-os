// Modelo de datos EXACTO del sistema de gestión de Granja La Unión.
// El swap a la API real no debe requerir reescribir estos shapes.

export type Role = "general" | "branch_admin" | "cashier";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  branchId: string | null;
  active: boolean;
  lastLoginAt?: string;
}

export interface Branch {
  id: string;
  name: string;
  address: string;
  mapsUrl: string;
  phone: string;
  hours: string;
  puntoVentaAfip: number;
  active: boolean;
}

export type ProductUnit = "kg" | "unidad" | "docena";
export type ProductCategory = "Cortes" | "Preparados" | "Otros" | "Ofertas";

export interface Product {
  id: string;
  name: string;
  description?: string;
  category: ProductCategory;
  unit: ProductUnit;
  basePrice: number;
  cost: number;
  taxRate: number;
  image: string;
  active: boolean;
}

export interface BranchProduct {
  branchId: string;
  productId: string;
  price: number | null;
  active: boolean | null;
  stock: number;
  minStock: number;
} // null = hereda global

export type SaleChannel = "online" | "pos";
export type PaymentMethod = "mp" | "efectivo" | "transferencia" | "debito";
export type SaleStatus =
  | "pending_payment"
  | "paid"
  | "fulfilled"
  | "cancelled"
  | "rejected";

export interface SaleItem {
  productId: string;
  name: string;
  qty: number;
  price: number;
  unit: string;
  taxRate: number;
}

export interface Sale {
  id: string;
  code: string;
  branchId: string;
  channel: SaleChannel;
  items: SaleItem[];
  customerId?: string;
  customer: {
    nombre: string;
    telefono: string;
    direccion: string;
    zona: string;
    aclaraciones: string;
  };
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: "pending" | "paid" | "rejected";
  mp: { preferenceId?: string; paymentId?: string };
  invoiceId?: string;
  status: SaleStatus;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  docTipo: "DNI" | "CUIT" | "CF";
  docNro: string;
  condicionIVA: string;
  notes?: string;
}

export interface CashSession {
  id: string;
  branchId: string;
  openedBy: string;
  openedAt: string;
  openingAmount: number;
  closedAt?: string;
  countedAmount?: number;
  expectedAmount?: number;
  difference?: number;
  status: "open" | "closed";
}

export interface CashMovement {
  id: string;
  sessionId: string;
  branchId: string;
  type: "sale" | "expense" | "withdrawal" | "deposit";
  method: PaymentMethod;
  amount: number;
  reference?: string;
  note?: string;
  at: string;
}

export interface Supplier {
  id: string;
  name: string;
  cuit: string;
  contact: string;
  phone: string;
  email: string;
  balance: number;
  notes?: string;
}

export interface PurchaseOrder {
  id: string;
  branchId: string;
  supplierId: string;
  items: { productId: string; qty: number; cost: number }[];
  total: number;
  status: "draft" | "ordered" | "received";
  receivedAt?: string;
  createdAt: string;
}

export interface StockMovement {
  id: string;
  branchId: string;
  productId: string;
  type: "in" | "out" | "adjustment" | "waste";
  qty: number;
  reason: string;
  reference?: string;
  at: string;
}

export type ExpenseStatus = "pending" | "paid" | "overdue";
export type Recurrence = "none" | "weekly" | "monthly" | "bimonthly" | "yearly";

export interface ExpenseCategory {
  id: string;
  name: string;
}

export interface Expense {
  id: string;
  branchId: string | null;
  categoryId: string;
  supplierId?: string;
  description: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: ExpenseStatus;
  recurrence: Recurrence;
  attachmentUrl?: string;
}

export type InvoiceStatus = "pending" | "authorized" | "error";

export interface Invoice {
  id: string;
  branchId: string;
  saleId?: string;
  tipo: number;
  tipoLabel: string;
  puntoVenta: number;
  numero: number | null;
  cliente: { docTipo: string; docNro: string; condicionIVA: string };
  neto: number;
  iva: number;
  total: number;
  cae: string | null;
  caeVto: string | null;
  status: InvoiceStatus;
  createdAt: string;
}

export type IntegrationStatus = "not_configured" | "test" | "live";

export interface PaymentConfig {
  publicKey: string;
  hasAccessToken: boolean;
  env: "sandbox" | "production";
  status: IntegrationStatus;
  enabled: boolean;
  lastCheckAt?: string;
  lastCheckOk?: boolean;
}

export interface FiscalConfig {
  cuit: string;
  razonSocial: string;
  condicionFiscal: "RI" | "Monotributo";
  ingresosBrutos: string;
  inicioActividades: string;
  hasCert: boolean;
  env: "homologacion" | "produccion";
  status: IntegrationStatus;
  enabled: boolean;
  lastCheckAt?: string;
  lastCheckOk?: boolean;
}

export interface Zone {
  name: string;
  cost: number;
  active: boolean;
}

export interface Settings {
  zones: Zone[];
  freeShippingFrom: number;
  minOrder: number;
}

export interface Business {
  brand: string;
  tagline: string;
  whatsapp: string;
  phone: string;
  email: string;
  hours: string;
  branches: { id: string; name: string; address: string; mapsUrl: string }[];
}

export interface Offer {
  title: string;
  subtitle: string;
  cta: string;
  ctaTarget: string;
  active: boolean;
}

export interface Notification {
  id: string;
  type: string;
  message: string;
  branchId?: string;
  read: boolean;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface DashboardReport {
  salesToday: number;
  salesMonth: number;
  avgTicket: number;
  paidUnfulfilled: number;
  upcomingExpenses: number;
  lowStock: number;
  salesByDay: { date: string; total: number }[];
  byBranch: { branchId: string; branchName: string; salesToday: number; salesMonth: number }[];
}

import type { FiscalConfig, PaymentConfig } from "@/lib/api/types";
import { delay, request } from "@/lib/api/client";
import { fiscalConfig, paymentConfig } from "@/mocks/data";

export function getPaymentConfig(): Promise<PaymentConfig> {
  return request<PaymentConfig>("/integrations/payment", {}, () => delay({ ...paymentConfig }));
}

export function savePaymentConfig(cfg: PaymentConfig): Promise<PaymentConfig> {
  return request<PaymentConfig>("/integrations/payment", { method: "PUT", body: cfg }, () => {
    Object.assign(paymentConfig, cfg);
    return delay({ ...paymentConfig });
  });
}

export function getFiscalConfig(): Promise<FiscalConfig> {
  return request<FiscalConfig>("/integrations/fiscal", {}, () => delay({ ...fiscalConfig }));
}

export function saveFiscalConfig(cfg: FiscalConfig): Promise<FiscalConfig> {
  return request<FiscalConfig>("/integrations/fiscal", { method: "PUT", body: cfg }, () => {
    Object.assign(fiscalConfig, cfg);
    return delay({ ...fiscalConfig });
  });
}

export function testIntegration(name: "payment" | "fiscal"): Promise<{ ok: boolean; at: string }> {
  return request<{ ok: boolean; at: string }>(
    `/integrations/${name}/test`,
    { method: "POST" },
    () => {
      const at = new Date().toISOString();
      const cfg = name === "payment" ? paymentConfig : fiscalConfig;
      const ok = name === "payment" ? cfg.status !== "not_configured" : cfg.status !== "not_configured";
      cfg.lastCheckAt = at;
      cfg.lastCheckOk = ok;
      return delay({ ok, at });
    },
  );
}

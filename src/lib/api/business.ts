import type { Business, Offer, Settings } from "@/lib/api/types";
import { delay, request } from "@/lib/api/client";
import { business, offer, settings } from "@/mocks/data";

export function getSettings(): Promise<Settings> {
  return request<Settings>("/settings", {}, () => delay({ ...settings }));
}
export function saveSettings(s: Settings): Promise<Settings> {
  return request<Settings>("/settings", { method: "PUT", body: s }, () => {
    Object.assign(settings, s);
    return delay({ ...settings });
  });
}

export function getBusiness(): Promise<Business> {
  return request<Business>("/business", {}, () => delay({ ...business }));
}
export function saveBusiness(b: Business): Promise<Business> {
  return request<Business>("/business", { method: "PUT", body: b }, () => {
    Object.assign(business, b);
    return delay({ ...business });
  });
}

export function getOffer(): Promise<Offer> {
  return request<Offer>("/offer", {}, () => delay({ ...offer }));
}
export function saveOffer(o: Offer): Promise<Offer> {
  return request<Offer>("/offer", { method: "PUT", body: o }, () => {
    Object.assign(offer, o);
    return delay({ ...offer });
  });
}

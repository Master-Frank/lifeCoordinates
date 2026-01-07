import type { BirthInput, KLineResult, PaipanResult } from "@life-coordinates/core";

export async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || `HTTP_${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function computeAll(input: BirthInput) {
  return postJson<{ paipan: PaipanResult; kline: KLineResult }>("/api/compute", input);
}

export async function computePaipan(input: BirthInput) {
  return postJson<{ paipan: PaipanResult }>("/api/paipan", input);
}

export async function createShare(paipan: PaipanResult, kline: KLineResult) {
  return postJson<{ id: string }>("/api/share", { paipan, kline });
}

export async function getShare(id: string) {
  const res = await fetch(`/api/share/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error(`HTTP_${res.status}`);
  return res.json() as Promise<{ paipan: PaipanResult; kline: KLineResult }>;
}

export type GeoCandidate = {
  name: string;
  displayName: string;
};

export async function geoSuggest(params: { province: string; city: string }) {
  const url = new URL("/api/geo/suggest", window.location.origin);
  url.searchParams.set("province", params.province);
  url.searchParams.set("city", params.city);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`HTTP_${res.status}`);
  return res.json() as Promise<{ candidates: GeoCandidate[] }>;
}

export async function geoGeocode(params: { province: string; city: string }) {
  const url = new URL("/api/geo/geocode", window.location.origin);
  url.searchParams.set("province", params.province);
  url.searchParams.set("city", params.city);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`HTTP_${res.status}`);
  return res.json() as Promise<{
    candidate: null | { displayName: string; longitude: number; latitude: number; name: string };
  }>;
}

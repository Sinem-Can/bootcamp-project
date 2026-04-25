import { apiFetch } from "../../lib/api";

export type ProductScoreResponse = {
  status: "RED" | "YELLOW" | "GREEN";
  matched_allergens: string[];
  matched_undesired: string[];
};

export type AlternativeProduct = {
  barkod: string;
  ad: string;
  kategori: string;
  fiyat_segmenti: number;
};

export async function getProductScore(barcode: string) {
  return apiFetch<ProductScoreResponse>(`/product/${encodeURIComponent(barcode)}`);
}

export async function getAlternatives(barcode: string) {
  return apiFetch<AlternativeProduct[]>(`/product/alternatives/${encodeURIComponent(barcode)}`);
}


import { isCleaningCategory } from "./constants";
import { resolveLinePrice } from "./pricing";
import type { Product } from "./types";

export function defaultVariant(product: Product): string {
  return product.variants[0] ?? "";
}

export function imageUrlForVariant(product: Product, variant: string): string | undefined {
  const entry = product.variantImages?.find((vi) => vi.variant === variant);
  return entry?.imageUrl;
}

export function productMainImage(product: Product, variant?: string): string | undefined {
  const v = variant ?? defaultVariant(product);
  if (v) {
    const url = imageUrlForVariant(product, v);
    if (url) return url;
  }
  return product.variantImages?.[0]?.imageUrl;
}

export type VariantGalleryItem = {
  variant: string;
  imageUrl: string;
};

/** One thumbnail per product variant (order follows `product.variants`). */
export function productVariantGallery(product: Product): VariantGalleryItem[] {
  const items: VariantGalleryItem[] = [];
  for (const v of product.variants) {
    const imageUrl = imageUrlForVariant(product, v);
    if (imageUrl) {
      items.push({ variant: v, imageUrl });
    }
  }
  if (items.length === 0) {
    for (const vi of product.variantImages ?? []) {
      if (vi.imageUrl) {
        items.push({ variant: vi.variant, imageUrl: vi.imageUrl });
      }
    }
  }
  return items;
}

export function defaultSize(product: Product): string {
  if (isCleaningCategory(product.category)) return "";
  return product.sizePricings?.[0]?.size ?? "";
}

/** Lowest piece price for catalogue cards. */
export function cataloguePiecePriceKobo(product: Product): number | null {
  if (isCleaningCategory(product.category)) {
    return product.cleaningPricing?.piecePriceKobo ?? null;
  }
  const prices = (product.sizePricings ?? []).map((sp) => sp.piecePriceKobo).filter((p) => p > 0);
  if (prices.length === 0) return null;
  return Math.min(...prices);
}

export function productPriceRangeKobo(product: Product): { min: number; max: number } | null {
  const prices: number[] = [];
  if (isCleaningCategory(product.category) && product.cleaningPricing) {
    prices.push(product.cleaningPricing.piecePriceKobo, product.cleaningPricing.dozenPriceKobo);
  } else {
    for (const sp of product.sizePricings ?? []) {
      prices.push(sp.piecePriceKobo, sp.bundlePriceKobo);
    }
  }
  if (prices.length === 0) return null;
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

/** True when the product can be quick-added with defaults. */
export function canQuickAdd(product: Product): boolean {
  if (!defaultVariant(product)) return false;
  try {
    resolveLinePrice(product, defaultSize(product) || undefined, "piece");
    return true;
  } catch {
    return false;
  }
}

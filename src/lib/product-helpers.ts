import { SIZES } from "./constants";
import { unitPriceKobo } from "./pricing";
import type { Product, SizeVariant } from "./types";

/** Smallest size code present on the product (by S→XXL order). */
export function smallestSizeVariant(product: Product): SizeVariant | undefined {
  if (!product.sizes.length) return undefined;
  const rank = (code: string) => {
    const i = SIZES.indexOf(code as (typeof SIZES)[number]);
    return i === -1 ? 999 : i;
  };
  let best = product.sizes[0];
  for (const sv of product.sizes) {
    if (rank(sv.code) < rank(best.code)) best = sv;
  }
  return best;
}

export function defaultColor(product: Product): string {
  return product.colors[0] ?? "";
}

export function imageUrlForColor(product: Product, color: string): string | undefined {
  const entry = product.colorImages?.find((ci) => ci.color === color);
  return entry?.imageUrl;
}

export function catalogueUnitPriceKobo(product: Product): number | null {
  const sv = smallestSizeVariant(product);
  if (!sv) return null;
  try {
    return unitPriceKobo(sv.tiers, 1);
  } catch {
    return null;
  }
}

export function productMainImage(product: Product, color?: string): string | undefined {
  const c = color ?? defaultColor(product);
  if (c) {
    const url = imageUrlForColor(product, c);
    if (url) return url;
  }
  return product.colorImages?.[0]?.imageUrl;
}

export function galleryImagesForColor(product: Product, color: string): string[] {
  const url = imageUrlForColor(product, color);
  return url ? [url] : [];
}

export type ColorGalleryItem = {
  color: string;
  imageUrl: string;
};

/** One thumbnail per product color (order follows `product.colors`). */
export function productColorGallery(product: Product): ColorGalleryItem[] {
  const items: ColorGalleryItem[] = [];
  for (const c of product.colors) {
    const imageUrl = imageUrlForColor(product, c);
    if (imageUrl) {
      items.push({ color: c, imageUrl });
    }
  }
  if (items.length === 0) {
    for (const ci of product.colorImages ?? []) {
      if (ci.imageUrl) {
        items.push({ color: ci.color, imageUrl: ci.imageUrl });
      }
    }
  }
  return items;
}

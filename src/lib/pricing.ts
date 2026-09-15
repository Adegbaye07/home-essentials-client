import { isCleaningCategory, UNLIMITED_ORDER_QTY } from "./constants";
import type { OrderUnit, Product, SizePricing } from "./types";

export { UNLIMITED_ORDER_QTY };

export type ResolvedLinePrice = {
  unitPriceKobo: number;
  piecesPerBundle?: number;
};

/** Mirrors backend ResolveLinePrice for client-side cart totals. */
export function resolveLinePrice(
  product: Product,
  size: string | undefined,
  unit: OrderUnit,
): ResolvedLinePrice {
  if (isCleaningCategory(product.category)) {
    if (size?.trim()) {
      throw new Error("Size is not allowed for cleaning essentials");
    }
    const pricing = product.cleaningPricing;
    if (!pricing) {
      throw new Error("Product has no cleaning pricing");
    }
    if (unit === "piece") {
      return { unitPriceKobo: pricing.piecePriceKobo };
    }
    if (unit === "dozen") {
      return { unitPriceKobo: pricing.dozenPriceKobo };
    }
    throw new Error("Bundle is not available for cleaning essentials");
  }

  if (unit === "dozen") {
    throw new Error("Dozen is only available for cleaning essentials");
  }

  const trimmed = (size ?? "").trim();
  if (!trimmed) {
    throw new Error("Size is required");
  }

  const sp = sizePricingFor(product, trimmed);
  if (!sp) {
    throw new Error(`Size "${trimmed}" is not available`);
  }

  if (unit === "piece") {
    return { unitPriceKobo: sp.piecePriceKobo };
  }
  if (unit === "bundle") {
    return {
      unitPriceKobo: sp.bundlePriceKobo,
      piecesPerBundle: sp.piecesPerBundle,
    };
  }
  throw new Error(`Invalid unit "${unit}"`);
}

export function sizePricingFor(product: Product, size: string): SizePricing | undefined {
  const key = size.trim().toLowerCase();
  return (product.sizePricings ?? []).find((sp) => sp.size.trim().toLowerCase() === key);
}

export function lineTotalKobo(unitPriceKobo: number, quantity: number): number {
  return unitPriceKobo * quantity;
}

export function clampOrderQty(qty: number, max: number = UNLIMITED_ORDER_QTY): number {
  return Math.min(max, Math.max(1, Math.floor(qty)));
}

export function availableUnits(product: Product): OrderUnit[] {
  if (isCleaningCategory(product.category)) {
    return ["piece", "dozen"];
  }
  return ["piece", "bundle"];
}

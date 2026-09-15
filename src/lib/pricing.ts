import type { QtyTier } from "./types";

export const UNLIMITED_ORDER_QTY = 999;

export function tierForQty(tiers: QtyTier[], qty: number): QtyTier {
  if (qty < 1) throw new Error("Invalid quantity");
  for (const t of tiers) {
    if (qty < t.minQty) continue;
    if (t.maxQty != null && qty > t.maxQty) continue;
    return t;
  }
  throw new Error("No price tier for quantity");
}

export function unitPriceKobo(tiers: QtyTier[], qty: number): number {
  return tierForQty(tiers, qty).unitPriceKobo;
}

export function lineTotalKobo(tiers: QtyTier[], qty: number): number {
  return unitPriceKobo(tiers, qty) * qty;
}

function sortedTiers(tiers: QtyTier[]): QtyTier[] {
  return [...tiers].sort((a, b) => a.minQty - b.minQty);
}

/** Returns the hard cap when the last tier has maxQty; otherwise undefined (unlimited). */
export function maxOrderQtyForTiers(tiers: QtyTier[]): number | undefined {
  if (tiers.length === 0) {
    return undefined;
  }
  const last = sortedTiers(tiers)[tiers.length - 1]!;
  if (last.maxQty != null && last.maxQty >= last.minQty) {
    return last.maxQty;
  }
  return undefined;
}

/** Input max for quantity controls: tier cap or the storefront fallback limit. */
export function orderQtyLimitForTiers(tiers: QtyTier[]): number {
  return maxOrderQtyForTiers(tiers) ?? UNLIMITED_ORDER_QTY;
}

export function clampOrderQty(qty: number, tiers: QtyTier[]): number {
  const max = orderQtyLimitForTiers(tiers);
  return Math.min(max, Math.max(1, Math.floor(qty)));
}

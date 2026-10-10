import type { OrderUnit } from "./types";

/** Flat delivery fee (kobo) when every cart line is piece. ₦2,000. */
export const DELIVERY_FEE_PIECE_ONLY_KOBO = 200_000;

/**
 * Mirrors backend pricing.DeliveryFeeKobo.
 * Free when any line is bundle or dozen; otherwise ₦2,000 for piece-only carts.
 */
export function deliveryFeeKoboFromUnits(units: OrderUnit[]): number {
  if (units.length === 0) return 0;
  if (units.some((u) => u === "bundle" || u === "dozen")) return 0;
  return DELIVERY_FEE_PIECE_ONLY_KOBO;
}

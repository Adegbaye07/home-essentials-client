/** Resolve subtotal / delivery for API payloads that may omit newer fields. */
export function resolveOrderAmounts(order: {
  subtotalAmountKobo?: number;
  deliveryFeeKobo?: number;
  totalAmountKobo: number;
  items?: { lineTotalKobo: number }[];
}): { subtotalKobo: number; deliveryFeeKobo: number; totalKobo: number } {
  const itemsSubtotal =
    order.items?.reduce((s, it) => s + it.lineTotalKobo, 0) ?? 0;
  const subtotalKobo = order.subtotalAmountKobo ?? itemsSubtotal;
  const deliveryFeeKobo =
    order.deliveryFeeKobo ??
    Math.max(0, order.totalAmountKobo - (subtotalKobo || order.totalAmountKobo));
  return {
    subtotalKobo: subtotalKobo || order.totalAmountKobo,
    deliveryFeeKobo,
    totalKobo: order.totalAmountKobo,
  };
}

import { formatKobo } from "@/lib/format";

type OrderSummaryLinesProps = {
  subtotalKobo: number;
  className?: string;
};

export function OrderSummaryLines({ subtotalKobo, className = "" }: OrderSummaryLinesProps) {
  return (
    <dl className={`space-y-2 text-sm ${className}`}>
      <div className="flex justify-between gap-4 text-hek-muted">
        <dt>Subtotal</dt>
        <dd className="text-hek-ink">{formatKobo(subtotalKobo)}</dd>
      </div>
      <div className="flex justify-between gap-4 text-hek-muted">
        <dt>Delivery</dt>
        <dd className="font-medium text-hek-ink">Free</dd>
      </div>
      <div className="flex justify-between gap-4 border-t border-hek-primary/15 pt-2 text-base font-semibold text-hek-primary">
        <dt>Total</dt>
        <dd>{formatKobo(subtotalKobo)}</dd>
      </div>
    </dl>
  );
}

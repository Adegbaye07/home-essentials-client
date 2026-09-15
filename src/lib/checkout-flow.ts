import { createOrder } from "@/lib/api";
import { readCart } from "@/lib/cart";

export type CheckoutCustomerValues = {
  name: string;
  email: string;
  phone: string;
  deliveryAddress: string;
};

export type SubmitCartCheckoutCallbacks = {
  onSuccess: (orderId: string) => void;
};

/**
 * Phase 4: create the shop order only (no Paystack).
 * Phase 5 will open Paystack after this succeeds.
 */
export async function submitCartCheckout(
  values: CheckoutCustomerValues,
  callbacks: SubmitCartCheckoutCallbacks,
): Promise<{ orderId: string; totalAmountKobo: number; paystackReference: string }> {
  const cart = readCart();
  if (cart.length === 0) {
    throw new Error("Your cart is empty");
  }

  const order = await createOrder({
    items: cart.map((l) => ({
      productId: l.productId,
      variant: l.variant,
      size: l.size,
      unit: l.unit,
      quantity: l.quantity,
    })),
    customer: values,
  });

  callbacks.onSuccess(order.id);
  return {
    orderId: order.id,
    totalAmountKobo: order.totalAmountKobo,
    paystackReference: order.paystackReference,
  };
}

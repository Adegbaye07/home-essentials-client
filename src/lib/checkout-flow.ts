import { abandonPayment, createOrder } from "@/lib/api";
import { clearCart, readCart } from "@/lib/cart";
import { openPaystackForOrder } from "@/lib/paystack-checkout";

export type CheckoutCustomerValues = {
  name: string;
  email: string;
  phone: string;
  deliveryAddress: string;
};

export type SubmitCartCheckoutCallbacks = {
  onSuccess: (reference: string) => void;
  onCancelWarning: (message: string) => void;
  onCancelInfo: (message: string) => void;
};

export type CheckoutRouter = {
  push: (href: string) => void;
};

export async function submitCartCheckout(
  values: CheckoutCustomerValues,
  router: CheckoutRouter,
  callbacks: SubmitCartCheckoutCallbacks,
): Promise<void> {
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

  await openPaystackForOrder({
    orderId: order.id,
    email: values.email,
    onSuccess: (reference) => {
      clearCart();
      callbacks.onSuccess(reference);
      router.push(`/checkout/success?reference=${encodeURIComponent(reference)}`);
    },
    onCancel: (reference) => {
      void (async () => {
        try {
          await abandonPayment(reference, values.email);
        } catch {
          callbacks.onCancelWarning("Payment cancelled");
        }
        callbacks.onCancelInfo("Payment cancelled — your cart is still saved");
        router.push(
          `/checkout/success?reference=${encodeURIComponent(reference)}&pending=1`,
        );
      })();
    },
  });
}

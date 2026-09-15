import { initializePayment } from "@/lib/api";

export type OpenPaystackForOrderOptions = {
  orderId: string;
  email: string;
  onSuccess: (reference: string) => void;
  onCancel: (reference: string) => void;
};

/**
 * Initializes Paystack for an existing order and opens the Inline popup.
 * Resolves once the popup is opened (not when payment completes).
 */
export async function openPaystackForOrder(
  options: OpenPaystackForOrderOptions,
): Promise<{ reference: string }> {
  const { orderId, email, onSuccess, onCancel } = options;

  const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
  if (!publicKey) {
    throw new Error("NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY is not set");
  }

  const { accessCode, reference } = await initializePayment(orderId);

  const PaystackInline = (await import("@paystack/inline-js")).default;
  const popup = new PaystackInline();
  popup.newTransaction({
    key: publicKey,
    email,
    accessCode,
    onSuccess: () => onSuccess(reference),
    onCancel: () => onCancel(reference),
  });

  return { reference };
}

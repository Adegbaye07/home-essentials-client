import { initializePayment } from "@/lib/api";
import { config } from "@/lib/config";

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

  const { accessCode, reference } = await initializePayment(orderId);

  const PaystackInline = (await import("@paystack/inline-js")).default;
  const popup = new PaystackInline();
  popup.newTransaction({
    key: config.paystackPublicKey,
    email,
    accessCode,
    onSuccess: () => onSuccess(reference),
    onCancel: () => onCancel(reference),
  });

  return { reference };
}

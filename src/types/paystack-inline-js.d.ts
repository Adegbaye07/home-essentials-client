declare module "@paystack/inline-js" {
  export default class PaystackPop {
    newTransaction(options: {
      key?: string;
      email?: string;
      accessCode?: string;
      onSuccess?: (transaction: { reference: string }) => void;
      onCancel?: () => void;
    }): unknown;
  }
}

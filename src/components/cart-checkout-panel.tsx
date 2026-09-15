"use client";

import { useState } from "react";
import { Alert, Button, Form, Input, message } from "antd";

import { dispatchCartUpdated } from "@/components/store-header";
import { OrderSummaryLines } from "@/components/order-summary-lines";
import { clearCart } from "@/lib/cart";
import { submitCartCheckout } from "@/lib/checkout-flow";
import { formatKobo } from "@/lib/format";

type CartCheckoutPanelProps = {
  subtotalKobo: number;
  disabled?: boolean;
};

export function CartCheckoutPanel({ subtotalKobo, disabled = false }: CartCheckoutPanelProps) {
  const [submitting, setSubmitting] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);
  const [placedTotal, setPlacedTotal] = useState<number | null>(null);

  async function onFinish(values: {
    name: string;
    email: string;
    phone: string;
    deliveryAddress: string;
  }) {
    setSubmitting(true);
    try {
      const result = await submitCartCheckout(values, {
        onSuccess: () => {
          clearCart();
          dispatchCartUpdated();
        },
      });
      setPlacedOrderId(result.orderId);
      setPlacedTotal(result.totalAmountKobo);
      message.success("Order created — payment opens in the next release");
    } catch (e) {
      message.error(e instanceof Error ? e.message : "Checkout failed");
    } finally {
      setSubmitting(false);
    }
  }

  const payDisabled = disabled || submitting || subtotalKobo <= 0;

  if (placedOrderId) {
    return (
      <div className="rounded-xl border border-hek-primary/15 bg-white p-5 shadow-sm">
        <h2 className="font-serif text-lg text-hek-ink">Order placed</h2>
        <Alert
          className="mt-4"
          type="success"
          showIcon
          message="Order created"
          description={
            <div className="space-y-1 text-sm">
              <p>
                Order id: <span className="font-mono text-xs">{placedOrderId}</span>
              </p>
              {placedTotal != null ? <p>Total: {formatKobo(placedTotal)}</p> : null}
              <p className="text-hek-muted">
                Paystack checkout lands in Phase 5. For now, mark the order paid in admin to
                continue testing fulfilment.
              </p>
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-hek-primary/15 bg-white p-5 shadow-sm">
      <h2 className="font-serif text-lg text-hek-ink">Checkout</h2>
      <p className="mt-1 text-sm text-hek-muted">
        Enter delivery details to create your order. Online payment arrives in the next release —
        your cart totals already use live catalogue prices.
      </p>

      <Alert
        className="mt-4"
        type="info"
        showIcon
        message="Paystack not enabled yet"
        description="Submitting creates a pending_payment order you can see in admin."
      />

      <div className="mt-5">
        <OrderSummaryLines subtotalKobo={subtotalKobo} />
      </div>

      <Form
        layout="vertical"
        className="mt-6"
        onFinish={onFinish}
        requiredMark={false}
        disabled={disabled}
      >
        <Form.Item name="name" label="Name" rules={[{ required: true, whitespace: true }]}>
          <Input size="large" autoComplete="name" />
        </Form.Item>
        <Form.Item name="email" label="Email" rules={[{ required: true, type: "email" }]}>
          <Input size="large" />
        </Form.Item>
        <Form.Item name="phone" label="Phone" rules={[{ required: true }]}>
          <Input size="large" />
        </Form.Item>
        <Form.Item
          name="deliveryAddress"
          label="Delivery address"
          rules={[{ required: true }]}
        >
          <Input.TextArea rows={3} />
        </Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          size="large"
          block
          loading={submitting}
          disabled={payDisabled}
        >
          Create order
        </Button>
      </Form>
    </div>
  );
}

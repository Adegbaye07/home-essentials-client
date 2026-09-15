"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Form, Input, message } from "antd";

import { dispatchCartUpdated } from "@/components/store-header";
import { OrderSummaryLines } from "@/components/order-summary-lines";
import { FIXED_DELIVERY_COPY } from "@/lib/delivery-display";
import { submitCartCheckout } from "@/lib/checkout-flow";

type CartCheckoutPanelProps = {
  subtotalKobo: number;
  disabled?: boolean;
};

export function CartCheckoutPanel({ subtotalKobo, disabled = false }: CartCheckoutPanelProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function onFinish(values: {
    name: string;
    email: string;
    phone: string;
    deliveryAddress: string;
  }) {
    setSubmitting(true);
    try {
      await submitCartCheckout(values, router, {
        onSuccess: () => {
          dispatchCartUpdated();
        },
        onCancelWarning: (text) => message.warning(text),
        onCancelInfo: (text) => {
          message.info(text);
        },
      });
    } catch (e) {
      message.error(e instanceof Error ? e.message : "Checkout failed");
    } finally {
      setSubmitting(false);
    }
  }

  const payDisabled = disabled || submitting || subtotalKobo <= 0;

  return (
    <div className="rounded-xl border border-hek-primary/15 bg-white p-5 shadow-sm">
      <h2 className="font-serif text-lg text-hek-ink">Checkout</h2>
      <p className="mt-1 text-sm text-hek-muted">
        Enter delivery details below to pay securely with Paystack.
      </p>
      <p className="mt-1 text-xs text-hek-muted">{FIXED_DELIVERY_COPY}</p>

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
          <Input size="large" autoComplete="email" />
        </Form.Item>
        <Form.Item name="phone" label="Phone" rules={[{ required: true }]}>
          <Input size="large" autoComplete="tel" />
        </Form.Item>
        <Form.Item
          name="deliveryAddress"
          label="Delivery address"
          rules={[{ required: true }]}
        >
          <Input.TextArea rows={3} autoComplete="street-address" />
        </Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          size="large"
          block
          loading={submitting}
          disabled={payDisabled}
        >
          Pay with Paystack
        </Button>
      </Form>
    </div>
  );
}

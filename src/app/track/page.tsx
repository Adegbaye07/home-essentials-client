"use client";

import { useState } from "react";
import { Button, Form, Input, Layout, Tag, Timeline, message } from "antd";

import { StoreHeader } from "@/components/store-header";
import { trackOrder } from "@/lib/api";
import { orderStatusColor, orderStatusLabel, unitDisplayLabel } from "@/lib/constants";
import { formatDateTime, formatKobo } from "@/lib/format";
import type { TrackResult } from "@/lib/types";

const { Content } = Layout;

function OrderTimeline({ history }: { history: TrackResult["statusHistory"] }) {
  return (
    <>
      <h2 className="mb-3 text-base font-semibold text-hek-ink">Timeline</h2>
      <Timeline
        items={[...history].reverse().map((entry) => ({
          color: orderStatusColor(entry.status),
          content: (
            <div>
              <div className="font-medium text-hek-ink">{orderStatusLabel(entry.status)}</div>
              <div className="text-sm text-neutral-500">{formatDateTime(entry.at)}</div>
              {entry.note ? (
                <div className="text-sm text-neutral-600">{entry.note}</div>
              ) : null}
            </div>
          ),
        }))}
      />
    </>
  );
}

export default function TrackPage() {
  const [result, setResult] = useState<TrackResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function onFinish(values: { trackingNumber: string; email: string }) {
    setLoading(true);
    try {
      const data = await trackOrder(values);
      setResult(data);
    } catch (e) {
      message.error(e instanceof Error ? e.message : "Order not found");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout className="min-h-screen bg-hek-bg">
      <StoreHeader active="track" />
      <Content className="mx-auto w-full max-w-lg flex-1 px-4 py-8 sm:px-6">
        <h1 className="font-serif text-3xl text-hek-ink">Track your order</h1>
        <p className="mt-2 text-sm text-hek-muted">
          Enter your tracking ID (from your confirmation email) and the email used at checkout.
        </p>
        <Form layout="vertical" className="mt-8" onFinish={onFinish}>
          <Form.Item name="trackingNumber" label="Tracking ID" rules={[{ required: true }]}>
            <Input placeholder="KAM-YYYYMMDD-XXXXXX" />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: "email" }]}>
            <Input />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading}>
            Track
          </Button>
        </Form>
        {result ? (
          <div className="mt-10 rounded-xl border border-hek-primary/15 bg-white p-6">
            <Tag color={orderStatusColor(result.status)} className="m-0">
              {orderStatusLabel(result.status)}
            </Tag>
            <p className="mt-2 font-medium text-hek-ink">{result.trackingNumber}</p>
            <p className="mt-1 text-sm text-hek-muted">Total {formatKobo(result.totalAmountKobo)}</p>
            {result.items && result.items.length > 0 ? (
              <ul className="mt-4 space-y-2 border-t border-hek-primary/10 pt-4 text-sm">
                {result.items.map((item, i) => (
                  <li key={`${item.productTitle}-${i}`} className="text-hek-muted">
                    <span className="font-medium text-hek-ink">{item.productTitle}</span>
                    {" — "}
                    {item.variant}
                    {item.size ? ` · ${item.size}` : ""}
                    {" · "}
                    {unitDisplayLabel(item.unit, item.piecesPerBundle)} × {item.quantity}
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="mt-6">
              <OrderTimeline history={result.statusHistory} />
            </div>
          </div>
        ) : null}
      </Content>
    </Layout>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button, Layout, Result, Spin, message } from "antd";

import { StoreHeader } from "@/components/store-header";
import { verifyPayment } from "@/lib/api";
import { openPaystackForOrder } from "@/lib/paystack-checkout";

const { Content } = Layout;

const PAID_STATUSES = new Set(["paid", "packing", "in_transit", "delivered"]);

function isOrderPaid(status: string | null): boolean {
  return status != null && PAID_STATUSES.has(status);
}

function isUnpaidAwaitingPayment(status: string | null): boolean {
  return status === "pending_payment" || status === "abandoned";
}

function isOrderNotFoundError(err: unknown): boolean {
  return err instanceof Error && err.message.toLowerCase().includes("order not found");
}

export default function CheckoutSuccessInner() {
  const params = useSearchParams();
  const reference = params.get("reference") ?? "";
  const pendingQuery = params.get("pending") === "1";

  const [status, setStatus] = useState<string | null>(null);
  const [tracking, setTracking] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [customerEmail, setCustomerEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(reference));
  const [verifyFailed, setVerifyFailed] = useState(false);
  const [orderExpired, setOrderExpired] = useState(false);
  const [resuming, setResuming] = useState(false);
  const stopPollRef = useRef(false);

  useEffect(() => {
    if (!reference) {
      setLoading(false);
      return;
    }

    stopPollRef.current = false;
    let cancelled = false;

    async function poll() {
      if (stopPollRef.current) return;
      try {
        const v = await verifyPayment(reference);
        if (cancelled || stopPollRef.current) return;

        setVerifyFailed(false);
        setOrderExpired(false);
        setStatus(v.status);
        setOrderId(v.orderId);
        setCustomerEmail(v.customerEmail);
        if (v.trackingNumber) setTracking(v.trackingNumber);

        if (isOrderPaid(v.status)) {
          stopPollRef.current = true;
          setLoading(false);
          return;
        }

        if (pendingQuery || isUnpaidAwaitingPayment(v.status)) {
          setLoading(false);
        } else if (v.paystackStatus === "success") {
          setLoading(true);
        } else {
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          if (isOrderNotFoundError(err)) {
            setOrderExpired(true);
          } else {
            setVerifyFailed(true);
          }
          setLoading(false);
          stopPollRef.current = true;
        }
      }
    }

    void poll();
    const id = window.setInterval(() => void poll(), 4000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [reference, pendingQuery]);

  async function handleCompletePayment() {
    if (!orderId || !customerEmail) {
      message.error("Missing order details — refresh and try again");
      return;
    }
    setResuming(true);
    try {
      await openPaystackForOrder({
        orderId,
        email: customerEmail,
        onSuccess: (ref) => {
          window.location.href = `/checkout/success?reference=${encodeURIComponent(ref)}`;
        },
        onCancel: (ref) => {
          window.location.href = `/checkout/success?reference=${encodeURIComponent(ref)}&pending=1`;
        },
      });
    } catch (e) {
      message.error(e instanceof Error ? e.message : "Could not reopen payment");
    } finally {
      setResuming(false);
    }
  }

  if (!reference) {
    return (
      <Layout className="min-h-screen bg-hek-bg">
        <StoreHeader />
        <Content className="mx-auto w-full max-w-lg flex-1 px-4 py-12 sm:px-6">
          <Result
            status="error"
            title="Missing payment reference"
            subTitle="Use the link from checkout or start a new order from the store."
            extra={
              <Link href="/store">
                <Button type="primary">Go to store</Button>
              </Link>
            }
          />
        </Content>
      </Layout>
    );
  }

  if (orderExpired) {
    return (
      <Layout className="min-h-screen bg-hek-bg">
        <StoreHeader />
        <Content className="mx-auto w-full max-w-lg flex-1 px-4 py-12 sm:px-6">
          <Result
            status="info"
            title="This checkout offer has expired"
            subTitle="Unpaid orders are removed after a while. Add items from the store and check out again."
            extra={
              <Link href="/store">
                <Button type="primary" size="large">
                  Go to store
                </Button>
              </Link>
            }
          />
        </Content>
      </Layout>
    );
  }

  if (verifyFailed) {
    return (
      <Layout className="min-h-screen bg-hek-bg">
        <StoreHeader />
        <Content className="mx-auto w-full max-w-lg flex-1 px-4 py-12 sm:px-6">
          <Result
            status="error"
            title="Could not load order"
            subTitle="Check your connection or confirm the payment link is still valid."
            extra={
              <div className="flex flex-wrap justify-center gap-3">
                <Button type="primary" onClick={() => window.location.reload()}>
                  Retry
                </Button>
                <Link href="/store">
                  <Button>Go to store</Button>
                </Link>
              </div>
            }
          />
        </Content>
      </Layout>
    );
  }

  const paid = isOrderPaid(status);
  const unpaidAwaiting = isUnpaidAwaitingPayment(status);
  const confirming =
    loading && !pendingQuery && !paid && (unpaidAwaiting || status === null);

  if (loading && status === null) {
    return (
      <Layout className="min-h-screen bg-hek-bg">
        <StoreHeader />
        <Content className="mx-auto w-full max-w-lg flex-1 px-4 py-12 sm:px-6">
          <div className="flex flex-col items-center gap-4 py-12">
            <Spin size="large" />
            <p className="text-hek-muted">Loading order…</p>
          </div>
        </Content>
      </Layout>
    );
  }

  const title = paid
    ? "Payment received"
    : unpaidAwaiting && pendingQuery
      ? "Order created — payment not completed"
      : confirming
        ? "Confirming payment…"
        : unpaidAwaiting
          ? "Complete your payment"
          : "Payment pending confirmation";

  const subTitle = paid
    ? tracking
      ? `Your tracking ID: ${tracking}`
      : "We will email your tracking ID shortly."
    : unpaidAwaiting
      ? pendingQuery || status === "abandoned"
        ? "Your cart is still saved. Complete payment below, or return to the cart to change items."
        : "Finish payment to confirm your order."
      : tracking
        ? `Your tracking ID: ${tracking}`
        : "We will email your tracking ID once payment is confirmed.";

  const resultStatus = paid ? "success" : unpaidAwaiting ? "info" : confirming ? "info" : "warning";

  const extra = (
    <div className="flex flex-wrap justify-center gap-3">
      {unpaidAwaiting ? (
        <>
          <Button
            type="primary"
            size="large"
            loading={resuming}
            onClick={() => void handleCompletePayment()}
            disabled={!orderId || !customerEmail}
          >
            Complete payment
          </Button>
          <Link href="/cart">
            <Button size="large">Back to cart</Button>
          </Link>
          <Link href="/store">
            <Button size="large">Go to store</Button>
          </Link>
        </>
      ) : (
        <>
          {paid && tracking ? (
            <Link href="/track">
              <Button type="primary" size="large">
                Track order
              </Button>
            </Link>
          ) : null}
          <Link href="/store">
            <Button type={paid && tracking ? "default" : "primary"} size="large">
              Continue shopping
            </Button>
          </Link>
        </>
      )}
    </div>
  );

  return (
    <Layout className="min-h-screen bg-hek-bg">
      <StoreHeader />
      <Content className="mx-auto w-full max-w-lg flex-1 px-4 py-12 sm:px-6">
        {confirming ? (
          <div className="flex flex-col items-center gap-4 py-12">
            <Spin size="large" />
            <p className="text-hek-muted">Confirming payment…</p>
          </div>
        ) : (
          <Result status={resultStatus} title={title} subTitle={subTitle} extra={extra} />
        )}
      </Content>
    </Layout>
  );
}

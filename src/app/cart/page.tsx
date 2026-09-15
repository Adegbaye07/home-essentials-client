"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { DeleteOutlined } from "@ant-design/icons";
import { Button, InputNumber, Layout, Select, Spin } from "antd";

import { StoreHeader, dispatchCartUpdated } from "@/components/store-header";
import { CartBackLink } from "@/components/cart-back-link";
import { CartCheckoutPanel } from "@/components/cart-checkout-panel";
import { getProduct } from "@/lib/api";
import {
  readCart,
  removeCartLine,
  updateCartLineColor,
  updateCartLineQuantity,
  updateCartLineSize,
} from "@/lib/cart";
import { sizeDisplayLabel } from "@/lib/constants";
import { formatDeliveryWindow } from "@/lib/delivery-display";
import { formatKobo } from "@/lib/format";
import { imageUrlForColor } from "@/lib/product-helpers";
import {
  clampOrderQty,
  lineTotalKobo,
  orderQtyLimitForTiers,
  tierForQty,
} from "@/lib/pricing";
import type { CartLine, Product } from "@/lib/types";

const { Content } = Layout;

const QTY_DEBOUNCE_MS = 1000;

type PricedLine = CartLine & {
  cartIndex: number;
  unitKobo: number;
  lineKobo: number;
  colors: string[];
  sizes: string[];
  maxOrderQty: number;
  deliverySummary?: string;
};

async function priceCartLines(cart: CartLine[]): Promise<PricedLine[]> {
  const priced: PricedLine[] = [];
  const qtyUpdates: { index: number; qty: number }[] = [];

  for (let cartIndex = 0; cartIndex < cart.length; cartIndex++) {
    const line = cart[cartIndex];
    try {
      const p: Product = await getProduct(line.productId);
      const sizeCodes = p.sizes.map((s) => s.code);
      const sv = p.sizes.find((s) => s.code === line.size);
      if (!sv) {
        priced.push({
          ...line,
          cartIndex,
          colors: p.colors,
          sizes: sizeCodes,
          unitKobo: 0,
          lineKobo: 0,
          maxOrderQty: orderQtyLimitForTiers([]),
        });
        continue;
      }

      const maxOrderQty = orderQtyLimitForTiers(sv.tiers);
      let quantity = clampOrderQty(line.quantity, sv.tiers);
      if (quantity !== line.quantity) {
        qtyUpdates.push({ index: cartIndex, qty: quantity });
      }

      const lineKobo = lineTotalKobo(sv.tiers, quantity);
      const resolvedImage = line.imageUrl || imageUrlForColor(p, line.color);
      let deliverySummary: string | undefined;
      try {
        const tier = tierForQty(sv.tiers, quantity);
        if (tier.deliveryDays >= 1) {
          deliverySummary = formatDeliveryWindow(tier.deliveryDays);
        }
      } catch {
        deliverySummary = undefined;
      }
      priced.push({
        ...line,
        quantity,
        imageUrl: resolvedImage,
        cartIndex,
        colors: p.colors,
        sizes: sizeCodes,
        unitKobo: lineKobo / quantity,
        lineKobo,
        maxOrderQty,
        deliverySummary,
      });
    } catch {
      priced.push({
        ...line,
        cartIndex,
        colors: [],
        sizes: [],
        unitKobo: 0,
        lineKobo: 0,
        maxOrderQty: orderQtyLimitForTiers([]),
      });
    }
  }

  for (const update of qtyUpdates) {
    updateCartLineQuantity(update.index, update.qty);
  }
  if (qtyUpdates.length > 0) {
    dispatchCartUpdated();
  }

  return priced;
}

function CartQuantityInput({
  cartIndex,
  quantity,
  maxOrderQty,
  disabled,
  onCommit,
}: {
  cartIndex: number;
  quantity: number;
  maxOrderQty: number;
  disabled: boolean;
  onCommit: (cartIndex: number, qty: number) => void | Promise<void>;
}) {
  const [draft, setDraft] = useState<number | null>(quantity);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setDraft(quantity);
  }, [quantity]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const flush = useCallback(
    (value: number | null) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (value == null || !Number.isFinite(value) || value < 1) {
        setDraft(quantity);
        return;
      }
      const q = Math.min(maxOrderQty, Math.max(1, Math.floor(value)));
      setDraft(q);
      if (q !== quantity) {
        void onCommit(cartIndex, q);
      }
    },
    [cartIndex, maxOrderQty, onCommit, quantity],
  );

  function schedule(value: number | null) {
    setDraft(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => flush(value), QTY_DEBOUNCE_MS);
  }

  return (
    <InputNumber
      min={1}
      max={maxOrderQty}
      className="w-full!"
      value={draft}
      disabled={disabled}
      onChange={(v) => schedule(v)}
      onBlur={() => flush(draft)}
    />
  );
}

export default function CartPage() {
  const [lines, setLines] = useState<PricedLine[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const refreshLines = useCallback(async () => {
    const cart = readCart();
    setLines(await priceCartLines(cart));
  }, []);

  useEffect(() => {
    void (async () => {
      setInitialLoading(true);
      await refreshLines();
      setInitialLoading(false);
    })();
  }, [refreshLines]);

  const total = lines.reduce((s, l) => s + l.lineKobo, 0);

  const withCartUpdate = useCallback(async (fn: () => void | Promise<void>) => {
    setUpdating(true);
    try {
      await fn();
      dispatchCartUpdated();
      await refreshLines();
    } finally {
      setUpdating(false);
    }
  }, [refreshLines]);

  const changeQty = useCallback(
    async (cartIndex: number, qty: number) => {
      await withCartUpdate(() => {
        updateCartLineQuantity(cartIndex, qty);
      });
    },
    [withCartUpdate],
  );

  async function changeColor(cartIndex: number, color: string) {
    await withCartUpdate(async () => {
      const cart = readCart();
      const line = cart[cartIndex];
      if (!line) return;
      let imageUrl: string | undefined;
      try {
        const p = await getProduct(line.productId);
        imageUrl = imageUrlForColor(p, color);
      } catch {
        // keep previous image
      }
      updateCartLineColor(cartIndex, color, imageUrl);
    });
  }

  async function changeSize(cartIndex: number, newSize: string) {
    await withCartUpdate(() => {
      updateCartLineSize(cartIndex, newSize);
    });
  }

  async function removeLine(cartIndex: number) {
    await withCartUpdate(() => {
      removeCartLine(cartIndex);
    });
  }

  const desktopSplitScroll = !initialLoading && lines.length > 0;

  return (
    <Layout
      className={`min-h-screen bg-hek-bg${
        desktopSplitScroll
          ? " lg:flex lg:h-svh lg:max-h-svh lg:flex-col lg:overflow-hidden"
          : ""
      }`}
    >
      <StoreHeader active="cart" />
      <Content
        className={`mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6${
          desktopSplitScroll ? " lg:flex lg:min-h-0 lg:flex-col lg:overflow-hidden lg:py-6" : ""
        }`}
      >
        <div className="shrink-0">
          <h1 className="font-serif text-3xl text-hek-ink">Your cart</h1>
          <Suspense fallback={null}>
            <CartBackLink />
          </Suspense>
        </div>
        {initialLoading ? (
          <div className="mt-16 flex justify-center">
            <Spin size="large" />
          </div>
        ) : lines.length === 0 ? (
          <div className="mt-8 space-y-4">
            <p className="text-hek-muted">Your cart is empty.</p>
            <Link href="/store">
              <Button type="primary">Continue shopping</Button>
            </Link>
          </div>
        ) : (
          <div className="mt-6 flex min-h-0 flex-1 flex-col lg:grid lg:min-h-0 lg:grid-cols-[1fr_min(380px,100%)] lg:items-start lg:gap-8">
            <ul
              className={`h-fit w-full divide-y divide-hek-primary/10 rounded-xl border border-hek-primary/15 bg-white lg:max-h-[calc(100svh-12rem)] lg:overflow-y-auto lg:overscroll-y-contain ${updating ? "opacity-70" : ""}`}
              aria-busy={updating}
            >
              {lines.map((line) => (
                <li
                  key={`${line.productId}-${line.size}-${line.color}-${line.cartIndex}`}
                  className="flex gap-4 p-4"
                >
                  <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-hek-bg">
                    {line.imageUrl ? (
                      <Image src={line.imageUrl} alt="" fill className="object-cover" sizes="96px" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-hek-ink">{line.title}</p>
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        aria-label="Remove"
                        disabled={updating}
                        onClick={() => void removeLine(line.cartIndex)}
                      />
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                      <div>
                        <span className="mb-1 block text-xs text-hek-muted">Size</span>
                        <Select
                          className="w-full"
                          value={line.size}
                          disabled={updating || line.sizes.length === 0}
                          onChange={(s) => void changeSize(line.cartIndex, s)}
                          options={line.sizes.map((s) => ({
                            value: s,
                            label: sizeDisplayLabel(s),
                          }))}
                        />
                      </div>
                      <div>
                        <span className="mb-1 block text-xs text-hek-muted">Color</span>
                        <Select
                          className="w-full"
                          value={line.color}
                          disabled={updating}
                          onChange={(c) => void changeColor(line.cartIndex, c)}
                          options={line.colors.map((c) => ({ value: c, label: c }))}
                        />
                      </div>
                      <div>
                        <span className="mb-1 block text-xs text-hek-muted">Quantity</span>
                        <CartQuantityInput
                          cartIndex={line.cartIndex}
                          quantity={line.quantity}
                          maxOrderQty={line.maxOrderQty}
                          disabled={updating}
                          onCommit={changeQty}
                        />
                      </div>
                    </div>
                    <p className="mt-3 font-semibold text-hek-primary">
                      {formatKobo(line.lineKobo)}
                      <span className="ml-2 text-sm font-normal text-hek-muted">
                        ({formatKobo(line.unitKobo)} / unit)
                      </span>
                    </p>
                    {line.deliverySummary ? (
                      <p className="mt-2 text-xs leading-relaxed text-hek-muted">{line.deliverySummary}</p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-8 shrink-0 lg:mt-0 lg:self-start">
              <CartCheckoutPanel subtotalKobo={total} disabled={updating} />
            </div>
          </div>
        )}
      </Content>
    </Layout>
  );
}

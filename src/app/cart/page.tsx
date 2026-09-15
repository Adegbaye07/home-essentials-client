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
  updateCartLineQuantity,
  updateCartLineSize,
  updateCartLineUnit,
  updateCartLineVariant,
} from "@/lib/cart";
import {
  DOZEN_PIECE_COUNT,
  isCleaningCategory,
  unitDisplayLabel,
} from "@/lib/constants";
import { FIXED_DELIVERY_COPY } from "@/lib/delivery-display";
import { formatKobo } from "@/lib/format";
import {
  availableUnits,
  clampOrderQty,
  lineTotalKobo,
  resolveLinePrice,
  sizePricingFor,
  UNLIMITED_ORDER_QTY,
} from "@/lib/pricing";
import { imageUrlForVariant } from "@/lib/product-helpers";
import type { CartLine, OrderUnit, Product } from "@/lib/types";

const { Content } = Layout;

const QTY_DEBOUNCE_MS = 1000;

type PricedLine = CartLine & {
  cartIndex: number;
  unitKobo: number;
  lineKobo: number;
  variants: string[];
  sizes: string[];
  units: OrderUnit[];
  cleaning: boolean;
  maxOrderQty: number;
};

async function priceCartLines(cart: CartLine[]): Promise<PricedLine[]> {
  const priced: PricedLine[] = [];
  const qtyUpdates: { index: number; qty: number }[] = [];

  for (let cartIndex = 0; cartIndex < cart.length; cartIndex++) {
    const line = cart[cartIndex];
    try {
      const p: Product = await getProduct(line.productId);
      const cleaning = isCleaningCategory(p.category);
      const sizes = (p.sizePricings ?? []).map((sp) => sp.size);
      const units = availableUnits(p);
      let quantity = clampOrderQty(line.quantity);
      if (quantity !== line.quantity) {
        qtyUpdates.push({ index: cartIndex, qty: quantity });
      }

      let unitKobo = 0;
      let lineKobo = 0;
      let piecesPerBundle = line.piecesPerBundle;
      try {
        const resolved = resolveLinePrice(
          p,
          cleaning ? undefined : line.size,
          line.unit,
        );
        unitKobo = resolved.unitPriceKobo;
        lineKobo = lineTotalKobo(unitKobo, quantity);
        piecesPerBundle = resolved.piecesPerBundle;
      } catch {
        unitKobo = 0;
        lineKobo = 0;
      }

      const resolvedImage = line.imageUrl || imageUrlForVariant(p, line.variant);
      priced.push({
        ...line,
        quantity,
        piecesPerBundle,
        imageUrl: resolvedImage,
        cartIndex,
        variants: p.variants,
        sizes,
        units,
        cleaning,
        unitKobo,
        lineKobo,
        maxOrderQty: UNLIMITED_ORDER_QTY,
      });
    } catch {
      priced.push({
        ...line,
        cartIndex,
        variants: [],
        sizes: [],
        units: [line.unit],
        cleaning: false,
        unitKobo: 0,
        lineKobo: 0,
        maxOrderQty: UNLIMITED_ORDER_QTY,
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

  const withCartUpdate = useCallback(
    async (fn: () => void | Promise<void>) => {
      setUpdating(true);
      try {
        await fn();
        dispatchCartUpdated();
        await refreshLines();
      } finally {
        setUpdating(false);
      }
    },
    [refreshLines],
  );

  const changeQty = useCallback(
    async (cartIndex: number, qty: number) => {
      await withCartUpdate(() => {
        updateCartLineQuantity(cartIndex, qty);
      });
    },
    [withCartUpdate],
  );

  async function changeVariant(cartIndex: number, variant: string) {
    await withCartUpdate(async () => {
      const cart = readCart();
      const line = cart[cartIndex];
      if (!line) return;
      let imageUrl: string | undefined;
      try {
        const p = await getProduct(line.productId);
        imageUrl = imageUrlForVariant(p, variant);
      } catch {
        // keep previous image
      }
      updateCartLineVariant(cartIndex, variant, imageUrl);
    });
  }

  async function changeSize(cartIndex: number, newSize: string) {
    await withCartUpdate(async () => {
      const cart = readCart();
      const line = cart[cartIndex];
      if (!line) return;
      let piecesPerBundle: number | undefined;
      if (line.unit === "bundle") {
        try {
          const p = await getProduct(line.productId);
          piecesPerBundle = sizePricingFor(p, newSize)?.piecesPerBundle;
        } catch {
          // ignore
        }
      }
      updateCartLineSize(cartIndex, newSize);
      if (line.unit === "bundle") {
        const after = readCart();
        const idx = after.findIndex(
          (l) =>
            l.productId === line.productId &&
            l.variant === line.variant &&
            l.size === newSize &&
            l.unit === "bundle",
        );
        if (idx >= 0) {
          updateCartLineUnit(idx, "bundle", piecesPerBundle);
        }
      }
    });
  }

  async function changeUnit(cartIndex: number, newUnit: OrderUnit) {
    await withCartUpdate(async () => {
      const cart = readCart();
      const line = cart[cartIndex];
      if (!line) return;
      let piecesPerBundle: number | undefined;
      if (newUnit === "bundle" && line.size) {
        try {
          const p = await getProduct(line.productId);
          piecesPerBundle = sizePricingFor(p, line.size)?.piecesPerBundle;
        } catch {
          // ignore
        }
      }
      updateCartLineUnit(cartIndex, newUnit, piecesPerBundle);
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
          desktopSplitScroll
            ? " lg:flex lg:min-h-0 lg:flex-col lg:overflow-hidden lg:py-6"
            : ""
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
                  key={`${line.productId}-${line.variant}-${line.size ?? ""}-${line.unit}-${line.cartIndex}`}
                  className="flex gap-4 p-4"
                >
                  <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-hek-bg">
                    {line.imageUrl ? (
                      <Image
                        src={line.imageUrl}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
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
                    <div
                      className={`mt-3 grid gap-3 ${line.cleaning ? "sm:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-4"}`}
                    >
                      <div>
                        <span className="mb-1 block text-xs text-hek-muted">Variant</span>
                        <Select
                          className="w-full"
                          value={line.variant}
                          disabled={updating || line.variants.length === 0}
                          onChange={(v) => void changeVariant(line.cartIndex, v)}
                          options={line.variants.map((v) => ({ value: v, label: v }))}
                        />
                      </div>
                      {!line.cleaning ? (
                        <div>
                          <span className="mb-1 block text-xs text-hek-muted">Size</span>
                          <Select
                            className="w-full"
                            value={line.size}
                            disabled={updating || line.sizes.length === 0}
                            onChange={(s) => void changeSize(line.cartIndex, s)}
                            options={line.sizes.map((s) => ({ value: s, label: s }))}
                          />
                        </div>
                      ) : null}
                      <div>
                        <span className="mb-1 block text-xs text-hek-muted">Buy as</span>
                        <Select
                          className="w-full"
                          value={line.unit}
                          disabled={updating}
                          onChange={(u) => void changeUnit(line.cartIndex, u)}
                          options={line.units.map((u) => ({
                            value: u,
                            label: unitDisplayLabel(
                              u,
                              u === "dozen" ? DOZEN_PIECE_COUNT : line.piecesPerBundle,
                            ),
                          }))}
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
                        ({formatKobo(line.unitKobo)} /{" "}
                        {unitDisplayLabel(line.unit, line.piecesPerBundle)})
                      </span>
                    </p>
                    <p className="mt-2 text-xs leading-relaxed text-hek-muted">
                      {FIXED_DELIVERY_COPY}
                    </p>
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

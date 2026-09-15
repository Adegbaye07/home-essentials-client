"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Button,
  InputNumber,
  Layout,
  Select,
  Spin,
  Table,
  Tag,
  message,
} from "antd";

import { ProductGallery } from "@/components/product-gallery";
import { StoreHeader, dispatchCartUpdated } from "@/components/store-header";
import { getProduct } from "@/lib/api";
import { addToCart, readCart } from "@/lib/cart";
import { cartHrefWithReturn } from "@/lib/cart-return";
import { categoryLabel, sizeDisplayLabel } from "@/lib/constants";
import {
  formatDeliveryDaysShort,
  formatDeliveryWindow,
} from "@/lib/delivery-display";
import { formatKobo, formatQtyTierRange } from "@/lib/format";
import {
  clampOrderQty,
  lineTotalKobo,
  maxOrderQtyForTiers,
  orderQtyLimitForTiers,
  tierForQty,
  UNLIMITED_ORDER_QTY,
  unitPriceKobo,
} from "@/lib/pricing";
import { imageUrlForColor, productColorGallery } from "@/lib/product-helpers";
import type { Product, QtyTier } from "@/lib/types";

const { Content } = Layout;

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : "";

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [size, setSize] = useState<string>("");
  const [color, setColor] = useState<string>("");
  const [qty, setQty] = useState(1);

  const colorGallery = useMemo(
    () => (product ? productColorGallery(product) : []),
    [product],
  );

  const gallerySelectedIndex = useMemo(() => {
    const idx = colorGallery.findIndex((g) => g.color === color);
    return idx >= 0 ? idx : 0;
  }, [colorGallery, color]);

  useEffect(() => {
    if (!id) return;
    void getProduct(id)
      .then((p) => {
        setProduct(p);
        setSize(p.sizes[0]?.code ?? "");
        const cartLine = readCart().find((l) => l.productId === p.id);
        setColor(cartLine?.color ?? p.colors[0] ?? "");
      })
      .finally(() => setLoading(false));
  }, [id]);

  const sizeVariant = useMemo(
    () => product?.sizes.find((s) => s.code === size),
    [product, size],
  );

  const maxOrderQty = useMemo(
    () => (sizeVariant ? orderQtyLimitForTiers(sizeVariant.tiers) : undefined),
    [sizeVariant],
  );

  const cappedOrderMax = useMemo(
    () => (sizeVariant ? maxOrderQtyForTiers(sizeVariant.tiers) : undefined),
    [sizeVariant],
  );

  useEffect(() => {
    if (!sizeVariant) return;
    setQty((current) => clampOrderQty(current, sizeVariant.tiers));
  }, [sizeVariant]);

  const unitKobo = useMemo(() => {
    if (!sizeVariant) return null;
    try {
      return unitPriceKobo(sizeVariant.tiers, qty);
    } catch {
      return null;
    }
  }, [sizeVariant, qty]);

  const lineKobo = unitKobo != null ? unitKobo * qty : null;

  const deliverySummary = useMemo(() => {
    if (!sizeVariant) return null;
    try {
      const tier = tierForQty(sizeVariant.tiers, qty);
      if (tier.deliveryDays < 1) return null;
      return formatDeliveryWindow(tier.deliveryDays);
    } catch {
      return null;
    }
  }, [sizeVariant, qty]);

  const activeTierIndex = useMemo(() => {
    if (!sizeVariant) return -1;
    try {
      const active = tierForQty(sizeVariant.tiers, qty);
      return sizeVariant.tiers.findIndex(
        (t) => t.minQty === active.minQty && t.unitPriceKobo === active.unitPriceKobo,
      );
    } catch {
      return -1;
    }
  }, [sizeVariant, qty]);

  const tierColumns = useMemo(() => {
    const tiers = sizeVariant?.tiers ?? [];
    return [
      {
        title: "Range",
        key: "range",
        render: (_: unknown, t: QtyTier) => formatQtyTierRange(t),
      },
      {
        title: "Unit price",
        key: "price",
        render: (_: unknown, t: QtyTier, index: number) => {
          const prev = index > 0 ? tiers[index - 1] : null;
          if (prev && prev.unitPriceKobo > t.unitPriceKobo) {
            return (
              <span className="inline-flex flex-col gap-0.5">
                <span className="text-xs text-hek-muted line-through">
                  {formatKobo(prev.unitPriceKobo)}
                </span>
                <span className="font-medium text-hek-primary">{formatKobo(t.unitPriceKobo)}</span>
              </span>
            );
          }
          return formatKobo(t.unitPriceKobo);
        },
      },
      {
        title: "Delivery",
        key: "delivery",
        render: (_: unknown, t: QtyTier) => formatDeliveryDaysShort(t.deliveryDays ?? 0),
      },
      {
        title: "Est. arrival",
        key: "est",
        render: (_: unknown, t: QtyTier) => {
          const text = formatDeliveryWindow(t.deliveryDays ?? 0);
          return text ? (
            <span className="text-xs leading-snug text-hek-muted">{text}</span>
          ) : (
            "—"
          );
        },
      },
    ];
  }, [sizeVariant]);

  function handleAddToCart() {
    if (!product || !sizeVariant || !color) return;
    addToCart({
      productId: product.id,
      title: product.title,
      size,
      color,
      quantity: qty,
      imageUrl: imageUrlForColor(product, color),
    });
    dispatchCartUpdated();
    message.success("Added to cart");
  }

  return (
    <Layout className="min-h-screen bg-hek-bg">
      <StoreHeader active="store" overlay />
      <Content className="mx-auto w-full max-w-6xl flex-1 px-4 pb-8 pt-4 sm:px-6">
        {loading ? (
          <div className="flex min-h-[calc(100dvh-5.5rem)] items-center justify-center pt-14 sm:pt-16">
            <Spin size="large" />
          </div>
        ) : (
          <>
            <Link
              href="/store"
              className="mb-6 inline-block pt-14 text-sm text-hek-primary hover:underline sm:pt-16"
            >
              ← Back to shop
            </Link>
            {!product ? (
              <p>Product not found.</p>
            ) : (
              <div className="grid gap-10 lg:grid-cols-2">
                <ProductGallery
                  items={colorGallery.map((g) => ({
                    src: g.imageUrl,
                    label: g.color,
                  }))}
                  title={product.title}
                  selectedIndex={gallerySelectedIndex}
                  onSelectIndex={(index) => {
                    const picked = colorGallery[index];
                    if (picked) setColor(picked.color);
                  }}
                />
                <div className="flex flex-col gap-6">
                  <div>
                    <Tag className="mb-2">{categoryLabel(product.category)}</Tag>
                    <h1 className="font-serif text-3xl text-hek-ink">
                      {product.title}
                    </h1>
                    <p className="mt-4 whitespace-pre-wrap text-hek-muted">
                      {product.description}
                    </p>
                  </div>

                  {sizeVariant ? (
                    <section>
                      <h2 className="mb-2 text-base font-semibold">
                        Pricing tiers — size{" "}
                        {sizeDisplayLabel(sizeVariant.code)}
                      </h2>
                      <Table
                        size="small"
                        pagination={false}
                        rowKey={(_, i) => String(i)}
                        dataSource={sizeVariant.tiers}
                        columns={tierColumns}
                        scroll={{ x: "max-content" }}
                        rowClassName={(_, index) =>
                          index === activeTierIndex ? "bg-hek-primary/8" : ""
                        }
                      />
                    </section>
                  ) : null}

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-hek-ink">
                        Size
                      </label>
                      <Select
                        className="w-full"
                        value={size}
                        onChange={setSize}
                        options={product.sizes.map((s) => ({
                          value: s.code,
                          label: sizeDisplayLabel(s.code),
                        }))}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-hek-ink">
                        Color
                      </label>
                      <Select
                        className="w-full"
                        value={color}
                        onChange={setColor}
                        options={product.colors.map((c) => ({
                          value: c,
                          label: c,
                        }))}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-hek-ink">
                        Quantity
                      </label>
                      <InputNumber
                        min={1}
                        max={maxOrderQty ?? UNLIMITED_ORDER_QTY}
                        className="w-full!"
                        value={qty}
                        onChange={(v) =>
                          setQty(
                            clampOrderQty(v ?? 1, sizeVariant?.tiers ?? []),
                          )
                        }
                      />
                      {cappedOrderMax != null ? (
                        <p className="mt-1 text-xs text-hek-muted">
                          Maximum order quantity: {cappedOrderMax}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  {lineKobo != null ? (
                    <p className="text-xl font-semibold text-hek-primary">
                      {formatKobo(lineKobo)}{" "}
                      <span className="text-sm font-normal text-hek-muted">
                        ({formatKobo(unitKobo!)} / unit)
                      </span>
                    </p>
                  ) : (
                    <p className="text-red-600">
                      No price tier for this quantity
                    </p>
                  )}

                  {lineKobo != null ? (
                    <p className="text-sm text-hek-muted">Delivery: Free</p>
                  ) : null}

                  {deliverySummary ? (
                    <p className="text-sm leading-relaxed text-hek-muted">
                      {deliverySummary}
                    </p>
                  ) : null}

                  <div className="flex flex-wrap gap-3">
                    <Button
                      type="primary"
                      size="large"
                      onClick={handleAddToCart}
                      disabled={lineKobo == null}
                    >
                      Add to cart
                    </Button>
                    <Button
                      size="large"
                      onClick={() => router.push(cartHrefWithReturn(`/store/${id}`))}
                    >
                      Go to cart
                    </Button>
                  </div>

                  {product.sizes.length > 1 ? (
                    <section>
                      <h2 className="mb-2 text-base font-semibold">
                        All sizes on this product
                      </h2>
                      <ul className="list-inside list-disc text-sm text-hek-muted">
                        {product.sizes.map((s) => (
                          <li key={s.code}>{sizeDisplayLabel(s.code)}</li>
                        ))}
                      </ul>
                    </section>
                  ) : null}
                </div>
              </div>
            )}
          </>
        )}
      </Content>
    </Layout>
  );
}

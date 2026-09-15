"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button, InputNumber, Layout, Select, Spin, Tag, message } from "antd";

import { ProductGallery } from "@/components/product-gallery";
import { StoreHeader, dispatchCartUpdated } from "@/components/store-header";
import { getProduct } from "@/lib/api";
import { addToCart, readCart } from "@/lib/cart";
import { cartHrefWithReturn } from "@/lib/cart-return";
import {
  categoryLabel,
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
import {
  defaultSize,
  defaultVariant,
  imageUrlForVariant,
  productVariantGallery,
} from "@/lib/product-helpers";
import type { OrderUnit, Product } from "@/lib/types";

const { Content } = Layout;

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : "";

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [variant, setVariant] = useState("");
  const [size, setSize] = useState("");
  const [unit, setUnit] = useState<OrderUnit>("piece");
  const [qty, setQty] = useState(1);

  const cleaning = product ? isCleaningCategory(product.category) : false;

  const variantGallery = useMemo(
    () => (product ? productVariantGallery(product) : []),
    [product],
  );

  const gallerySelectedIndex = useMemo(() => {
    const idx = variantGallery.findIndex((g) => g.variant === variant);
    return idx >= 0 ? idx : 0;
  }, [variantGallery, variant]);

  const unitOptions = useMemo(() => {
    if (!product) return [];
    return availableUnits(product).map((u) => {
      let piecesPerBundle: number | undefined;
      if (u === "bundle" && size) {
        piecesPerBundle = sizePricingFor(product, size)?.piecesPerBundle;
      }
      return {
        value: u,
        label: unitDisplayLabel(u, u === "dozen" ? DOZEN_PIECE_COUNT : piecesPerBundle),
      };
    });
  }, [product, size]);

  useEffect(() => {
    if (!id) return;
    void getProduct(id)
      .then((p) => {
        setProduct(p);
        const cartLine = readCart().find((l) => l.productId === p.id);
        setVariant(cartLine?.variant ?? defaultVariant(p));
        setSize(cartLine?.size ?? defaultSize(p));
        setUnit(cartLine?.unit ?? "piece");
        if (cartLine?.quantity) setQty(cartLine.quantity);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const priced = useMemo(() => {
    if (!product || !variant) return null;
    try {
      return resolveLinePrice(product, cleaning ? undefined : size, unit);
    } catch {
      return null;
    }
  }, [product, variant, size, unit, cleaning]);

  const lineKobo =
    priced != null ? lineTotalKobo(priced.unitPriceKobo, qty) : null;

  function handleAddToCart() {
    if (!product || !variant || priced == null) return;
    if (!cleaning && !size) {
      message.warning("Choose a size");
      return;
    }
    addToCart({
      productId: product.id,
      title: product.title,
      variant,
      size: cleaning ? undefined : size,
      unit,
      piecesPerBundle: priced.piecesPerBundle,
      quantity: qty,
      imageUrl: imageUrlForVariant(product, variant),
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
                  items={variantGallery.map((g) => ({
                    src: g.imageUrl,
                    label: g.variant,
                  }))}
                  title={product.title}
                  selectedIndex={gallerySelectedIndex}
                  onSelectIndex={(index) => {
                    const picked = variantGallery[index];
                    if (picked) setVariant(picked.variant);
                  }}
                />
                <div className="flex flex-col gap-6">
                  <div>
                    <Tag className="mb-2">{categoryLabel(product.category)}</Tag>
                    <h1 className="font-serif text-3xl text-hek-ink">{product.title}</h1>
                    <p className="mt-4 whitespace-pre-wrap text-hek-muted">
                      {product.description}
                    </p>
                  </div>

                  {!cleaning && (product.sizePricings?.length ?? 0) > 0 ? (
                    <section className="rounded-lg border border-hek-primary/10 bg-white p-4 text-sm">
                      <h2 className="mb-2 font-semibold text-hek-ink">Pricing</h2>
                      <ul className="space-y-2 text-hek-muted">
                        {product.sizePricings!.map((sp) => (
                          <li key={sp.size}>
                            <span className="font-medium text-hek-ink">{sp.size}</span>
                            {" — "}
                            piece {formatKobo(sp.piecePriceKobo)}
                            {" · "}
                            bundle of {sp.piecesPerBundle}{" "}
                            {formatKobo(sp.bundlePriceKobo)}
                          </li>
                        ))}
                      </ul>
                    </section>
                  ) : null}

                  {cleaning && product.cleaningPricing ? (
                    <section className="rounded-lg border border-hek-primary/10 bg-white p-4 text-sm">
                      <h2 className="mb-2 font-semibold text-hek-ink">Pricing</h2>
                      <p className="text-hek-muted">
                        Piece {formatKobo(product.cleaningPricing.piecePriceKobo)}
                        {" · "}
                        Dozen ({DOZEN_PIECE_COUNT}){" "}
                        {formatKobo(product.cleaningPricing.dozenPriceKobo)}
                      </p>
                    </section>
                  ) : null}

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-hek-ink">
                        Variant
                      </label>
                      <Select
                        className="w-full"
                        value={variant || undefined}
                        onChange={setVariant}
                        options={product.variants.map((v) => ({ value: v, label: v }))}
                        placeholder="Choose variant"
                      />
                    </div>
                    {!cleaning ? (
                      <div>
                        <label className="mb-1 block text-sm font-medium text-hek-ink">
                          Size
                        </label>
                        <Select
                          className="w-full"
                          value={size || undefined}
                          onChange={(s) => {
                            setSize(s);
                            if (unit === "bundle") {
                              const ppb = sizePricingFor(product, s)?.piecesPerBundle;
                              if (!ppb) setUnit("piece");
                            }
                          }}
                          options={(product.sizePricings ?? []).map((sp) => ({
                            value: sp.size,
                            label: sp.size,
                          }))}
                          placeholder="Choose size"
                        />
                      </div>
                    ) : null}
                    <div>
                      <label className="mb-1 block text-sm font-medium text-hek-ink">
                        Buy as
                      </label>
                      <Select
                        className="w-full"
                        value={unit}
                        onChange={setUnit}
                        options={unitOptions}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-hek-ink">
                        Quantity
                      </label>
                      <InputNumber
                        min={1}
                        max={UNLIMITED_ORDER_QTY}
                        className="w-full!"
                        value={qty}
                        onChange={(v) => setQty(clampOrderQty(v ?? 1))}
                      />
                    </div>
                  </div>

                  {lineKobo != null ? (
                    <p className="text-xl font-semibold text-hek-primary">
                      {formatKobo(lineKobo)}{" "}
                      <span className="text-sm font-normal text-hek-muted">
                        ({formatKobo(priced!.unitPriceKobo)} /{" "}
                        {unitDisplayLabel(unit, priced!.piecesPerBundle)})
                      </span>
                    </p>
                  ) : (
                    <p className="text-red-600">Select options to see price</p>
                  )}

                  <p className="text-sm text-hek-muted">{FIXED_DELIVERY_COPY}</p>

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
                </div>
              </div>
            )}
          </>
        )}
      </Content>
    </Layout>
  );
}

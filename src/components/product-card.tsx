"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingCartOutlined } from "@ant-design/icons";
import { Button, message, Tag } from "antd";

import { dispatchCartUpdated } from "@/components/store-header";
import { addToCart } from "@/lib/cart";
import { categoryLabel, sizeDisplayLabel } from "@/lib/constants";
import { formatDeliveryDaysShort } from "@/lib/delivery-display";
import { formatKobo } from "@/lib/format";
import {
  catalogueUnitPriceKobo,
  defaultColor,
  productMainImage,
  smallestSizeVariant,
} from "@/lib/product-helpers";
import { tierForQty } from "@/lib/pricing";
import type { Product } from "@/lib/types";

export function ProductCard({ product }: { product: Product }) {
  const sv = smallestSizeVariant(product);
  const unitKobo = catalogueUnitPriceKobo(product);
  const color = defaultColor(product);
  const image = productMainImage(product);
  let deliveryHint: string | null = null;
  if (sv) {
    try {
      const days = tierForQty(sv.tiers, 1).deliveryDays;
      if (days >= 1) deliveryHint = formatDeliveryDaysShort(days);
    } catch {
      deliveryHint = null;
    }
  }

  function handleQuickAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!sv || !color) {
      message.error("This product is not available to add yet");
      return;
    }
    addToCart({
      productId: product.id,
      title: product.title,
      size: sv.code,
      color,
      quantity: 1,
      imageUrl: image,
    });
    dispatchCartUpdated();
    message.success("Added to cart");
  }

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-hek-primary/15 bg-white shadow-sm transition hover:shadow-md">
      <Link href={`/store/${product.id}`} className="relative block aspect-4/3 bg-hek-bg">
        {image ? (
          <Image
            src={image}
            alt={product.title}
            fill
            className="object-cover transition group-hover:scale-[1.02]"
            sizes="(max-width:768px) 100vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-hek-muted">No image</div>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <Tag className="w-fit border-hek-accent/40 bg-hek-accent/10 text-hek-primary">
          {categoryLabel(product.category)}
        </Tag>
        <Link href={`/store/${product.id}`} className="font-serif text-lg leading-snug text-hek-ink hover:text-hek-primary">
          {product.title}
        </Link>
        <p className="line-clamp-2 text-sm text-hek-muted">{product.description}</p>
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div>
            {unitKobo != null ? (
              <p className="text-base font-semibold text-hek-primary">{formatKobo(unitKobo)}</p>
            ) : (
              <p className="text-sm text-hek-muted">See details for price</p>
            )}
            {sv ? (
              <p className="text-xs text-hek-muted">
                {sizeDisplayLabel(sv.code)} · qty 1
                {deliveryHint ? ` · ~${deliveryHint}` : null}
              </p>
            ) : null}
          </div>
          <Button
            type="primary"
            shape="circle"
            size="large"
            icon={<ShoppingCartOutlined />}
            aria-label="Add to cart"
            onClick={handleQuickAdd}
            className="shrink-0"
          />
        </div>
      </div>
    </article>
  );
}

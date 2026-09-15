"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { ShoppingCartOutlined } from "@ant-design/icons";
import { Button, message, Tag } from "antd";

import { dispatchCartUpdated } from "@/components/store-header";
import { addToCart } from "@/lib/cart";
import { categoryLabel, isCleaningCategory } from "@/lib/constants";
import { formatDeliveryShort } from "@/lib/delivery-display";
import { formatKobo } from "@/lib/format";
import {
  canQuickAdd,
  cataloguePiecePriceKobo,
  defaultSize,
  defaultVariant,
  productMainImage,
  productVideoUrl,
} from "@/lib/product-helpers";
import type { Product } from "@/lib/types";

function CardHoverVideo({ src, title }: { src: string; title: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  return (
    <span
      className="absolute inset-0 block"
      onMouseEnter={() => {
        const el = ref.current;
        if (!el) return;
        void el.play().catch(() => {});
      }}
      onMouseLeave={() => {
        const el = ref.current;
        if (!el) return;
        el.pause();
        el.currentTime = 0;
      }}
    >
      <video
        ref={ref}
        src={src}
        title={title}
        className="h-full w-full object-cover transition group-hover:scale-[1.02]"
        muted
        playsInline
        loop
        preload="metadata"
      />
    </span>
  );
}

export function ProductCard({ product }: { product: Product }) {
  const unitKobo = cataloguePiecePriceKobo(product);
  const variant = defaultVariant(product);
  const image = productMainImage(product);
  const video = productVideoUrl(product);
  const size = defaultSize(product);
  const cleaning = isCleaningCategory(product.category);

  function handleQuickAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!canQuickAdd(product) || !variant) {
      message.error("This product is not available to add yet");
      return;
    }
    addToCart({
      productId: product.id,
      title: product.title,
      variant,
      size: cleaning ? undefined : size,
      unit: "piece",
      quantity: 1,
      imageUrl: image,
    });
    dispatchCartUpdated();
    message.success("Added to cart");
  }

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-hek-primary/15 bg-white shadow-sm transition hover:shadow-md">
      <Link href={`/store/${product.id}`} className="relative block aspect-4/3 bg-hek-bg">
        {video ? (
          <CardHoverVideo src={video} title={product.title} />
        ) : image ? (
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
        <Link
          href={`/store/${product.id}`}
          className="font-serif text-lg leading-snug text-hek-ink hover:text-hek-primary"
        >
          {product.title}
        </Link>
        <p className="line-clamp-2 text-sm text-hek-muted">{product.description}</p>
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div>
            {unitKobo != null ? (
              <p className="text-base font-semibold text-hek-primary">
                from {formatKobo(unitKobo)}
              </p>
            ) : (
              <p className="text-sm text-hek-muted">See details for price</p>
            )}
            <p className="text-xs text-hek-muted">
              {cleaning ? "Piece" : size ? `${size} · piece` : "Piece"}
              {" · "}
              {formatDeliveryShort()}
            </p>
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

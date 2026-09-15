"use client";

import Image from "next/image";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import { Button, Modal } from "antd";
import { useCallback, useEffect, useState } from "react";

type GalleryItem = {
  src: string;
  label?: string;
};

type Props = {
  items: GalleryItem[];
  title: string;
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
};

const MAIN_MAX_W = 440;
const MAIN_HEIGHT = "min(480px, 55vh)";

export function ProductGallery({ items, title, selectedIndex, onSelectIndex }: Props) {
  const images = items.map((it) => it.src);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const safeIndex = images.length ? Math.min(selectedIndex, images.length - 1) : 0;
  const main = images[safeIndex];

  const openLightbox = useCallback((index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  }, []);

  useEffect(() => {
    if (!lightboxOpen || images.length === 0) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") {
        setLightboxIndex((i) => (i - 1 + images.length) % images.length);
      }
      if (e.key === "ArrowRight") {
        setLightboxIndex((i) => (i + 1) % images.length);
      }
      if (e.key === "Escape") setLightboxOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxOpen, images.length]);

  if (images.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-xl bg-hek-bg text-hek-muted"
        style={{ width: "100%", maxWidth: MAIN_MAX_W, height: MAIN_HEIGHT }}
      >
        No images
      </div>
    );
  }

  return (
    <>
      <div className="flex w-full max-w-120 flex-col gap-3 md:flex-row">
        <div className="flex flex-row gap-2 overflow-x-auto md:max-h-120 md:w-20 md:flex-col md:overflow-y-auto md:overflow-x-hidden">
          {items.map((item, i) => (
            <button
              key={`${item.label ?? "img"}-${item.src}-${i}`}
              type="button"
              onClick={() => onSelectIndex(i)}
              aria-label={item.label ? `Color ${item.label}` : `Image ${i + 1}`}
              title={item.label}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 bg-hek-bg md:h-20 md:w-20 ${
                i === safeIndex
                  ? "border-hek-primary ring-2 ring-hek-primary/30"
                  : "border-transparent opacity-80 hover:border-hek-primary/40 hover:opacity-100"
              }`}
            >
              <Image src={item.src} alt="" fill className="object-contain p-0.5" sizes="80px" />
            </button>
          ))}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <button
            type="button"
            onClick={() => openLightbox(safeIndex)}
            className="relative mx-auto w-full cursor-zoom-in overflow-hidden rounded-xl border border-hek-primary/10 bg-hek-bg"
            style={{ maxWidth: MAIN_MAX_W, height: MAIN_HEIGHT }}
          >
            <Image
              src={main}
              alt={title}
              fill
              className="object-contain p-3"
              sizes={`${MAIN_MAX_W}px`}
              priority
            />
          </button>
          <p className="text-center text-xs text-hek-muted">Click image to view full size</p>
        </div>
      </div>

      <Modal
        open={lightboxOpen}
        footer={null}
        closable
        centered
        width="min(960px, 96vw)"
        onCancel={() => setLightboxOpen(false)}
        styles={{ body: { padding: 0, background: "#000" } }}
      >
        <div className="relative flex min-h-[50vh] items-center justify-center bg-black">
          {images.length > 1 ? (
            <>
              <Button
                type="text"
                aria-label="Previous image"
                icon={<LeftOutlined className="text-white!" />}
                className="absolute! left-2 top-1/2 z-10 -translate-y-1/2"
                onClick={() => setLightboxIndex((i) => (i - 1 + images.length) % images.length)}
              />
              <Button
                type="text"
                aria-label="Next image"
                icon={<RightOutlined className="text-white!" />}
                className="absolute! right-2 top-1/2 z-10 -translate-y-1/2"
                onClick={() => setLightboxIndex((i) => (i + 1) % images.length)}
              />
            </>
          ) : null}
          <div className="relative h-[70vh] w-full">
            <Image
              src={images[lightboxIndex]}
              alt={title}
              fill
              className="object-contain"
              sizes="96vw"
            />
          </div>
        </div>
      </Modal>
    </>
  );
}

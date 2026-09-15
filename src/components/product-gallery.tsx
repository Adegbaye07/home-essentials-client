"use client";

import Image from "next/image";
import { LeftOutlined, RightOutlined, PlayCircleOutlined } from "@ant-design/icons";
import { Button, Modal } from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";

type GalleryItem = {
  src: string;
  label?: string;
};

type Props = {
  items: GalleryItem[];
  title: string;
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
  /** When set, authenticity video is the default primary media (muted autoplay). */
  videoUrl?: string;
};

const MAIN_MAX_W = 440;
const MAIN_HEIGHT = "min(480px, 55vh)";
const VIDEO_THUMB_KEY = "__video__";

export function ProductGallery({
  items,
  title,
  selectedIndex,
  onSelectIndex,
  videoUrl,
}: Props) {
  const images = items.map((it) => it.src);
  const hasVideo = Boolean(videoUrl?.trim());
  const [showVideo, setShowVideo] = useState(hasVideo);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    setShowVideo(hasVideo);
  }, [hasVideo, videoUrl]);

  const safeIndex = images.length ? Math.min(selectedIndex, images.length - 1) : 0;
  const mainImage = images[safeIndex];

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

  const thumbItems = useMemo(() => {
    const list: { key: string; kind: "video" | "image"; src?: string; label?: string; index?: number }[] =
      [];
    if (hasVideo && videoUrl) {
      list.push({ key: VIDEO_THUMB_KEY, kind: "video", src: videoUrl, label: "Video" });
    }
    items.forEach((item, i) => {
      list.push({
        key: `${item.label ?? "img"}-${item.src}-${i}`,
        kind: "image",
        src: item.src,
        label: item.label,
        index: i,
      });
    });
    return list;
  }, [hasVideo, videoUrl, items]);

  if (!hasVideo && images.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-xl bg-hek-bg text-hek-muted"
        style={{ width: "100%", maxWidth: MAIN_MAX_W, height: MAIN_HEIGHT }}
      >
        No images
      </div>
    );
  }

  const videoSelected = hasVideo && showVideo;
  const imageSelected = !videoSelected && images.length > 0;

  return (
    <>
      <div className="flex w-full max-w-120 flex-col gap-3 md:flex-row">
        <div className="flex flex-row gap-2 overflow-x-auto md:max-h-120 md:w-20 md:flex-col md:overflow-y-auto md:overflow-x-hidden">
          {thumbItems.map((thumb) => {
            const selected =
              thumb.kind === "video" ? videoSelected : imageSelected && thumb.index === safeIndex;
            return (
              <button
                key={thumb.key}
                type="button"
                onClick={() => {
                  if (thumb.kind === "video") {
                    setShowVideo(true);
                    return;
                  }
                  setShowVideo(false);
                  if (thumb.index != null) onSelectIndex(thumb.index);
                }}
                aria-label={
                  thumb.kind === "video"
                    ? "Authenticity video"
                    : thumb.label
                      ? `Color ${thumb.label}`
                      : `Image ${(thumb.index ?? 0) + 1}`
                }
                title={thumb.kind === "video" ? "Authenticity video" : thumb.label}
                className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 bg-hek-bg md:h-20 md:w-20 ${
                  selected
                    ? "border-hek-primary ring-2 ring-hek-primary/30"
                    : "border-transparent opacity-80 hover:border-hek-primary/40 hover:opacity-100"
                }`}
              >
                {thumb.kind === "video" ? (
                  <span className="flex h-full w-full flex-col items-center justify-center gap-0.5 bg-neutral-900 text-white">
                    <PlayCircleOutlined className="text-lg" />
                    <span className="text-[10px] font-medium uppercase tracking-wide">Video</span>
                  </span>
                ) : (
                  <Image
                    src={thumb.src!}
                    alt=""
                    fill
                    className="object-contain p-0.5"
                    sizes="80px"
                  />
                )}
              </button>
            );
          })}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          {videoSelected && videoUrl ? (
            <div
              className="relative mx-auto w-full overflow-hidden rounded-xl border border-hek-primary/10 bg-black"
              style={{ maxWidth: MAIN_MAX_W, height: MAIN_HEIGHT }}
            >
              <video
                key={videoUrl}
                src={videoUrl}
                className="absolute inset-0 h-full w-full object-contain"
                muted
                playsInline
                autoPlay
                loop
                controls
              />
            </div>
          ) : imageSelected && mainImage ? (
            <button
              type="button"
              onClick={() => openLightbox(safeIndex)}
              className="relative mx-auto w-full cursor-zoom-in overflow-hidden rounded-xl border border-hek-primary/10 bg-hek-bg"
              style={{ maxWidth: MAIN_MAX_W, height: MAIN_HEIGHT }}
            >
              <Image
                src={mainImage}
                alt={title}
                fill
                className="object-contain p-3"
                sizes={`${MAIN_MAX_W}px`}
                priority
              />
            </button>
          ) : (
            <div
              className="flex items-center justify-center rounded-xl bg-hek-bg text-hek-muted"
              style={{ maxWidth: MAIN_MAX_W, height: MAIN_HEIGHT }}
            >
              No images
            </div>
          )}
          <p className="text-center text-xs text-hek-muted">
            {videoSelected
              ? "Authenticity video"
              : images.length > 0
                ? "Click image to view full size"
                : null}
          </p>
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

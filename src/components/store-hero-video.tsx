"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Append public video URLs here to extend the hero queue. */
export const HERO_VIDEOS = [
  "https://eswnyjnxqymxyzwbcxwu.supabase.co/storage/v1/object/public/kamgol/hero-videos/hero-web.mp4",
  "https://eswnyjnxqymxyzwbcxwu.supabase.co/storage/v1/object/public/kamgol/hero-videos/hero-2-web.MP4",
  "https://eswnyjnxqymxyzwbcxwu.supabase.co/storage/v1/object/public/kamgol/hero-videos/hero-3-web.MP4",
] as const;

export function StoreHeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [index, setIndex] = useState(0);
  const src = HERO_VIDEOS[index] ?? HERO_VIDEOS[0];

  const playCurrent = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = true;
    void el.play().catch(() => {
      // Autoplay can be blocked until user gesture; muted usually allows it.
    });
  }, []);

  useEffect(() => {
    playCurrent();
  }, [src, playCurrent]);

  function handleEnded() {
    setIndex((i) => (i + 1) % HERO_VIDEOS.length);
  }

  const nextSrc = HERO_VIDEOS[(index + 1) % HERO_VIDEOS.length];

  return (
    <>
      <video
        key={src}
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        src={src}
        autoPlay
        muted
        playsInline
        preload="auto"
        onEnded={handleEnded}
        onLoadedData={playCurrent}
        aria-hidden
      />
      {/* Warm the next clip so the queue switch is smoother */}
      {nextSrc !== src ? (
        <video
          className="hidden"
          src={nextSrc}
          muted
          preload="auto"
          aria-hidden
        />
      ) : null}
    </>
  );
}

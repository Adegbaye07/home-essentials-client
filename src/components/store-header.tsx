"use client";

import Link from "next/link";
import { ShoppingCartOutlined } from "@ant-design/icons";
import { Badge } from "antd";
import { useEffect, useState } from "react";

import { cartLineCount, readCart } from "@/lib/cart";
import { CART_STORAGE_KEY } from "@/lib/constants";
import { brand } from "@/lib/brand";

const SCROLL_THRESHOLD = 28;

type Props = {
  active?: "store" | "cart" | "track" | "contact";
  /** When true, header starts transparent and content can scroll beneath it until the user scrolls. */
  overlay?: boolean;
};

export function StoreHeader({ active, overlay = false }: Props) {
  const [lineCount, setLineCount] = useState(0);
  const [scrolled, setScrolled] = useState(!overlay);

  useEffect(() => {
    function sync() {
      setLineCount(cartLineCount(readCart()));
    }
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener(CART_STORAGE_KEY, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(CART_STORAGE_KEY, sync);
    };
  }, []);

  useEffect(() => {
    if (!overlay) {
      setScrolled(true);
      return;
    }
    function onScroll() {
      setScrolled(window.scrollY > SCROLL_THRESHOLD);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [overlay]);

  const solid = !overlay || scrolled;

  const headerFg = solid ? "#ffffff" : brand.primary;
  const headerHoverBg = solid ? "rgba(255, 255, 255, 0.1)" : "rgba(111, 78, 55, 0.12)";

  const headerStyle = {
    ["--store-header-fg" as string]: headerFg,
    ["--store-header-hover-bg" as string]: headerHoverBg,
    backgroundColor: solid ? "rgba(28, 25, 23, 0.92)" : "transparent",
  };

  const navLinkClass = (key: typeof active) => {
    const isActive = key === active;
    const base =
      "store-header-interactive store-header-link inline-flex items-center rounded-full px-3 py-1.5 no-underline";
    if (solid) {
      return `${base}${isActive ? " bg-white/15" : ""}`;
    }
    return `${base}${isActive ? " bg-hek-primary/10" : ""}`;
  };

  const logoClass =
    "store-header-logo font-serif text-xl tracking-wide no-underline transition-colors duration-300 sm:text-2xl";

  const cartIconColor = solid ? "#ffffff" : brand.primary;

  return (
    <>
      <header
        data-store-header
        style={headerStyle}
        className={`fixed inset-x-0 top-0 z-50 border-b px-4 py-3 transition-[background-color,border-color,box-shadow,color] duration-300 sm:px-6 ${
          solid ? "border-white/10 shadow-sm backdrop-blur-md" : "border-transparent"
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <Link href="/store" className={`${logoClass} transition-colors duration-300`}>
            Home Essentials by Kamgol
          </Link>
          <nav className="flex items-center gap-1 text-sm sm:gap-2 sm:text-base">
            <Link href="/store" className={navLinkClass("store")}>
              Shop
            </Link>
            <Link href="/track" className={navLinkClass("track")}>
              Track
            </Link>
            <Link href="/contact" className={navLinkClass("contact")}>
              Contact
            </Link>
            <Link
              href="/cart"
              aria-label="Cart"
              className={`store-header-interactive relative ml-1 flex h-10 w-10 items-center justify-center rounded-full no-underline sm:ml-2 ${
                active === "cart"
                  ? solid
                    ? "bg-white/15"
                    : "bg-hek-primary/10"
                  : ""
              }`}
            >
              <Badge
                count={lineCount}
                size="small"
                offset={[-2, 2]}
                color="#c4956a"
                showZero={false}
              >
                <ShoppingCartOutlined
                  style={{ fontSize: 22, color: cartIconColor }}
                  aria-hidden
                />
              </Badge>
            </Link>
          </nav>
        </div>
      </header>
      {!overlay ? <div aria-hidden className="h-14.25 shrink-0 sm:h-15.25" /> : null}
    </>
  );
}

export function dispatchCartUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(CART_STORAGE_KEY));
  }
}

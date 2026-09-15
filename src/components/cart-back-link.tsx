"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { cartBackLink } from "@/lib/cart-return";

export function CartBackLink() {
  const searchParams = useSearchParams();
  const from = searchParams.get("from");
  const { href, label } = cartBackLink(from);

  return (
    <Link href={href} className="mt-2 inline-block text-sm text-hek-primary hover:underline">
      {label}
    </Link>
  );
}

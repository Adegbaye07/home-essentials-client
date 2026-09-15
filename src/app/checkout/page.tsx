"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Legacy route — checkout lives on /cart. */
export default function CheckoutRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/cart");
  }, [router]);

  return null;
}

"use client";

import { Suspense } from "react";
import CheckoutSuccessInner from "./success-inner";

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutSuccessInner />
    </Suspense>
  );
}

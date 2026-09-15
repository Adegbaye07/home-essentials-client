/** Allowed cart back targets (avoid open redirects). */
export function safeCartReturnPath(from: string | null | undefined): string | null {
  if (!from) return null;
  const path = from.trim();
  if (!path.startsWith("/") || path.startsWith("//")) return null;
  if (path === "/store" || path.startsWith("/store/")) return path;
  return null;
}

export function cartBackLink(from: string | null | undefined): { href: string; label: string } {
  const safe = safeCartReturnPath(from);
  if (safe && safe !== "/store") {
    return { href: safe, label: "← Back to product" };
  }
  return { href: "/store", label: "← Back to shop" };
}

export function cartHrefWithReturn(returnTo: string): string {
  return `/cart?from=${encodeURIComponent(returnTo)}`;
}

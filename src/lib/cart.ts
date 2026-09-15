import { CART_STORAGE_KEY } from "./constants";
import type { CartLine, OrderUnit } from "./types";

function lineKey(line: Pick<CartLine, "productId" | "variant" | "size" | "unit">): string {
  return `${line.productId}|${line.variant}|${line.size ?? ""}|${line.unit}`;
}

export function readCart(): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartLine[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (l) =>
        l &&
        typeof l.productId === "string" &&
        typeof l.variant === "string" &&
        typeof l.unit === "string" &&
        typeof l.quantity === "number",
    );
  } catch {
    return [];
  }
}

export function writeCart(lines: CartLine[]): void {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(lines));
}

export function addToCart(line: CartLine): CartLine[] {
  const cart = readCart();
  const key = lineKey(line);
  const idx = cart.findIndex((l) => lineKey(l) === key);
  if (idx >= 0) {
    cart[idx] = { ...cart[idx], quantity: cart[idx].quantity + line.quantity };
  } else {
    cart.push(line);
  }
  writeCart(cart);
  return cart;
}

export function removeCartLine(index: number): CartLine[] {
  const cart = readCart();
  if (index < 0 || index >= cart.length) return cart;
  cart.splice(index, 1);
  writeCart(cart);
  return cart;
}

export function updateCartLineQuantity(index: number, quantity: number): CartLine[] {
  const cart = readCart();
  if (index < 0 || index >= cart.length) return cart;
  if (quantity < 1) {
    cart.splice(index, 1);
  } else {
    cart[index] = { ...cart[index], quantity };
  }
  writeCart(cart);
  return cart;
}

export function updateCartLineVariant(
  index: number,
  newVariant: string,
  imageUrl?: string,
): CartLine[] {
  const cart = readCart();
  if (index < 0 || index >= cart.length) return cart;
  const line = cart[index];
  const next = { ...line, variant: newVariant, imageUrl: imageUrl ?? line.imageUrl };
  const mergeIdx = cart.findIndex((l, i) => i !== index && lineKey(l) === lineKey(next));
  if (mergeIdx >= 0) {
    cart[mergeIdx] = {
      ...cart[mergeIdx],
      quantity: cart[mergeIdx].quantity + line.quantity,
      imageUrl: imageUrl ?? cart[mergeIdx].imageUrl,
    };
    cart.splice(index, 1);
  } else {
    cart[index] = next;
  }
  writeCart(cart);
  return cart;
}

export function updateCartLineSize(index: number, newSize: string): CartLine[] {
  const cart = readCart();
  if (index < 0 || index >= cart.length) return cart;
  const line = cart[index];
  const next = { ...line, size: newSize };
  const mergeIdx = cart.findIndex((l, i) => i !== index && lineKey(l) === lineKey(next));
  if (mergeIdx >= 0) {
    cart[mergeIdx] = {
      ...cart[mergeIdx],
      quantity: cart[mergeIdx].quantity + line.quantity,
    };
    cart.splice(index, 1);
  } else {
    cart[index] = next;
  }
  writeCart(cart);
  return cart;
}

export function updateCartLineUnit(
  index: number,
  newUnit: OrderUnit,
  piecesPerBundle?: number,
): CartLine[] {
  const cart = readCart();
  if (index < 0 || index >= cart.length) return cart;
  const line = cart[index];
  const next: CartLine = {
    ...line,
    unit: newUnit,
    piecesPerBundle: newUnit === "bundle" ? piecesPerBundle : undefined,
  };
  const mergeIdx = cart.findIndex((l, i) => i !== index && lineKey(l) === lineKey(next));
  if (mergeIdx >= 0) {
    cart[mergeIdx] = {
      ...cart[mergeIdx],
      quantity: cart[mergeIdx].quantity + line.quantity,
      piecesPerBundle: next.piecesPerBundle ?? cart[mergeIdx].piecesPerBundle,
    };
    cart.splice(index, 1);
  } else {
    cart[index] = next;
  }
  writeCart(cart);
  return cart;
}

export function clearCart(): void {
  localStorage.removeItem(CART_STORAGE_KEY);
}

export function cartCount(lines: CartLine[]): number {
  return lines.reduce((n, l) => n + l.quantity, 0);
}

export function cartLineCount(lines: CartLine[]): number {
  return lines.length;
}

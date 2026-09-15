import { CART_STORAGE_KEY } from "./constants";
import type { CartLine } from "./types";

export function readCart(): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartLine[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeCart(lines: CartLine[]): void {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(lines));
}

export function addToCart(line: CartLine): CartLine[] {
  const cart = readCart();
  const idx = cart.findIndex(
    (l) =>
      l.productId === line.productId && l.size === line.size && l.color === line.color,
  );
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

/** @deprecated use updateCartLineQuantity */
export function updateCartLine(index: number, quantity: number): CartLine[] {
  return updateCartLineQuantity(index, quantity);
}

export function updateCartLineColor(index: number, newColor: string, imageUrl?: string): CartLine[] {
  const cart = readCart();
  if (index < 0 || index >= cart.length) return cart;
  const line = cart[index];
  const mergeIdx = cart.findIndex(
    (l, i) =>
      i !== index &&
      l.productId === line.productId &&
      l.size === line.size &&
      l.color === newColor,
  );
  if (mergeIdx >= 0) {
    cart[mergeIdx] = {
      ...cart[mergeIdx],
      quantity: cart[mergeIdx].quantity + line.quantity,
      imageUrl: imageUrl ?? cart[mergeIdx].imageUrl,
    };
    cart.splice(index, 1);
  } else {
    cart[index] = {
      ...line,
      color: newColor,
      imageUrl: imageUrl ?? line.imageUrl,
    };
  }
  writeCart(cart);
  return cart;
}

export function updateCartLineSize(index: number, newSize: string): CartLine[] {
  const cart = readCart();
  if (index < 0 || index >= cart.length) return cart;
  const line = cart[index];
  if (line.size === newSize) return cart;

  const mergeIdx = cart.findIndex(
    (l, i) =>
      i !== index &&
      l.productId === line.productId &&
      l.size === newSize &&
      l.color === line.color,
  );
  if (mergeIdx >= 0) {
    cart[mergeIdx] = {
      ...cart[mergeIdx],
      quantity: cart[mergeIdx].quantity + line.quantity,
    };
    cart.splice(index, 1);
  } else {
    cart[index] = { ...line, size: newSize };
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

/** Distinct cart lines (badge / “items in cart”). */
export function cartLineCount(lines: CartLine[]): number {
  return lines.length;
}

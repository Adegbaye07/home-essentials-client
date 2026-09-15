import type { CreatedOrder, Paginated, Product, TrackResult } from "./types";

function baseURL(): string {
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (!base) throw new Error("NEXT_PUBLIC_API_URL is not set");
  return base.replace(/\/$/, "");
}

async function parseError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { error?: string };
    if (data.error) return data.error;
  } catch {
    // ignore
  }
  return res.statusText || "Request failed";
}

export async function listProducts(params?: {
  category?: string;
  page?: number;
  page_size?: number;
}): Promise<Paginated<Product>> {
  const search = new URLSearchParams();
  if (params?.category) search.set("category", params.category);
  if (params?.page !== undefined) search.set("page", String(params.page));
  if (params?.page_size !== undefined) search.set("page_size", String(params.page_size));
  const qs = search.toString();
  const res = await fetch(`${baseURL()}/api/v1/products${qs ? `?${qs}` : ""}`, { cache: "no-store" });
  if (!res.ok) throw new Error(await parseError(res));
  return (await res.json()) as Paginated<Product>;
}

export async function getProduct(id: string): Promise<Product> {
  const res = await fetch(`${baseURL()}/api/v1/products/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error(await parseError(res));
  return (await res.json()) as Product;
}

export async function createOrder(body: {
  items: { productId: string; size: string; color: string; quantity: number }[];
  customer: { name: string; email: string; phone: string; deliveryAddress: string };
}): Promise<CreatedOrder> {
  const res = await fetch(`${baseURL()}/api/v1/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return (await res.json()) as CreatedOrder;
}

export async function initializePayment(orderId: string): Promise<{ accessCode: string; reference: string }> {
  const res = await fetch(`${baseURL()}/api/v1/payments/initialize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return (await res.json()) as { accessCode: string; reference: string };
}

export type VerifyPaymentResult = {
  orderId: string;
  status: string;
  trackingNumber?: string;
  paystackStatus?: string;
  customerEmail: string;
};

export async function verifyPayment(reference: string): Promise<VerifyPaymentResult> {
  const res = await fetch(
    `${baseURL()}/api/v1/payments/verify?reference=${encodeURIComponent(reference)}`,
    { cache: "no-store" },
  );
  if (!res.ok) throw new Error(await parseError(res));
  return (await res.json()) as VerifyPaymentResult;
}

export async function abandonPayment(reference: string, email: string): Promise<void> {
  const res = await fetch(`${baseURL()}/api/v1/payments/abandon`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reference, email }),
  });
  if (!res.ok) throw new Error(await parseError(res));
}

export async function trackOrder(body: {
  trackingNumber: string;
  email: string;
}): Promise<TrackResult> {
  const res = await fetch(`${baseURL()}/api/v1/orders/track`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return (await res.json()) as TrackResult;
}

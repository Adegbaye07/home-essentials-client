import { config } from "./config";
import type { CreatedCustomOrder, CreatedOrder, Paginated, Product, TrackResult } from "./types";

function baseURL(): string {
  return config.apiUrl.replace(/\/$/, "");
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
  items: {
    productId: string;
    variant: string;
    size?: string;
    unit: string;
    quantity: number;
  }[];
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

export type CreateCustomOrderInput = {
  title: string;
  quantity: number;
  name: string;
  email: string;
  phone: string;
  deliveryAddress: string;
  sampleImage: File;
};

export async function createCustomOrder(input: CreateCustomOrderInput): Promise<CreatedCustomOrder> {
  const form = new FormData();
  form.set("title", input.title);
  form.set("quantity", String(input.quantity));
  form.set("name", input.name);
  form.set("email", input.email);
  form.set("phone", input.phone);
  form.set("deliveryAddress", input.deliveryAddress);
  form.set("sampleImage", input.sampleImage);

  const res = await fetch(`${baseURL()}/api/v1/orders/custom`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new Error(await parseError(res));
  return (await res.json()) as CreatedCustomOrder;
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

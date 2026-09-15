export type VariantImage = {
  variant: string;
  imageUrl: string;
};

export type SizePricing = {
  size: string;
  piecePriceKobo: number;
  bundlePriceKobo: number;
  piecesPerBundle: number;
};

export type CleaningPricing = {
  piecePriceKobo: number;
  dozenPriceKobo: number;
};

export type Product = {
  id: string;
  title: string;
  description: string;
  category: string;
  variants: string[];
  variantImages: VariantImage[];
  sizePricings?: SizePricing[];
  cleaningPricing?: CleaningPricing | null;
  active: boolean;
};

export type OrderUnit = "piece" | "bundle" | "dozen";

export type ListMetadata = {
  total_items: number;
  current_items: number;
  current_page: number;
  last_page: number;
  next_page: number | null;
  previous_page: number | null;
  has_next_page: boolean;
  has_previous_page: boolean;
};

export type Paginated<T> = {
  items: T[];
  metadata: ListMetadata;
};

export type CartLine = {
  productId: string;
  title: string;
  variant: string;
  size?: string;
  unit: OrderUnit;
  piecesPerBundle?: number;
  quantity: number;
  imageUrl?: string;
};

export type CreatedOrder = {
  id: string;
  totalAmountKobo: number;
  paystackReference: string;
  status: string;
  trackingNumber?: string;
};

export type TrackResult = {
  trackingNumber: string;
  status: string;
  statusHistory: { status: string; at: string; note?: string }[];
  totalAmountKobo: number;
  items?: {
    productTitle: string;
    variant: string;
    size?: string;
    unit: string;
    piecesPerBundle?: number;
    quantity: number;
    unitPriceKobo: number;
    lineTotalKobo: number;
  }[];
};

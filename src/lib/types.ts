export type QtyTier = {
  minQty: number;
  maxQty?: number;
  unitPriceKobo: number;
  deliveryDays: number;
};

export type SizeVariant = {
  code: string;
  tiers: QtyTier[];
};

export type ColorImage = {
  color: string;
  imageUrl: string;
};

export type Product = {
  id: string;
  title: string;
  description: string;
  category: string;
  colors: string[];
  colorImages: ColorImage[];
  active: boolean;
  sizes: SizeVariant[];
};

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
  size: string;
  color: string;
  quantity: number;
  imageUrl?: string;
};

export type CreatedOrder = {
  id: string;
  totalAmountKobo: number;
  paystackReference: string;
  status: string;
};

export type TrackResult = {
  trackingNumber: string;
  status: string;
  statusHistory: { status: string; at: string; note?: string }[];
  totalAmountKobo: number;
};

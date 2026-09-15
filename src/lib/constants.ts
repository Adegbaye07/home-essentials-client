/** Store categories for Home Essentials by Kamgol. */
const CATEGORY_BY_VALUE = {
  foot_mats: "Foot mats",
  door_mats: "Door mats",
  center_mats: "Center mats",
  rugs: "Rugs",
  cleaning_essentials: "Cleaning essentials",
} as const;

export type CategoryValue = keyof typeof CATEGORY_BY_VALUE;

export const STORE_TAB_CATEGORIES: { value: CategoryValue; label: string }[] = [
  { value: "foot_mats", label: CATEGORY_BY_VALUE.foot_mats },
  { value: "door_mats", label: CATEGORY_BY_VALUE.door_mats },
  { value: "center_mats", label: CATEGORY_BY_VALUE.center_mats },
  { value: "rugs", label: CATEGORY_BY_VALUE.rugs },
  { value: "cleaning_essentials", label: CATEGORY_BY_VALUE.cleaning_essentials },
];

export const CATEGORIES = STORE_TAB_CATEGORIES;

export const CLEANING_CATEGORY: CategoryValue = "cleaning_essentials";

export function isCleaningCategory(category: string | undefined): boolean {
  return category === CLEANING_CATEGORY;
}

export function categoryLabel(value: string): string {
  if (value in CATEGORY_BY_VALUE) {
    return CATEGORY_BY_VALUE[value as CategoryValue];
  }
  return value;
}

/** Fixed delivery copy (not a product field). */
export const DELIVERY_COPY = "1–3 business days (Mon–Sat)";

export const CART_STORAGE_KEY = "home_essentials_cart_v2";

export const UNLIMITED_ORDER_QTY = 999;

export const DOZEN_PIECE_COUNT = 12;

export const ORDER_STATUSES = [
  { value: "pending_payment", label: "Pending payment" },
  { value: "abandoned", label: "Abandoned" },
  { value: "paid", label: "Paid" },
  { value: "packing", label: "Packing" },
  { value: "in_transit", label: "In transit" },
  { value: "delivered", label: "Delivered" },
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number]["value"];

const LEGACY_STATUS_LABELS: Record<string, string> = {
  processing: "Packing",
  shipped: "In transit",
  cancelled: "Cancelled",
  created: "Created",
  rejected: "Rejected",
};

export function normalizeOrderStatus(status: OrderStatus | string): OrderStatus | string {
  if (status === "processing") return "packing";
  if (status === "shipped") return "in_transit";
  return status;
}

export function orderStatusLabel(status: OrderStatus | string): string {
  const legacy = LEGACY_STATUS_LABELS[status];
  if (legacy) return legacy;
  const normalized = normalizeOrderStatus(status);
  return ORDER_STATUSES.find((s) => s.value === normalized)?.label ?? String(status);
}

export function orderStatusColor(status: OrderStatus | string): string {
  const s = normalizeOrderStatus(status);
  switch (s) {
    case "pending_payment":
      return "gold";
    case "abandoned":
      return "default";
    case "paid":
      return "blue";
    case "packing":
      return "cyan";
    case "in_transit":
      return "purple";
    case "delivered":
      return "green";
    case "created":
      return "orange";
    case "rejected":
      return "red";
    default:
      return "default";
  }
}

export function unitDisplayLabel(unit: string, piecesPerBundle?: number): string {
  if (unit === "bundle" && piecesPerBundle && piecesPerBundle > 0) {
    return `Bundle of ${piecesPerBundle}`;
  }
  if (unit === "dozen") return `Dozen (${DOZEN_PIECE_COUNT})`;
  if (unit === "piece") return "Piece";
  return unit;
}

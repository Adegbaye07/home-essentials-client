/** All categories for labels and lookups (order does not matter). */
const CATEGORY_BY_VALUE = {
  cross_body: "Cross body bags",
  hobo: "Hobo bags",
  duffel: "Duffel bags",
  male_toilet: "Male toilet bags",
  school: "School bags",
  travel: "Traveling bags",
  laptop: "Laptop bags",
  purse: "Purse",
  clutch: "Clutch bags",
  tote: "Tote bags",
  shoulder: "Shoulder bags",
  shopping: "Shopping bags",
  rope: "Rope bags",
  satchel: "Satchels bags",
  jute: "Jute bags",
  lunch_box: "Lunch boxes",
  waist_purse: "Waist purses",
  folder: "Folder bags",
  pencil_case: "Pencil cases",
  hand_bag: "Hand bags",
  flap_bag: "Flap bags",
} as const;

export type CategoryValue = keyof typeof CATEGORY_BY_VALUE;

/** Store shop tabs: popular bag types first, niche categories last. */
export const STORE_TAB_CATEGORIES: { value: CategoryValue; label: string }[] = [
  { value: "hand_bag", label: CATEGORY_BY_VALUE.hand_bag },
  { value: "tote", label: CATEGORY_BY_VALUE.tote },
  { value: "shoulder", label: CATEGORY_BY_VALUE.shoulder },
  { value: "cross_body", label: CATEGORY_BY_VALUE.cross_body },
  { value: "flap_bag", label: CATEGORY_BY_VALUE.flap_bag },
  { value: "satchel", label: CATEGORY_BY_VALUE.satchel },
  { value: "clutch", label: CATEGORY_BY_VALUE.clutch },
  { value: "hobo", label: CATEGORY_BY_VALUE.hobo },
  { value: "purse", label: CATEGORY_BY_VALUE.purse },
  { value: "shopping", label: CATEGORY_BY_VALUE.shopping },
  { value: "travel", label: CATEGORY_BY_VALUE.travel },
  { value: "school", label: CATEGORY_BY_VALUE.school },
  { value: "laptop", label: CATEGORY_BY_VALUE.laptop },
  { value: "duffel", label: CATEGORY_BY_VALUE.duffel },
  { value: "male_toilet", label: CATEGORY_BY_VALUE.male_toilet },
  { value: "rope", label: CATEGORY_BY_VALUE.rope },
  { value: "jute", label: CATEGORY_BY_VALUE.jute },
  { value: "waist_purse", label: CATEGORY_BY_VALUE.waist_purse },
  { value: "lunch_box", label: CATEGORY_BY_VALUE.lunch_box },
  { value: "folder", label: CATEGORY_BY_VALUE.folder },
  { value: "pencil_case", label: CATEGORY_BY_VALUE.pencil_case },
];

/** @deprecated Use STORE_TAB_CATEGORIES on the store page; kept for any code that iterates all categories. */
export const CATEGORIES = STORE_TAB_CATEGORIES;

const LEGACY_CATEGORY_LABELS: Record<string, string> = {
  mens: "Men's",
};

export function categoryLabel(value: string): string {
  if (value in CATEGORY_BY_VALUE) {
    return CATEGORY_BY_VALUE[value as CategoryValue];
  }
  return LEGACY_CATEGORY_LABELS[value] ?? value;
}

export const SIZES = ["S", "M", "L", "XL", "XXL"] as const;

export type SizeCode = (typeof SIZES)[number];

const SIZE_LABELS: Record<SizeCode, string> = {
  S: "Small",
  M: "Medium",
  L: "Large",
  XL: "Extra large",
  XXL: "Extra extra large",
};

/** User-facing size name (cart/API still use the code). */
export function sizeDisplayLabel(code: string): string {
  if (code in SIZE_LABELS) return SIZE_LABELS[code as SizeCode];
  return code;
}

export const CART_STORAGE_KEY = "home_essentials_cart_v1";

/** All order statuses (matches admin). */
export const ORDER_STATUSES = [
  { value: "created", label: "Created" },
  { value: "pending_payment", label: "Pending payment" },
  { value: "abandoned", label: "Abandoned" },
  { value: "rejected", label: "Rejected" },
  { value: "paid", label: "Paid" },
  { value: "packing", label: "Packing" },
  { value: "in_transit", label: "In transit" },
  { value: "delivered", label: "Delivered" },
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number]["value"];

export type OrderType = "shop" | "custom";

const LEGACY_STATUS_LABELS: Record<string, string> = {
  processing: "Packing",
  shipped: "In transit",
  cancelled: "Cancelled",
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
    case "created":
      return "orange";
    case "pending_payment":
      return "gold";
    case "abandoned":
      return "default";
    case "rejected":
      return "red";
    case "paid":
      return "blue";
    case "packing":
      return "cyan";
    case "in_transit":
      return "purple";
    case "delivered":
      return "green";
    default:
      return "default";
  }
}

export type ListingCategory =
  | "electronics"
  | "home"
  | "books"
  | "fashion"
  | "services"
  | "rooms";

/** Majina ya makundi husomwa kwenye translations (t.categories). */
export const marketCategoryIds: (ListingCategory | "all")[] = [
  "all",
  "electronics",
  "home",
  "books",
  "fashion",
  "services",
  "rooms",
];

export const browseCategoryIds: (ListingCategory | "all")[] = [
  "electronics",
  "rooms",
  "books",
  "all",
];

export type MenuSlot = "breakfast" | "mains" | "sides" | "snacks" | "drinks";

/** Sekta za menyu husomwa kwenye translations (t.foodSlots). */
export const menuSlotIds: (MenuSlot | "all")[] = [
  "all",
  "breakfast",
  "mains",
  "sides",
  "snacks",
  "drinks",
];

export const menuSlots: MenuSlot[] = menuSlotIds.filter(
  (id): id is MenuSlot => id !== "all",
);

export type PromoTone = "blue" | "crimson" | "dark";

/** Muundo wa slaidi za carousel; maandishi yumo kwenye translations. */
export const marketPromoLayout: { href: string; tone: PromoTone }[] = [
  { href: "/market", tone: "blue" },
  { href: "/post", tone: "crimson" },
  { href: "/msosi", tone: "dark" },
];

export const formatTzs = (n: number) => `TSh ${n.toLocaleString("en-US")}`;
export const formatTzsShort = (n: number) => `TZS ${n.toLocaleString("en-US")}`;

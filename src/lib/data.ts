export type ListingCategory =
  | "electronics"
  | "home"
  | "books"
  | "fashion"
  | "rooms"
  | "services"
  | "phone_repair"
  | "barber"
  | "tailor"
  | "computer_repair"
  | "cleaning"
  | "electrical"
  | "mechanic"
  | "printing"
  | "laundry"
  | "tutoring"
  | "beauty"
  | "accounting";

/**
 * Kila moja ya hizi ni thamani huru ya `listings.category` (safu haina CHECK),
 * kwa hivyo kuongeza aina mpya hakuhitaji mabadiliko ya hifadhidata.
 */
export const goodsCategoryIds: ListingCategory[] = [
  "electronics",
  "home",
  "books",
  "fashion",
];

export const serviceCategoryIds: ListingCategory[] = [
  "phone_repair",
  "barber",
  "tailor",
  "computer_repair",
  "electrical",
  "mechanic",
  "printing",
  "laundry",
  "cleaning",
  "tutoring",
  "beauty",
  "accounting",
  "services",
];

export const roomCategoryIds: ListingCategory[] = ["rooms"];

export type CategoryGroup = "goods" | "services" | "rooms";

export const categoryGroup = (category: string): CategoryGroup =>
  serviceCategoryIds.includes(category as ListingCategory)
    ? "services"
    : category === "rooms"
      ? "rooms"
      : "goods";

/** Majina ya makundi husomwa kwenye translations (t.categories). */
export const marketCategoryIds: (ListingCategory | "all")[] = [
  "all",
  ...goodsCategoryIds,
];

/** Vichujio chini ya kichwa cha "Sokoni"; "rooms" hubadilisha tabu. */
export const browseCategoryIds: ListingCategory[] = [
  ...goodsCategoryIds,
  "rooms",
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

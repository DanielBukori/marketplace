import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type {
  Ad,
  AdPlacement,
  AdPlan,
  Announcement,
  Business,
  DeliveryZone,
  Listing,
  MenuItem,
  Offer,
  Order,
  Payout,
  Profile,
  Review,
  SocialLink,
} from "@/lib/types";

/**
 * Supabase hurudisha kosa kama kitu kisicho cha `Error`. Next hukibadilisha
 * kuwa ujumbe usiosomeka (`{message: ..., details: ...}`) kwenye ukurasa wa
 * kosa, hivyo tunakitengeneza upya ili sababu halisi (mf. `fetch failed`)
 * ifike kwa mtumiaji na ukurasa uweze kuchagua maelekezo sahihi.
 */
type QueryError = {
  message?: unknown;
  details?: unknown;
  code?: unknown;
};

function queryError(error: QueryError): Error {
  const text = (value: unknown) =>
    typeof value === "string" ? value : value ? String(value) : "";
  const parts = [text(error?.message), text(error?.details), text(error?.code)]
    .filter(Boolean);
  return new Error(parts.join(" · ") || "Hifadhidata haikujibu");
}

const LISTING_FIELDS =
  "id, business_id, title, description, category, condition, price, is_negotiable, stock, status, photo_paths, whatsapp, location, view_count, rating_avg, rating_count, published_at, created_at, business:businesses(id, name, slug, whatsapp, phone, description, location, logo_path, is_verified, rating_avg, rating_count)";

const MENU_FIELDS =
  "id, business_id, name, description, price, slot, photo_path, is_available, rating_avg, rating_count, business:businesses(id, name, slug)";

const REVIEW_FIELDS =
  "id, business_id, author_id, order_id, menu_item_id, listing_id, rating, comment, is_hidden, created_at, author:profiles(id, full_name, avatar_path), menu_item:menu_items(name)";

/** Safu za oda ambazo zinaweza kusakishwa bila kupasuka kwenye miradi
 *  ambayo migration mpya bado haijatumika. */
const ORDER_FIELDS =
  "*, business:businesses(id, name, slug), items:order_items(*)";

export async function getActiveListings(
  category?: string | string[],
): Promise<Listing[]> {
  const supabase = await createClient();
  let query = supabase
    .from("listings")
    .select(LISTING_FIELDS)
    .eq("status", "active")
    .neq("stock", 0)
    .order("published_at", { ascending: false })
    .limit(120);

  if (Array.isArray(category)) {
    if (category.length > 0) query = query.in("category", category);
  } else if (category && category !== "all") {
    query = query.eq("category", category);
  }

  const { data, error } = await query;
  if (error) throw queryError(error);
  return (data ?? []) as unknown as Listing[];
}

export const getListing = cache(async function getListing(
  id: string,
): Promise<Listing | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .select(LISTING_FIELDS)
    .eq("id", id)
    .maybeSingle();

  if (error) throw queryError(error);
  return (data as unknown as Listing) ?? null;
});

export async function getActiveBusinesses(kind?: Business["kind"]): Promise<Business[]> {
  const supabase = await createClient();
  let query = supabase
    .from("businesses")
    .select("*")
    .eq("is_active", true)
    .order("name");

  if (kind) query = query.eq("kind", kind);

  const { data, error } = await query;
  if (error) throw queryError(error);
  return (data ?? []) as unknown as Business[];
}

export async function getMyBusinesses(userId: string): Promise<Business[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("owner_id", userId)
    .order("created_at");

  if (error) throw queryError(error);
  return (data ?? []) as unknown as Business[];
}

export async function getMyListings(businessIds: string[]): Promise<Listing[]> {
  if (businessIds.length === 0) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .select(LISTING_FIELDS)
    .in("business_id", businessIds)
    .order("created_at", { ascending: false });

  if (error) throw queryError(error);
  return (data ?? []) as unknown as Listing[];
}

export async function getMenuItems(ids: string[]): Promise<MenuItem[]> {
  if (ids.length === 0) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("menu_items")
    .select("id, business_id, name, description, price, slot, photo_path, is_available")
    .in("id", ids);

  if (error) throw queryError(error);
  return (data ?? []) as unknown as MenuItem[];
}

export async function getMyMenu(businessIds: string[]): Promise<MenuItem[]> {
  if (businessIds.length === 0) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("menu_items")
    .select(MENU_FIELDS)
    .in("business_id", businessIds)
    .order("created_at", { ascending: false });

  if (error) throw queryError(error);
  return (data ?? []) as unknown as MenuItem[];
}

export async function getMyPayouts(businessIds: string[]): Promise<Payout[]> {
  if (businessIds.length === 0) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payouts")
    .select("*, order:orders(id, reference, status, total)")
    .in("business_id", businessIds)
    .order("created_at", { ascending: false });

  if (error) throw queryError(error);
  return (data ?? []) as unknown as Payout[];
}

/** Foli ya msimamizi: malipo yanayosubiri kutumwa kwa wauzaji wote. */
export async function getPayoutQueue(): Promise<Payout[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payouts")
    .select("*, business:businesses(id, name, slug), order:orders(id, reference, status, total)")
    .in("status", ["queued", "processing", "failed"])
    .order("created_at", { ascending: true });

  if (error) throw queryError(error);
  return (data ?? []) as unknown as Payout[];
}

/** Orodha ya msimamizi: biashara zote, hai au zilizozimwa. */
export async function getAllBusinesses(): Promise<Business[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw queryError(error);
  return (data ?? []) as unknown as Business[];
}

const PROFILE_BASE_FIELDS = "id, full_name, phone, hall, avatar_path, is_admin, created_at";
const PROFILE_FIELDS = `${PROFILE_BASE_FIELDS}, courier_status, courier_requested_at, courier_approved_at`;

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient();
  const full = await supabase
    .from("profiles")
    .select(PROFILE_FIELDS)
    .eq("id", userId)
    .maybeSingle();

  // Migration ya upelekezaji bado haijatumika? Rudia swali bila safu hizo
  // ili kurasa zisishindwe na safu tu mbili zisizopo.
  if (!full.error) return (full.data ?? null) as Profile | null;

  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_BASE_FIELDS)
    .eq("id", userId)
    .maybeSingle();

  if (error) throw queryError(error);
  return (data ?? null) as Profile | null;
}

/** Habari zinazoonekana uani, mpya kwanza. */
export async function getAnnouncements(): Promise<Announcement[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .eq("published", true)
    .order("event_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) throw queryError(error);
  return (data ?? []) as Announcement[];
}

/** Orodha ya msimamizi: zote, zilizochapishwa na zisizochapishwa. */
export async function getAllAnnouncements(): Promise<Announcement[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(60);

  if (error) throw queryError(error);
  return (data ?? []) as Announcement[];
}

export async function getFoodBoard() {
  const businesses = await getActiveBusinesses("food");
  if (businesses.length === 0) return { businesses, menu: [] as MenuItem[] };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("menu_items")
    .select(MENU_FIELDS)
    .in("business_id", businesses.map((b) => b.id))
    .eq("is_available", true)
    .order("slot")
    .limit(400);

  if (error) throw queryError(error);
  return { businesses, menu: (data ?? []) as unknown as MenuItem[] };
}

export const getBusinessBySlug = cache(async function getBusinessBySlug(
  slug: string,
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw queryError(error);
  const business = data as unknown as Business | null;
  if (!business) return null;

  const [menu, listings, offers, reviews] = await Promise.all([
    supabase
      .from("menu_items")
      .select(MENU_FIELDS)
      .eq("business_id", business.id)
      .eq("is_available", true)
      .order("slot")
      .limit(100),
    supabase
      .from("listings")
      .select(LISTING_FIELDS)
      .eq("business_id", business.id)
      .eq("status", "active")
      .order("published_at", { ascending: false })
      .limit(60),
    supabase
      .from("offers")
      .select("*")
      .eq("business_id", business.id)
      .eq("is_active", true)
      .lte("starts_at", new Date().toISOString())
      .order("percent_off", { ascending: false })
      .limit(20),
    supabase
      .from("reviews")
      .select(REVIEW_FIELDS)
      .eq("business_id", business.id)
      .eq("is_hidden", false)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const menuError =
    menu.error ?? listings.error ?? offers.error ?? reviews.error;
  if (menuError) throw queryError(menuError);

  const now = Date.now();
  return {
    business,
    menu: (menu.data ?? []) as unknown as MenuItem[],
    listings: (listings.data ?? []) as unknown as Listing[],
    offers: ((offers.data ?? []) as unknown as Offer[]).filter(
      (offer) => !offer.ends_at || Date.parse(offer.ends_at) > now,
    ),
    reviews: (reviews.data ?? []) as unknown as Review[],
  };
});

export async function getBuyerOrders(buyerId: string): Promise<Order[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_FIELDS)
    .eq("buyer_id", buyerId)
    .order("created_at", { ascending: false });

  if (error) throw queryError(error);
  return (data ?? []) as unknown as Order[];
}

export async function getBusinessOrders(businessIds: string[]): Promise<Order[]> {
  if (businessIds.length === 0) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_FIELDS)
    .in("business_id", businessIds)
    .order("created_at", { ascending: false });

  if (error) throw queryError(error);
  return (data ?? []) as unknown as Order[];
}

/** Oda moja pamoja na vipande na historia ya hatua zake. */
export async function getOrderDetail(id: string): Promise<Order | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*, business:businesses(id, name, slug)")
    .eq("id", id)
    .maybeSingle();

  if (error) throw queryError(error);
  const order = data as unknown as Order | null;
  if (!order) return null;

  const [items, events] = await Promise.all([
    supabase
      .from("order_items")
      .select("*")
      .eq("order_id", order.id)
      .order("id"),
    supabase
      .from("order_events")
      .select("*")
      .eq("order_id", order.id)
      .order("created_at"),
  ]);

  // Maoni ya oda hii yanaweza kuandikwa na mnunuzi wake pekee, kwa hivyo
  // mstari wowote hapa una maana kwamba tayari ameandika.
  const { count: reviewCount } = await supabase
    .from("reviews")
    .select("id", { count: "exact", head: true })
    .eq("order_id", order.id);

  return {
    ...order,
    items: (items.data ?? []) as unknown as Order["items"],
    events: (events.data ?? []) as unknown as Order["events"],
    has_review: (reviewCount ?? 0) > 0,
  };
}

/** Ofu zote za muuzi (hai na zilizozimwa) — kwa dashibodi yake. */
export async function getBusinessOffers(businessIds: string[]): Promise<Offer[]> {
  if (businessIds.length === 0) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("offers")
    .select("*")
    .in("business_id", businessIds)
    .order("created_at", { ascending: false });

  if (error) throw queryError(error);
  return (data ?? []) as unknown as Offer[];
}

/** Maoni yaliyowekwa wazi kwa biashara, mpya kwanza. */
export async function getBusinessReviews(businessId: string): Promise<Review[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reviews")
    .select(REVIEW_FIELDS)
    .eq("business_id", businessId)
    .eq("is_hidden", false)
    .order("created_at", { ascending: false })
    .limit(40);

  if (error) throw queryError(error);
  return (data ?? []) as unknown as Review[];
}

/** Maoni ya kipande cha menyu au cha bidhaa mahususi. */
export async function getItemReviews(
  column: "menu_item_id" | "listing_id",
  id: string,
): Promise<Review[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reviews")
    .select(REVIEW_FIELDS)
    .eq(column, id)
    .eq("is_hidden", false)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) throw queryError(error);
  return (data ?? []) as unknown as Review[];
}

/** Oda ambazo mnunuzi huyo ameshaziandikia maoni. */
export async function getReviewedOrderIds(
  authorId: string,
  orderIds: string[],
): Promise<Set<string>> {
  if (orderIds.length === 0) return new Set();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("order_id")
    .eq("author_id", authorId)
    .in("order_id", orderIds);

  if (error) return new Set();
  return new Set((data ?? []).map((row) => String(row.order_id)));
}

/** Viungo vya mitandao viliyoamilishwa, kwa mpangilio wa msimamizi. */
export async function getSocialLinks(): Promise<SocialLink[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("social_links")
    .select("*")
    .eq("is_active", true)
    .order("sort_order")
    .order("platform");

  if (error) return [];
  return (data ?? []) as unknown as SocialLink[];
}

/** Orodha ya msimamizi: viungo vyote, hai na vilivyozimwa. */
export async function getAllSocialLinks(): Promise<SocialLink[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("social_links")
    .select("*")
    .order("sort_order")
    .order("platform");

  if (error) throw queryError(error);
  return (data ?? []) as unknown as SocialLink[];
}

/** Mipangilio ya tovuti kama ramani ya `{ key: value }`. */
export async function getSettings(): Promise<Record<string, string>> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("app_settings").select("key, value");

  if (error) return {};
  const out: Record<string, string> = {};
  for (const row of (data ?? []) as { key: string; value: string }[]) {
    out[row.key] = row.value;
  }
  return out;
}

/** Migahawa ya matangazo inayoonekana na bei zake za sasa. */
export async function getAdPlans(): Promise<AdPlan[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ad_plans")
    .select("*")
    .eq("is_active", true)
    .order("sort_order")
    .order("name");

  if (error) return [];
  return (data ?? []) as unknown as AdPlan[];
}

export async function getAllAdPlans(): Promise<AdPlan[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ad_plans")
    .select("*")
    .order("sort_order")
    .order("name");

  if (error) throw queryError(error);
  return (data ?? []) as unknown as AdPlan[];
}

/** Tangazo halisi linaloonekana uani: linaisha baadaye na lina picha. */
export async function getLiveAds(placement: AdPlacement): Promise<Ad[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ads")
    .select(
      "*, business:businesses(id, name, slug, logo_path), plan:ad_plans(id, name, placement)",
    )
    .eq("status", "live")
    .order("ends_at", { ascending: true })
    .limit(200);

  if (error) return [];
  const now = Date.now();
  return ((data ?? []) as unknown as Ad[])
    .filter(
      (ad) =>
        ad.business?.id &&
        (ad.plan?.placement ?? placement) === placement &&
        (!ad.ends_at || Date.parse(ad.ends_at) > now),
    )
    .slice(0, 12);
}

export async function getMyAds(businessIds: string[]): Promise<Ad[]> {
  if (businessIds.length === 0) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ads")
    .select("*, business:businesses(id, name, slug, logo_path)")
    .in("business_id", businessIds)
    .order("created_at", { ascending: false });

  if (error) throw queryError(error);
  return (data ?? []) as unknown as Ad[];
}

export async function getAllAds(): Promise<Ad[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ads")
    .select(
      "*, business:businesses(id, name, slug, logo_path), plan:ad_plans(id, name, placement)",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw queryError(error);
  return (data ?? []) as unknown as Ad[];
}

/** Foli ya msimamizi: maoni yote, yaliyofichwa pamoja. */
export async function getAllReviews(): Promise<Review[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reviews")
    .select(`${REVIEW_FIELDS}, business:businesses(id, name, slug)`)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw queryError(error);
  return (data ?? []) as unknown as Review[];
}

export type OrderFilter =
  | "all"
  | "open"
  | "paid"
  | "unpaid"
  | "completed"
  | "cancelled";

const ORDER_FILTERS: Record<OrderFilter, () => [string, string[] | string]> = {
  all: () => ["status", []],
  open: () => ["status", ["pending", "confirmed", "preparing", "ready"]],
  paid: () => ["payment_status", "paid"],
  unpaid: () => ["payment_status", ["unpaid", "awaiting_payment", "failed"]],
  completed: () => ["status", "completed"],
  cancelled: () => ["status", "cancelled"],
};

/** Oda zote zinazoonekana kwa msimamizi, zimepangwa mpya kwanza. */
export async function getAllOrders(
  filter: OrderFilter = "all",
  search = "",
): Promise<Order[]> {
  const supabase = await createClient();
  // `orders` ina ufunguo mwingi kwenda `profiles` — mnunuzi na msabishi.
  // PostgREST huhitaji jina la ufunguo ili asiyababe kitu kisicho na mwiri.
  let query = supabase
    .from("orders")
    .select(
      `${ORDER_FIELDS}, buyer:profiles!orders_buyer_id_fkey(id, full_name, phone, avatar_path)`,
    )
    .order("created_at", { ascending: false })
    .limit(80);

  const [column, value] = ORDER_FILTERS[filter]();
  if (filter !== "all") {
    query = Array.isArray(value) ? query.in(column, value) : query.eq(column, value);
  }

  const term = search.trim().replace(/[%_,()]/g, "");
  if (term) {
    query = query.or(
      `reference.ilike.%${term}%,contact_phone.ilike.%${term}%,note.ilike.%${term}%`,
    );
  }

  const { data, error } = await query;
  if (error) throw queryError(error);
  return (data ?? []) as unknown as Order[];
}

/** Hesabu za kituo cha usimamizi. Zinaonyesha ukweli, si makadirio. */
export async function getAdminStats(): Promise<AdminStats> {
  const supabase = await createClient();
  const tables = [
    "businesses",
    "listings",
    "orders",
    "reviews",
    "ads",
    "payouts",
  ] as const;

  const counts = await Promise.all(
    tables.map(async (table) => {
      const { count } = await supabase
        .from(table)
        .select("id", { count: "exact", head: true });
      return [table, count ?? 0] as const;
    }),
  );

  const stats = Object.fromEntries(counts) as Record<(typeof tables)[number], number>;

  const [{ count: openOrders }, { count: submittedAds }] = await Promise.all([
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .in("status", ["pending", "confirmed", "preparing", "ready"]),
    supabase
      .from("ads")
      .select("id", { count: "exact", head: true })
      .eq("status", "submitted"),
  ]);

  return {
    businesses: stats.businesses,
    listings: stats.listings,
    orders: stats.orders,
    reviews: stats.reviews,
    ads: stats.ads,
    payouts: stats.payouts,
    openOrders: openOrders ?? 0,
    submittedAds: submittedAds ?? 0,
  };
}

export type AdminStats = {
  businesses: number;
  listings: number;
  orders: number;
  reviews: number;
  ads: number;
  payouts: number;
  openOrders: number;
  submittedAds: number;
};

/**
 * ---------------------------------------------------------------------
 * Upelekezaji — maeneo ya chuo na wajumbe
 * ---------------------------------------------------------------------
 */

const ZONE_FIELDS = "id, name, note, sort_order, is_active, created_at";

/** Maeneo yaliyoamilishwa, kwa mpangilio alio_weka msimamizi. */
export async function getActiveZones(): Promise<DeliveryZone[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("delivery_zones")
    .select(ZONE_FIELDS)
    .eq("is_active", true)
    .order("sort_order")
    .order("name");

  if (error) return [];
  return (data ?? []) as unknown as DeliveryZone[];
}

/** Orodha ya msimamizi: maeneo yote, hai na yaliyozimwa. */
export async function getAllZones(): Promise<DeliveryZone[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("delivery_zones")
    .select(ZONE_FIELDS)
    .order("sort_order")
    .order("name");

  if (error) throw queryError(error);
  return (data ?? []) as unknown as DeliveryZone[];
}

/** Vitambulisho vya maeneo ambayo biashara imeweka kwenye orodha yake. */
export async function getBusinessZoneIds(businessId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("business_zones")
    .select("zone_id")
    .eq("business_id", businessId);

  // Hifadhidata haijapata migration ya upelekezaji: ruikia thamani tupu
  // badala ya kupitisha kosa kwenye ukurasa wa kuweka oda.
  if (error) return [];
  return (data ?? []).map((row) => String(row.zone_id));
}

/**
 * Maeneo mnunuzi anaweza kuchagua katika duka hili. Biashara isiyo na
 * orodha yake inatumikia kila eneo hai.
 *
 * Thamani `null` ina maana tofauti na orodha tupu: jedwali halipo bado
 * (migration haijatumika), kwa hivyo mtumiaji hapaswi kulazimishwa
 * kuchagua eneo. Orodha tupu ina maana kwamba msimamizi hujaongeza
 * eneo hata moja.
 */
export async function getZonesForBusiness(businessId: string): Promise<DeliveryZone[] | null> {
  const supabase = await createClient();
  const zonesQuery = await supabase
    .from("delivery_zones")
    .select(ZONE_FIELDS)
    .eq("is_active", true)
    .order("sort_order")
    .order("name");

  if (zonesQuery.error) return null;

  const zones = (zonesQuery.data ?? []) as unknown as DeliveryZone[];
  const chosen = await getBusinessZoneIds(businessId);
  if (chosen.length === 0) return zones;

  const wanted = new Set(chosen);
  return zones.filter((zone) => wanted.has(zone.id));
}

/** Wajumbe walioidhinishwa — orodha muuzi anayopanga kazi. */
export async function getApprovedCouriers(): Promise<Profile[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, phone, courier_approved_at")
    .eq("courier_status", "approved")
    .order("full_name")
    .limit(100);

  if (error) return [];
  return (data ?? []) as unknown as Profile[];
}

/** Maombi ya usabishi yanayosubiri msimamizi. */
export async function getCourierRequests(): Promise<Profile[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, phone, hall, courier_status, courier_requested_at")
    .eq("courier_status", "pending")
    .order("courier_requested_at")
    .limit(100);

  if (error) return [];
  return (data ?? []) as unknown as Profile[];
}

/** Hesabu ya maombi yanayosubiri — badge ya kituo cha usimamizi. */
export async function countCourierRequests(): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("courier_status", "pending");

  return count ?? 0;
}

/**
 * Kazi za msabishi aliyeingia. RLS ya `orders` huruhusu msabishi kuona
 * oda ambazo courier_id yake ni yeye, kwa hivyo swali hili halihitaji
 * kuruhusa maalum.
 */
export async function getCourierOrders(courierId: string): Promise<Order[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(`${ORDER_FIELDS}, buyer:profiles!orders_buyer_id_fkey(id, full_name, phone)`)
    .eq("courier_id", courierId)
    .order("courier_assigned_at", { ascending: false })
    .limit(60);

  if (error) throw queryError(error);
  return (data ?? []) as unknown as Order[];
}

/**
 * Majina ya wajumbe kwa oda. Swali hili la pili linakusudia: orodha kuu
 * za oda hutumia `*`, kwa hivyo kurasa zinaendelea kufanya kazi hata
 * migration ya usabishi ikiwa bado haijaundwa.
 */
export async function getCouriersByIds(ids: string[]): Promise<Map<string, Profile>> {
  const unique = [...new Set(ids)].filter(Boolean);
  if (unique.length === 0) return new Map();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, phone")
    .in("id", unique);

  if (error) return new Map();
  return new Map((data ?? []).map((row) => [String(row.id), row as unknown as Profile]));
}

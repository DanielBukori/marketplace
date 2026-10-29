import { createClient } from "@/lib/supabase/server";
import type {
  Announcement,
  Business,
  Listing,
  MenuItem,
  Order,
  Payout,
  Profile,
} from "@/lib/types";

const LISTING_FIELDS =
  "id, business_id, title, description, category, condition, price, is_negotiable, stock, status, photo_paths, whatsapp, location, view_count, published_at, created_at, business:businesses(id, name, slug, whatsapp, phone, description, location, logo_path, is_verified)";

const MENU_FIELDS =
  "id, business_id, name, description, price, slot, photo_path, is_available, business:businesses(id, name, slug)";

export async function getActiveListings(category?: string): Promise<Listing[]> {
  const supabase = await createClient();
  let query = supabase
    .from("listings")
    .select(LISTING_FIELDS)
    .eq("status", "active")
    .neq("stock", 0)
    .order("published_at", { ascending: false })
    .limit(60);

  if (category && category !== "all") query = query.eq("category", category);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as Listing[];
}

export async function getListing(id: string): Promise<Listing | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .select(LISTING_FIELDS)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return (data as unknown as Listing) ?? null;
}

export async function getActiveBusinesses(kind?: Business["kind"]): Promise<Business[]> {
  const supabase = await createClient();
  let query = supabase
    .from("businesses")
    .select("*")
    .eq("is_active", true)
    .order("name");

  if (kind) query = query.eq("kind", kind);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as Business[];
}

export async function getMyBusinesses(userId: string): Promise<Business[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("owner_id", userId)
    .order("created_at");

  if (error) throw error;
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

  if (error) throw error;
  return (data ?? []) as unknown as Listing[];
}

export async function getMenuItems(ids: string[]): Promise<MenuItem[]> {
  if (ids.length === 0) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("menu_items")
    .select("id, business_id, name, description, price, slot, photo_path, is_available")
    .in("id", ids);

  if (error) throw error;
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

  if (error) throw error;
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

  if (error) throw error;
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

  if (error) throw error;
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

  if (error) throw error;
  return (data ?? []) as unknown as Business[];
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, phone, hall, avatar_path, is_admin")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
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

  if (error) throw error;
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

  if (error) throw error;
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
    .order("slot");

  if (error) throw error;
  return { businesses, menu: (data ?? []) as unknown as MenuItem[] };
}

export async function getBusinessBySlug(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  const business = data as unknown as Business | null;
  if (!business) return null;

  const [menu, listings] = await Promise.all([
    supabase
      .from("menu_items")
      .select(MENU_FIELDS)
      .eq("business_id", business.id)
      .eq("is_available", true)
      .order("slot"),
    supabase
      .from("listings")
      .select(LISTING_FIELDS)
      .eq("business_id", business.id)
      .eq("status", "active")
      .order("published_at", { ascending: false }),
  ]);

  const menuError = menu.error ?? listings.error;
  if (menuError) throw menuError;

  return {
    business,
    menu: (menu.data ?? []) as unknown as MenuItem[],
    listings: (listings.data ?? []) as unknown as Listing[],
  };
}

export async function getBuyerOrders(buyerId: string): Promise<Order[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*, business:businesses(id, name, slug), items:order_items(*)")
    .eq("buyer_id", buyerId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as Order[];
}

export async function getBusinessOrders(businessIds: string[]): Promise<Order[]> {
  if (businessIds.length === 0) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*, business:businesses(id, name, slug), items:order_items(*)")
    .in("business_id", businessIds)
    .order("created_at", { ascending: false });

  if (error) throw error;
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

  if (error) throw error;
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

  return {
    ...order,
    items: (items.data ?? []) as unknown as Order["items"],
    events: (events.data ?? []) as unknown as Order["events"],
  };
}

export type BusinessKind = "food" | "goods" | "service";
export type ListingStatus = "draft" | "active" | "sold" | "archived";
export type ListingCondition = "new" | "like_new" | "used";
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "completed"
  | "cancelled";
export type PaymentStatus =
  | "unpaid"
  | "awaiting_payment"
  | "paid"
  | "failed"
  | "refunded";
export type PayoutMethod = "airtel" | "mpesa" | "mixx" | "halotel" | "bank";
export type PayoutStatus = "queued" | "processing" | "sent" | "failed";
export type OfferScope = "items" | "delivery" | "all";
export type SocialPlatform =
  | "instagram"
  | "tiktok"
  | "x"
  | "facebook"
  | "whatsapp"
  | "telegram"
  | "youtube"
  | "linkedin"
  | "website";
export type AdPlacement = "home" | "msosi" | "market";
export type AdStatus =
  | "submitted"
  | "approved"
  | "live"
  | "rejected"
  | "expired"
  | "cancelled";

export type Profile = {
  id: string;
  full_name: string;
  phone: string | null;
  hall: string | null;
  avatar_path: string | null;
  is_admin: boolean;
};

export type Business = {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  kind: BusinessKind;
  description: string;
  logo_path: string | null;
  cover_path: string | null;
  phone: string | null;
  whatsapp: string | null;
  location: string | null;
  opening_hours: string | null;
  delivery_fee: number;
  is_active: boolean;
  is_verified: boolean;
  rating_avg: number;
  rating_count: number;
  created_at: string;
};

export type Listing = {
  id: string;
  business_id: string;
  title: string;
  description: string;
  category: string;
  condition: ListingCondition;
  price: number;
  is_negotiable: boolean;
  stock: number;
  status: ListingStatus;
  photo_paths: string[];
  whatsapp: string | null;
  location: string | null;
  view_count: number;
  rating_avg: number;
  rating_count: number;
  published_at: string | null;
  created_at: string;
  business?: Pick<
    Business,
    | "id"
    | "name"
    | "slug"
    | "whatsapp"
    | "phone"
    | "description"
    | "location"
    | "logo_path"
    | "is_verified"
    | "rating_avg"
    | "rating_count"
  >;
};

export type MenuItem = {
  id: string;
  business_id: string;
  name: string;
  description: string;
  price: number;
  slot: string;
  photo_path: string | null;
  is_available: boolean;
  rating_avg: number;
  rating_count: number;
  business?: Pick<Business, "id" | "name" | "slug">;
};

/** Punguzo analoamua muuzi mwenyewe kwa vyakula au adi zake. */
export type Offer = {
  id: string;
  business_id: string;
  label: string;
  percent_off: number;
  min_items_total: number;
  scope: OfferScope;
  starts_at: string;
  ends_at: string | null;
  is_active: boolean;
  business?: Pick<Business, "id" | "name" | "slug">;
};

/** Maoni ya mnunuzi baada ya oda kukamilika — nyota 1 hadi 5. */
export type Review = {
  id: string;
  business_id: string;
  author_id: string;
  order_id: string;
  menu_item_id: string | null;
  listing_id: string | null;
  rating: number;
  comment: string;
  is_hidden: boolean;
  created_at: string;
  author?: Pick<Profile, "id" | "full_name" | "avatar_path">;
  business?: Pick<Business, "id" | "name" | "slug">;
  menu_item?: { name: string } | null;
};

export type SocialLink = {
  id: string;
  platform: SocialPlatform;
  url: string;
  label: string;
  is_active: boolean;
  sort_order: number;
};

/** Mpango wa tangazo: bei za muda huwekwa na msimamizi. */
export type AdPlan = {
  id: string;
  name: string;
  description: string;
  placement: AdPlacement;
  price_per_day: number;
  price_per_week: number;
  price_per_month: number;
  max_days: number;
  is_active: boolean;
  sort_order: number;
};

export type Ad = {
  id: string;
  plan_id: string | null;
  business_id: string;
  title: string;
  image_path: string | null;
  target_url: string;
  days: number;
  price: number;
  status: AdStatus;
  starts_at: string | null;
  ends_at: string | null;
  review_note: string;
  created_at: string;
  business?: Pick<Business, "id" | "name" | "slug" | "logo_path">;
  plan?: Pick<AdPlan, "id" | "name" | "placement">;
};

export type OrderItem = {
  id: string;
  order_id: string;
  listing_id: string | null;
  menu_item_id: string | null;
  name: string;
  unit_price: number;
  quantity: number;
  photo_path: string | null;
  line_total: number;
};

export type OrderEvent = {
  id: string;
  order_id: string;
  status: string;
  note: string;
  created_at: string;
};

export type Order = {
  id: string;
  reference: string;
  buyer_id: string;
  business_id: string;
  kind: "food" | "goods";
  status: OrderStatus;
  payment_status: PaymentStatus;
  provider: string;
  provider_payment_id: string | null;
  payment_channel: string;
  items_total: number;
  discount: number;
  offer_id: string | null;
  offer_label: string;
  delivery_fee: number;
  total: number;
  delivery_method: "pickup" | "delivery";
  contact_phone: string;
  delivery_address: string;
  meetup_point: string;
  note: string;
  scheduled_at: string | null;
  created_at: string;
  completed_at: string | null;
  business?: Pick<Business, "id" | "name" | "slug">;
  items?: OrderItem[];
  events?: OrderEvent[];
  buyer?: Pick<Profile, "id" | "full_name" | "phone">;
  has_review?: boolean;
};

export type Announcement = {
  id: string;
  title: string;
  body: string;
  event_at: string | null;
  published: boolean;
  created_at: string;
};

export type Payout = {
  id: string;
  business_id: string;
  order_id: string | null;
  amount: number;
  fee: number;
  method: PayoutMethod;
  destination: string;
  reference: string;
  status: PayoutStatus;
  provider_transfer_id: string | null;
  failure_reason: string | null;
  settled_at: string | null;
  created_at: string;
  business?: Pick<Business, "id" | "name" | "slug">;
  order?: Pick<Order, "id" | "reference" | "status" | "total">;
};

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
  business?: Pick<Business, "id" | "name" | "slug">;
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
  delivery_fee: number;
  total: number;
  delivery_method: "pickup" | "delivery";
  contact_phone: string;
  delivery_address: string;
  note: string;
  scheduled_at: string | null;
  created_at: string;
  completed_at: string | null;
  business?: Pick<Business, "id" | "name" | "slug">;
  items?: OrderItem[];
  events?: OrderEvent[];
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

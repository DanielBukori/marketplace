-- IAA Marketplace — muundo wa haki (schema), RLS na Storage.
-- Angalia: hakuna data za kujaribu hapa. Kila biashara, tangazo, menyu na
-- oda hutokana na watumiaji halisi wanaojisajili kwenye tovuti.
--
-- MPAKO WA KUSEMA (dependency order) — hii ndiyo sababu ya mlolongo huu:
--   jedwali -> kazi (functions) -> triggers -> RLS -> Storage
-- Kazi za `language sql` (is_business_owner, is_admin_user) huthibitishwa
-- na Postgres wakati wa kuundwa, kwa hivyo hazawezi kuja kabla ya jedwali
-- wanayotaja kuwepo. Zimehama chini, baada ya jedwali zote.
--
-- Script hii inaweza kuirudiwa (idempotent): `if not exists`,
-- `create or replace function`, `drop trigger/policy if exists` kabla ya
-- kuunda. Hivyo unaweza kui-bandika tena baada ya marekebisho bila kupata
-- "already exists".

-- =====================================================================
-- 1. Kazi ya wasaidizi isiyo na utegemezi
-- =====================================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =====================================================================
-- 2. Profaili — inaundwa kiotomatiki wakati mtumiaji anapojiandikisha
-- =====================================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  phone text,
  hall text,
  avatar_path text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.raw_user_meta_data ->> 'phone'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================================
-- 3. Biashara — mgahawa, duka au mtoaji wa huduma
-- =====================================================================

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null check (char_length(name) between 2 and 60),
  -- slug hutumika kwenye anwani ya ukurasa (/msosi/<slug>), kwa hivyo
  -- inaruhusiwa herufi ndogo, namba na fisto pekee.
  slug text not null check (slug ~ '^[a-z0-9][a-z0-9-]{1,47}$'),
  kind text not null check (kind in ('food', 'goods', 'service')),
  description text not null default '',
  logo_path text,
  cover_path text,
  phone text,
  whatsapp text,
  location text,
  opening_hours text,
  delivery_fee numeric(12, 2) not null default 0,
  is_active boolean not null default false,
  is_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists businesses_slug_key on public.businesses (slug);
create index if not exists businesses_owner_idx on public.businesses (owner_id);
create index if not exists businesses_active_idx on public.businesses (kind, is_active);

drop trigger if exists businesses_updated_at on public.businesses;
create trigger businesses_updated_at
  before update on public.businesses
  for each row execute function public.set_updated_at();

-- =====================================================================
-- 4. Matangazo ya bidhaa / vyumba
-- =====================================================================

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  title text not null,
  description text not null default '',
  category text not null,
  condition text not null default 'used' check (condition in ('new', 'like_new', 'used')),
  price numeric(12, 2) not null check (price >= 0),
  is_negotiable boolean not null default false,
  stock integer not null default 1 check (stock >= 0),
  status text not null default 'draft'
    check (status in ('draft', 'active', 'sold', 'archived')),
  photo_paths text[] not null default '{}',
  whatsapp text,
  location text,
  view_count integer not null default 0,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists listings_active_idx on public.listings (status, published_at desc);
create index if not exists listings_business_idx on public.listings (business_id);
create index if not exists listings_category_idx on public.listings (category, status);

drop trigger if exists listings_updated_at on public.listings;
create trigger listings_updated_at
  before update on public.listings
  for each row execute function public.set_updated_at();

-- =====================================================================
-- 5. Menyu ya migahawa
-- =====================================================================

create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null,
  description text not null default '',
  price numeric(12, 2) not null check (price >= 0),
  slot text not null default 'mains'
    check (slot in ('breakfast', 'mains', 'sides', 'snacks', 'drinks')),
  photo_path text,
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists menu_items_business_idx on public.menu_items (business_id, slot);

drop trigger if exists menu_items_updated_at on public.menu_items;
create trigger menu_items_updated_at
  before update on public.menu_items
  for each row execute function public.set_updated_at();

-- =====================================================================
-- 6. Oda
-- =====================================================================

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  reference text not null,
  buyer_id uuid not null references public.profiles (id) on delete restrict,
  business_id uuid not null references public.businesses (id) on delete restrict,
  kind text not null check (kind in ('food', 'goods')),
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled')),
  payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid', 'awaiting_payment', 'paid', 'failed', 'refunded')),
  provider text not null default '' check (provider in ('', 'snippe', 'cash')),
  provider_payment_id text,
  payment_channel text not null default ''
    check (payment_channel in ('', 'mpesa', 'airtel', 'mixx', 'halotel')),
  items_total numeric(12, 2) not null default 0,
  delivery_fee numeric(12, 2) not null default 0,
  total numeric(12, 2) not null default 0,
  delivery_method text not null default 'pickup'
    check (delivery_method in ('pickup', 'delivery')),
  contact_phone text not null default '',
  delivery_address text not null default '',
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create unique index if not exists orders_reference_key on public.orders (reference);
create index if not exists orders_buyer_idx on public.orders (buyer_id, created_at desc);
create index if not exists orders_business_idx on public.orders (business_id, created_at desc);
create index if not exists orders_unsettled_idx on public.orders (business_id, payment_status, completed_at);

-- Vipande vya oda vina nakala ya jina/bei ili mabadiliko ya baadaye
-- yasisahi historia ya oda iliyokamilika.
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  listing_id uuid references public.listings (id) on delete set null,
  menu_item_id uuid references public.menu_items (id) on delete set null,
  name text not null,
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  quantity integer not null default 1 check (quantity > 0),
  photo_path text,
  line_total numeric(14, 2) generated always as (unit_price * quantity) stored
);

create index if not exists order_items_order_idx on public.order_items (order_id);

create table if not exists public.order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  status text not null,
  note text not null default '',
  actor_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists order_events_order_idx on public.order_events (order_id, created_at);

-- =====================================================================
-- 7. Malipo kwa wauzaji (Snippe disbursements)
-- =====================================================================

-- Snippe haina mgawanyo wa pesa (split payments), hivyo mfumo hukusanya
-- kwanza kwenye namba ya IAA, kisha hulipa muuzki kupitia jedwali hili.
-- `amount` ni kile muuzi anapokea (jumla ya oda - toleo la Snippe);
-- msimamizi hutuma mstari ulio hali 'queued' baada ya oda kukamilika.
create table if not exists public.payouts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete restrict,
  order_id uuid references public.orders (id) on delete set null,
  amount numeric(12, 2) not null check (amount > 0),
  fee numeric(12, 2) not null default 0,
  method text not null check (method in ('airtel', 'mpesa', 'mixx', 'halotel', 'bank')),
  destination text not null default '',
  reference text not null,
  status text not null default 'queued'
    check (status in ('queued', 'processing', 'sent', 'failed')),
  provider_transfer_id text,
  failure_reason text,
  created_by uuid references public.profiles (id) on delete set null,
  settled_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists payouts_reference_key on public.payouts (reference);
create unique index if not exists payouts_order_key on public.payouts (order_id) where order_id is not null;
create index if not exists payouts_business_idx on public.payouts (business_id, created_at desc);
create index if not exists payouts_status_idx on public.payouts (status, created_at);

-- =====================================================================
-- 8. Kazi za umiliki — lazima ziwe BAADA ya jedwali zote
-- =====================================================================

-- Hizi ni `language sql`: Postgres huhakiki mwili wake papema unapoundwa,
-- hivyo `public.businesses` na `public.profiles` lazima ziwe zipo tayari.
-- Kabla ya kupangwa upya hapa, script ilikataa kuendea kwa kosa la
-- "relation public.businesses does not exist".

-- Kuruhusu policies za jedwali lingine kuuliza umiliki bila kuzama kwenye
-- RLS ya jedwali hilo (security definer huenda nje ya mipaka ya mtumiaji).
create or replace function public.is_business_owner(p_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.businesses b
    where b.id = p_business_id
      and b.owner_id = auth.uid()
  );
$$;

-- Msimamizi (profile.is_admin) anaweza kuidhinisha au kuzima biashara
-- na matangazo ya wengine.
create or replace function public.is_admin_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.is_admin
  );
$$;

-- =====================================================================
-- 9. RLS
-- =====================================================================

alter table public.profiles enable row level security;
alter table public.businesses enable row level security;
alter table public.listings enable row level security;
alter table public.menu_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_events enable row level security;
alter table public.payouts enable row level security;

-- Profaili: zinaonekana kwa wote (muuzi anahitaji jina la mnunuzi),
-- lakini mtumiaji anaweza kubadilisha yake pekee.
-- ONYO: `using (true)` huruhusu akaunti yoyote kuona `phone` na `hall` za
-- kila mtu. Kabla ya kutangaza kwa wingi, badilisha hii iwe view ya
-- `full_name + avatar_path` pekee, au ongeza `to authenticated`.
drop policy if exists "profiles read" on public.profiles;
create policy "profiles read" on public.profiles
  for select using (true);
drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());
drop policy if exists "profiles insert own" on public.profiles;
create policy "profiles insert own" on public.profiles
  for insert with check (id = auth.uid());

-- Biashara: zinazoonekana kwa umma ni zile zilizoamilishwa; mmiliki huona zake.
drop policy if exists "businesses read" on public.businesses;
create policy "businesses read" on public.businesses
  for select using (is_active or owner_id = auth.uid());
drop policy if exists "businesses read admin" on public.businesses;
create policy "businesses read admin" on public.businesses
  for select using (is_admin_user());
drop policy if exists "businesses insert own" on public.businesses;
create policy "businesses insert own" on public.businesses
  for insert to authenticated with check (owner_id = auth.uid());
drop policy if exists "businesses update own" on public.businesses;
create policy "businesses update own" on public.businesses
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists "businesses delete own" on public.businesses;
create policy "businesses delete own" on public.businesses
  for delete using (owner_id = auth.uid());

-- Matangazo: umma huona 'active' tu; mmiliki huona yake yote.
drop policy if exists "listings read" on public.listings;
create policy "listings read" on public.listings
  for select using (status in ('active', 'sold') or is_business_owner(business_id));
drop policy if exists "listings insert own" on public.listings;
create policy "listings insert own" on public.listings
  for insert to authenticated
  with check (is_business_owner(business_id));
drop policy if exists "listings update own" on public.listings;
create policy "listings update own" on public.listings
  for update using (is_business_owner(business_id))
  with check (is_business_owner(business_id));
drop policy if exists "listings delete own" on public.listings;
create policy "listings delete own" on public.listings
  for delete using (is_business_owner(business_id));

drop policy if exists "menu read" on public.menu_items;
-- Mawazo mawili tofauti, kwa hivyo mabano ni ya lazima:
--   (inapatikana NA biashara haiko hai) AU WEO wa muuzi.
create policy "menu read" on public.menu_items
  for select using (
    (
      is_available
      and exists (select 1 from public.businesses b where b.id = business_id and b.is_active)
    )
    or is_business_owner(business_id)
  );
drop policy if exists "menu insert own" on public.menu_items;
create policy "menu insert own" on public.menu_items
  for insert to authenticated with check (is_business_owner(business_id));
drop policy if exists "menu update own" on public.menu_items;
create policy "menu update own" on public.menu_items
  for update using (is_business_owner(business_id))
  with check (is_business_owner(business_id));
drop policy if exists "menu delete own" on public.menu_items;
create policy "menu delete own" on public.menu_items
  for delete using (is_business_owner(business_id));

-- Oda: mnunuzi au mmiliki wa biashara ndio wanaohusika pekee.
drop policy if exists "orders read parties" on public.orders;
create policy "orders read parties" on public.orders
  for select using (buyer_id = auth.uid() or is_business_owner(business_id));
drop policy if exists "orders insert buyer" on public.orders;
create policy "orders insert buyer" on public.orders
  for insert to authenticated with check (buyer_id = auth.uid());
-- Msimamizi huunda / kulipa upande wa seva (service_role, hupuuza RLS).
drop policy if exists "orders update parties" on public.orders;
create policy "orders update parties" on public.orders
  for update using (buyer_id = auth.uid() or is_business_owner(business_id))
  with check (buyer_id = auth.uid() or is_business_owner(business_id));

drop policy if exists "order items read parties" on public.order_items;
create policy "order items read parties" on public.order_items
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and (o.buyer_id = auth.uid() or is_business_owner(o.business_id))
    )
  );
drop policy if exists "order items insert buyer" on public.order_items;
create policy "order items insert buyer" on public.order_items
  for insert to authenticated with check (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and o.buyer_id = auth.uid()
        and o.status = 'pending'
    )
  );

-- Kumbukumbu ya hatua za oda: kusoma kwa pande husika, kuandika kwa seva.
drop policy if exists "order events read parties" on public.order_events;
create policy "order events read parties" on public.order_events
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and (o.buyer_id = auth.uid() or is_business_owner(o.business_id))
    )
  );

-- Malipo: mmiliki huona yake pekee; huundwa na seva tu.
drop policy if exists "payouts read own" on public.payouts;
create policy "payouts read own" on public.payouts
  for select using (is_business_owner(business_id));
drop policy if exists "payouts read admin" on public.payouts;
create policy "payouts read admin" on public.payouts
  for select using (is_admin_user());

-- Msimamizi huweza kuidhinisha, kuzima au kubadilisha hali ya waliyoweka.
drop policy if exists "listings update admin" on public.listings;
create policy "listings update admin" on public.listings
  for update using (is_admin_user()) with check (is_admin_user());
drop policy if exists "businesses update admin" on public.businesses;
create policy "businesses update admin" on public.businesses
  for update using (is_admin_user()) with check (is_admin_user());
drop policy if exists "orders update admin" on public.orders;
create policy "orders update admin" on public.orders
  for update using (is_admin_user()) with check (is_admin_user());

-- =====================================================================
-- 10. Ufuatiliaji wa mabadiliko ya oda
-- =====================================================================

-- Kila mabadiliko ya hali ya oda huandikwa kwenye order_events ili mnunuzi
-- na muuzi waone historia, na oda iliyokamilika ipate tarehe ya mwisho.
create or replace function public.log_order_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status
     or new.payment_status is distinct from old.payment_status then
    insert into public.order_events (order_id, status, note)
    values (
      new.id,
      new.status,
      case
        when new.payment_status is distinct from old.payment_status
        then 'malipo: ' || old.payment_status || ' → ' || new.payment_status
        else ''
      end
    );
  end if;

  return null;
end;
$$;

drop trigger if exists orders_change_log on public.orders;
create trigger orders_change_log
  after update on public.orders
  for each row execute function public.log_order_change();

-- Kinga ya safu za pesa. RLS inazuza pande zisizo husika kubadilisha oda,
-- lakini haitofautishi safu: mnunuzi angeweza kuweka payment_status='paid'
-- au total=0. Kivinjari (authenticated/anon) hakiwezi kubadilisha safu
-- za pesa; seva (service_role) ndiyo pekee inayoweza.
create or replace function public.protect_order_columns()
returns trigger
language plpgsql
as $$
declare
  actor_role text := coalesce(auth.jwt() ->> 'role', 'anon');
  is_owner boolean;
  is_buyer boolean := old.buyer_id = auth.uid();
  syncing_totals boolean :=
    coalesce(current_setting('iaa.syncing_order_totals', true), 'false') = 'true';
begin
  new.updated_at := now();

  if new.status is distinct from old.status then
    new.completed_at := case
      when new.status = 'completed' then now()
      else null
    end;
  else
    new.completed_at := old.completed_at;
  end if;

  if actor_role = 'service_role' then
    return new;
  end if;

  -- Safu ambazo ni milki ya seva au hifadhidata pekee.
  new.reference := old.reference;
  new.kind := old.kind;
  new.buyer_id := old.buyer_id;
  new.business_id := old.business_id;
  new.delivery_fee := old.delivery_fee;
  new.created_at := old.created_at;
  new.payment_status := old.payment_status;
  new.provider := old.provider;
  new.provider_payment_id := old.provider_payment_id;
  new.payment_channel := old.payment_channel;

  if not syncing_totals then
    new.items_total := old.items_total;
    new.total := old.total;
  end if;

  is_owner := public.is_business_owner(old.business_id);

  if new.status is distinct from old.status then
    if is_owner then
      null; -- muuzi anaelekeza hatua ya oda
    elsif is_buyer and old.status = 'pending' and new.status = 'cancelled' then
      null; -- mnunuzi anaweza kughairi oda ambayo haijachakatwa
    else
      new.status := old.status;
    end if;
  end if;

  -- Maelezo ya mnunuzi yarekebishwe tu kabla ya oda kuchakatwa.
  if is_buyer and old.status = 'pending' then
    null;
  else
    new.delivery_method := old.delivery_method;
    new.contact_phone := old.contact_phone;
    new.delivery_address := old.delivery_address;
    new.note := old.note;
  end if;

  return new;
end;
$$;

drop trigger if exists orders_protect_columns on public.orders;
create trigger orders_protect_columns
  before update on public.orders
  for each row execute function public.protect_order_columns();

-- Namba ya oda (reference) na tukio la kwanza huundwa na hifadhidata, hivyo
-- kivinjari hakiwezi kujipangia namba wala kupuuza historia.
create or replace function public.prepare_new_order()
returns trigger
language plpgsql
as $$
declare
  biz_kind text;
  biz_fee numeric;
begin
  select kind, delivery_fee
    into biz_kind, biz_fee
    from public.businesses
   where id = new.business_id
     and is_active;

  if biz_kind is null then
    raise exception 'Biashara haipatikani au imefungwa';
  end if;

  -- Aina na gharama ya delivery havitoki kwa mteja: muuzi ndiye anayaweka.
  new.kind := case when biz_kind = 'food' then 'food' else 'goods' end;
  new.delivery_fee := case
    when new.delivery_method = 'delivery' then coalesce(biz_fee, 0)
    else 0
  end;

  -- Oda mpya daima huanza ikiwa haijalipwa; jumla huhesabiwa na
  -- trigger ya vipande, hivyo thamani kutoka kivinjari hapuuziwi.
  new.payment_status := 'unpaid';
  new.provider := '';
  new.provider_payment_id := null;
  new.payment_channel := '';
  new.items_total := 0;
  new.total := 0;
  new.status := 'pending';
  new.completed_at := null;

  new.reference := upper(
    'IAA-' || to_char(now(), 'yymmdd') || '-' ||
    substr(translate(new.id::text, '-', ''), 1, 8)
  );
  return new;
end;
$$;

drop trigger if exists orders_prepare on public.orders;
create trigger orders_prepare
  before insert on public.orders
  for each row execute function public.prepare_new_order();

create or replace function public.log_new_order()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.order_events (order_id, status, note)
  values (new.id, new.status, 'oda imeundwa');
  return new;
end;
$$;

drop trigger if exists orders_created_log on public.orders;
create trigger orders_created_log
  after insert on public.orders
  for each row execute function public.log_new_order();

-- Bei ya kipande huandikwa kutoka kwa rekodi ya muuzi, si kutoka kwa
-- kile kivinjari kilichotuma — hivyo hakuna njia ya kupata bei ya uongo.
create or replace function public.pin_order_item_price()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  real_price numeric;
  real_name text;
  real_photo text;
  real_business uuid;
  order_business uuid;
begin
  select business_id into order_business from public.orders where id = new.order_id;

  if new.menu_item_id is not null then
    select price, name, photo_path, business_id
      into real_price, real_name, real_photo, real_business
      from public.menu_items where id = new.menu_item_id;
  elsif new.listing_id is not null then
    select price, title, (photo_paths)[1], business_id
      into real_price, real_name, real_photo, real_business
      from public.listings where id = new.listing_id;
  end if;

  if real_price is null then
    raise exception 'Kipande hiki hakipo kwenye rekodi';
  end if;

  if real_business is distinct from order_business then
    raise exception 'Kipande hiki ni cha muuzi mwingine';
  end if;

  new.unit_price := real_price;
  new.name := real_name;
  new.photo_path := real_photo;
  return new;
end;
$$;

drop trigger if exists order_items_pin_price on public.order_items;
create trigger order_items_pin_price
  before insert or update on public.order_items
  for each row execute function public.pin_order_item_price();

-- Jumla ya oda huhesabiwa na hifadhidata baada ya kila mabadiliko ya vipande.
create or replace function public.sync_order_total()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  -- Kwa AFTER DELETE, `new` haijapangwa kabisa; kusoma new.order_id
  -- kungegwusha kosa la muda. TG_OP ndiyo njia sahihi ya kutofautisha.
  target uuid;
begin
  target := case when TG_OP = 'DELETE' then old.order_id else new.order_id end;
  -- Bila alama hii, kinga ya safu za pesa ingechukua huduma hii kama
  -- mabadiliko ya kivinjari na kurudisha jumla ya zamani.
  perform set_config('iaa.syncing_order_totals', 'true', true);

  update public.orders o
     set items_total = coalesce(
           (select sum(line_total) from public.order_items where order_id = target), 0)
   where o.id = target;

  update public.orders o
     set total = o.items_total
                 + case when o.delivery_method = 'delivery' then o.delivery_fee else 0 end
   where o.id = target;

  perform set_config('iaa.syncing_order_totals', 'false', true);

  return null;
end;
$$;

drop trigger if exists order_items_sync_total on public.order_items;
create trigger order_items_sync_total
  after insert or update or delete on public.order_items
  for each row execute function public.sync_order_total();

-- =====================================================================
-- 11. Storage — kikapu kimoja cha picha za umma
-- =====================================================================

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

-- Kila kipande cha picha huwekwa chini ya folda ya namba ya mtumiaji:
-- media/<auth.uid()>/..., hivyo mmiliki ndiye anayeandika kwenye folda yake.
drop policy if exists "media read public" on storage.objects;
create policy "media read public" on storage.objects
  for select using (bucket_id = 'media');

drop policy if exists "media insert own folder" on storage.objects;
create policy "media insert own folder" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "media update own folder" on storage.objects;
create policy "media update own folder" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'media'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "media delete own folder" on storage.objects;
create policy "media delete own folder" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- =====================================================================
-- 12. Habari na matukio ya uani (announcements)
-- =====================================================================

-- Ukurasa wa /news unaonyesha tu safu zilizowekwa hapa na msimamizi.
-- Hakuna data ya kuiga: ikiwa jedwali ni tupu, ukurasa unaonyesha hivyo.
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null default '',
  event_at date,
  published boolean not null default false,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists announcements_feed_idx on public.announcements (
  published, event_at desc nulls last, created_at desc
);

drop trigger if exists announcements_updated_at on public.announcements;
create trigger announcements_updated_at
  before update on public.announcements
  for each row execute function public.set_updated_at();

alter table public.announcements enable row level security;

drop policy if exists "announcements read published" on public.announcements;
create policy "announcements read published" on public.announcements
  for select using (published or is_admin_user());
drop policy if exists "announcements insert admin" on public.announcements;
create policy "announcements insert admin" on public.announcements
  for insert to authenticated with check (is_admin_user());
drop policy if exists "announcements update admin" on public.announcements;
create policy "announcements update admin" on public.announcements
  for update using (is_admin_user()) with check (is_admin_user());
drop policy if exists "announcements delete admin" on public.announcements;
create policy "announcements delete admin" on public.announcements
  for delete using (is_admin_user());

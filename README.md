# IAA Marketplace

Soko la kidigitali la wanafunzi wa **Institute of Accountancy Arusha**: matangazo ya
bidhaa za mkononi, vyumba, huduma, menyu za migahawa ya uani na oda zenye malipo ya
mobile money. Hakuna data ya uongo popote — kila biashara, picha, bei na oda hutoka kwa
watumiaji wanaojisajili.

Rangi za brand zinatoka kwenye tovuti rasmi ya IAA: bluu `#10497e` na crimson `#a41e22`.

---

## 1. Mipangilio ya mara moja (dakika ~10)

### a) Tengeneza mradi wa Supabase

1. Fungua [supabase.com](https://supabase.com) → **New project**. Chagua region
   iliyopo kwenye akaunti yako (Africa/Karibu: `London` au `Singapore` huwa mbio kwa
   Tanzania).
2. Fungua **SQL Editor** → **New query** → nakili **yote** yaliyo kwenye
   [`supabase/schema.sql`](supabase/schema.sql) → **Run**.
   Hii huunda jedwali yote (`profiles`, `businesses`, `listings`, `menu_items`,
   `orders`, `order_items`, `order_events`, `payouts`, `announcements`), RLS, triggers
   za pesa na kikapu cha picha `media`.
3. Fungua **Project Settings → API** na nakili vitu vitatu:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - fungo la **anon public** (JWT `eyJ…` au `sb_publishable_…`) →
     `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - fungo la **service_role** / `sb_secret_…` → `SUPABASE_SERVICE_ROLE_KEY`

Mihani mitatu migumu ya fungo:

- URL na fungo lazima vitoke **kwenye mradi mmoja**.
- Thamani ianze mara baada ya `=` — hakuna nafasi mbele, hakuna neno la ziada mwisho.
  Fungo lililo na `anon` au nafasi mwisho litakataaliwa na Supabase
  (`Invalid API key`).
- Schema inaweza kuendeshwa mara mbili kwa Salama: jedwali na index hutumia
  `if not exists`, triggers na policies huondolewa (`drop … if exists`) kabla
  ya kuundwa upya, na kazi zote ni `create or replace`. Hakuna haja ya kufuta
  kitu.
- Mlolongo wa faili ni wa lazima: **jedwali → kazi → triggers → RLS →
  Storage**. Usaihama `is_business_owner()` / `is_admin_user()` kwenda juu ya
  jedwali; Postgres huhakiki `language sql` papema inapoundwa, hivyo kungeleta
  `relation "public.businesses" does not exist`.

### b) Fungua `.env.local`

```bash
cp .env.example .env.local     # Windows: copy .env.example .env.local
```

Kisha jaza fungo ulizonakili hapo juu. `.env.example` ni kiolegezeli tupu — usiweke
fungo halisi ndani yake. Faili za `.env*` zimefungwa na `.gitignore`, kwa hivyo hazitoki
nje ya kompyuta yako.

Ndani ya Supabase → **Authentication → URL Configuration**:

- **Site URL** = thamani ileile ya `NEXT_PUBLIC_SITE_URL`.
- **Additional Redirect URLs** = ongeza `http://localhost:3000/auth/callback`, na
  `https://ANWANI_YAKO/auth/callback` utakapochapisha.

Bila ruhusa hiyo, magic link utatoa kosa la "redirect URL is not allowed".

### c) Washe tovuti

```bash
npm install
npm run dev        # http://localhost:3000
```

Ukibadilisha `.env.local`, simamisha (`Ctrl+C`) kisha uwashe upya `npm run dev`.

### d) Kuwa msimamizi

Jiandikishe kwenye `/login` kwa barua pepe yako kwanza — bila hapo profaili yako haipo
bado. Kisha endesha hii katika **SQL Editor**:

```sql
update public.profiles p
   set is_admin = true
  from auth.users u
 where p.id = u.id
   and u.email = 'barua@yako.com';
```

Kumbuka: **`public.profiles` haina safu ya `email`**. Barua pepe inaishi kwenye
`auth.users` (Supabase → **Authentication → Users**), na `profiles` huunganishwa nayo
kwa `id` pekee. Ukandika `where email = …` kupata
`ERROR: 42703: column "email" does not exist` — hiyo ndiyo sababu; tumia `from auth.users`
kama hapo juu. Safu za `profiles` ni `full_name, phone, hall, avatar_path, is_admin,
created_at, updated_at` tu.

Profaili huundwa yenyewe na trigger `on_auth_user_created` (`handle_new_user()`) mtu
akapita kwenye `auth.users`; kwa hivyo ikiwa `update` inarudisha `0 rows`, maana yake
huyo mtu bado hajawahi kuingia — aache kufungua `/login` na kutuma kiungo kwanza.

Thibitisha:

```sql
select u.email, p.full_name, p.is_admin
  from auth.users u
  join public.profiles p on p.id = u.id
 order by p.created_at desc;
```

Msimamizi huweza kupitisha biashara (`/dashboard/review`), kuandika habari za `/news`
na kutuma malipo kwa wauzaji (`/dashboard/payouts`).

### e) Njia za kuingia: Google na Kitambulisho cha Chuo

Kadi ya `/login` ina mistari mitatu:

- **Ingia au jisajili kwa barua pepe** — hii ndiyo njia inayofanya kazi sasa. Kiungo
  kimoja cha magic link hufanya kazi kama kuingia *na* kujisajili: ikiwa barua pepe
  haipo kwenye `auth.users`, Supabase haitengeneza (na trigger huunda `profiles`),
  ikiwa ipo, unaingia tu.
- **Endelea na Google** — kitufe halisi (`signInWithOAuth`) lakini kinafanya kazi tu
  ukiiwasha:
  1. Google Cloud Console → **OAuth consent screen** (External) → tengeneza **OAuth client
     ID** (type: Web application).
  2. Authorized redirect URI = `https://<project-ref>.supabase.co/auth/v1/callback`.
  3. Supabase → **Authentication → Sign In / Providers → Google** → onyesha Client ID na
     Client Secret kutoka hatua ya 1.
  4. Rudisha kwenye **URL Configuration** uhakikishe `/auth/callback` iko kwenye Redirect
     URLs (hatua (b)).
  Bila kuiiwasha, Supabase hujibu `Unsupported provider: provider is not enabled`, na
  ujumbe huo huonekana kwenye kadi — si hitilafu ya msimamo.
- **Endelea na kitambulisho cha chuo** — imewekwa lebo ya **Karibu hivi karibuni / Coming
  soon** kwa sababu IAA bado haina mfumo wa uthibitishia wa chuo (SSO/LDAP) tunaweza
  kuunganisha naye. Kitufe kimezimikwa makusudi ili kisiwahasishe watumiaji; kitawashwa
  chuo kitakapotoa mfumo huo.

Ukibofya kiungo cha zamani au kilichotumika tayari, `/auth/callback` hurudisha sababu
(mf. `Email link is invalid or has expired`) kwenye `/login` kama panel nyekundu, na
`?next=` hubaki pale, hivyo unarudi mahali ulipotaka kwenda baada ya kutuma kiungo kipya.

### f) Weka SMTP (ili barua pepe za kuingia zifike)

Tulipopima mzunguko wa kuingia, Supabase alijibu `email rate limit exceeded`. Mailer ya
default ya Supabase huruhusu takriban **barua pepe 2 kwa saa** na hutuma kutoka
`notice@supabase.co` — haitoshi soko halisi. Suluhu ni SMTP yako, na inawekwa kwenye
dashboard pekee (si katika `schema.sql` wala `.env.local`).

**Chaguo letu: Brevo** (bure, barua pepe 300 kwa siku)

1. Fungua [brevo.com](https://www.brevo.com) → tengeneza akaunti → **Settings → SMTP & API**.
2. Nakili vitu viwili vilivyo kwenye ukurasa huo:
   - **Login** — anwani ya barua pepe inayoonekana kwenye sehemu ya *Login* (si hostname;
     usitumie `smtp-relay.brevo.com` kama login).
   - **SMTP Key** — bonyeza *Generate a new SMTP Key* (huanza kwa `xkeysib-…`).
3. Ili barua pepe zisiende spam: **Senders / Domains → Add Domain** → nakili rekords za
   **SPF na DKIM** kwenye DNS ya domeini yako → subiri "Verified". Chaguo dogo: thibitisha
   anwani moja ya barua pepe kama *sender*.
4. Supabase → **Authentication → SMTP Settings** → jaza:

   | Sehemu | Thamani |
   | --- | --- |
   | Host | `smtp-relay.brevo.com` |
   | Port | `465` (SSL) — au `587` (TLS), au `2525` kama port zingine zimekwama |
   | Username | **Login** kutoka Brevo (hatua 2) |
   | Password | **SMTP Key** kutoka Brevo (`xkeysib-…`) |
   | Sender Email | anwani/domeini uliyothibitisha kwenye Brevo |
   | Sender Name | `IAA Marketplace` |

5. Bonyeza **Save**. Mabadiliko hutumika moja kwa moja — hakuna kitu cha kurestart.

Chaguo lingine: Resend (`smtp.resend.com`, port `465`, username `resend`, password `re_…`),
Mailgun, SendGrid, AWS SES — host/port/username/password pekee ndiyo zinazohitajika.

#### Makosa mawili ya Brevo yanayowakama watu mara nyingi

1. **API key si SMTP key.** Brevo hutengeneza funguo mbili tofauti kwenye
   *Settings → SMTP & API*: **API key** (inaitwa REST API ya Brevo) na **SMTP key**
   (huyakaba *Generate a new SMTP key*). Supabase anahitaji **SMTP key**; ukiweka API key
   kwenye Password hupata `535 authentication failed / invalid credentials`. Yote miwili
   huanza kwa `xkeysib-…`, kwa hivyo angalia jina la kitufe ulichobofya, si mwendo wa funguo.
2. **Brevo hairuhusu kutuma kutoka domeini ambayo huna.** anwani ya `@gmail.com` au `@yahoo.com`
   au anwani nyingine yoyote isiyo domeini yako hupata `550 Domain is not verified`.
   Lazima uongeze domeini yako (**Senders / Domains → Add Domain**) na SPF + DKIM zipite,
   kisha utumie anwani iliyo chini yake (mf. `barua@<domeini-yako>`).

#### Ukiwa huna domeini yako mwenyewe (k. mfumo wa kujaribia)

Tumia Gmail kama mailer ya Supabase — huhitaji domeini yako wala kulipa:

1. Fungua Gmail → **Manage Google Account → Security → 2-Step Verification → ON**.
2. Ndani ya ukurasa uleule → **App passwords** → tengeneza funguo la programu (16
   characters, bila nafasi). App password pekee ndiyo inayofanya; nanbari yako ya kawaida ya Gmail
   haitambui kwenye SMTP.
3. Supabase → **Authentication → SMTP Settings**:

   | Sehemu | Thamani |
   | --- | --- |
   | Host | `smtp.gmail.com` (au `smtp-relay.gmail.com`) |
   | Port | `465` (SSL) au `587` (TLS) |
   | Username | **ileile anwani ya Gmail** itakayotumia SMTP |
   | Password | App password ulilopata hatua 2 |
   | Sender Email | **ileile anwani** — Gmail hurudisha ujumbe ukituma kutoka anwani nyingine |
   | Sender Name | `IAA Marketplace` |

Kikomo: takriban barua pepe 500 kwa siku, na barua pepe za Gmail zinaweza kuenda spam kwa
wanaotumia WhatsApp/Outlook. Inatosha kwa kujaribua na kuanza; ukipata domeini, rudi kwa Brevo.

### g) Kwa nini `.env.local` haibadilishi barua pepe

Programu yetu haitumi barua pepe yake — inamwambia Supabase atume. Vigezo ambavyo code husoma kutoka
`.env.local` (orodha kamili: `grep -r "process.env" src`) ni:

`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
`NEXT_PUBLIC_SITE_URL`, `SNIPPE_API_KEY`, `SNIPPE_WEBHOOK_SECRET`, `SNIPPE_PAYOUT_PHONE`,
`IAA_DEV_ORIGINS`.

Hakuna `EMAIL_PROVIDER`, `BREVO_API_KEY` wala `DEFAULT_FROM_EMAIL` katika code — ukiweka
kwenye `.env.local` hakuna kitu kinachoisoma, na Supabase haiangalii faili hiyo kamwe.
Maamuzi ya mailer (host/port/login/password) na maandishi ya barua pepe (template) viko
**dashboard ya Supabase** pekee, sehemu (f) na (h).

**Na API ya Brevo haitusaidii hapa.** `POST /v3/emailCampaigns` hutuma *kampeni za masoko*
kwenye orodha za wawasiliano (`recipients.listIds`) kwa ratiba (`scheduledAt`); barua pepe
za kuingia ni za **mtu mmoja, kwa wakati mmoja, ikiwa na OTP mpya**, kwa hivyo zinaenda
njia ya `POST /v3/smtp/email` — na ile hutumiwa na Supabase, ambayo huongea na Brevo kupitia
**SMTP** (host/port/username/password), si kupitia funguo la API. Kwa hivyo funguo la API ya
Brevo halina mahali pa kuenda katika mfumo huu isipokuwa tutakapotuma barua pepe zetu
mwenyewe (mf. risiti za oda).

### h) Kuingia kwa namba ya OTP — kwa wanaosoma barua pepe kwenye simu

Kiungo cha magic link hufanya kazi tu kwenye browser ileile iliyoomba (cookies za PKCE) —
kwa mtu anayefungua barua pepe kwenye simu, `localhost` haionekani. Kwa hivyo `/login`
ina pia kisanduku cha **namba ya OTP**: Supabase hutuma namba 6 au 8 (kulingana na mradi), mtumiaji haiandika kwenye
kompyuta, na `verifyOtp({ email, token, type: "email" })` hufungua session moja kwa moja
(bila kubofya kiungo).

Ili namba hiyo ionekana kwenye barua pepe, badilisha template:
**Supabase → Authentication → Email Templates → Magic Link** — weka `{{ .Token }}` ndani ya
body. Acha `{{ .ConfirmationURL }}` pia, kwa hivyo njia zote mbili (kiungo na namba)
hufanya kazi. Kiolegezeli tayari kutumika (rangi za IAA):

```text
Subject (SW): Ingia IAA Marketplace — namba yako ya OTP
Subject (EN): Sign in to IAA Marketplace — your OTP code
```

```html
<h1>IAA Marketplace</h1>
<p>Namba yako ya kuingia ni:</p>
<p style="font-size:32px;font-weight:800;letter-spacing:8px;color:#10497e;margin:16px 0">
  {{ .Token }}
</p>
<p>Iandike kwenye ukurasa wa kuingia. Namba hutumika mara moja tu na huisha baada ya muda mfupi.</p>
<p>Au bofya kitufe hiki kwenye kompyuta ileile uliyotumia ombi:</p>
<p style="margin:24px 0">
  <a href="{{ .ConfirmationURL }}"
     style="background:#10497e;color:#ffffff;padding:12px 22px;border-radius:10px;text-decoration:none">
    Ingia sasa
  </a>
</p>
<p>Ikiwa hujaomba barua pepe hii, puuza tu.</p>
```

**Usalama:** funguo la SMTP huishi **ndani ya Supabase pekee**. Lisiweke kwenye
`.env.local`, kwenye code, wala kwenye kivinjari — hakuna nambari ya programu yetu
inayohitaji. (Tofauti na `SNIPPE_API_KEY`, ambayo iko `.env.local` kwa sababu seva yetu
ndiyo inaiita Snippe.)

**Jaribio:** fungua `/login` → *Ingia au jisajili kwa barua pepe* → tuma → kisha **au**
ubofye kiungo kwenye browser ileile, **au** uandike namba ulizopata kwenye barua pepe.
Kwa njia ya namba unapaswa kuondoka `/login` ukafika `next` yako (mf. `/post`). Kosa
lolote linalojulikana — kikomo cha barua pepe, redirect isiyoruhusiwa, browser tofauti
(PKCE), namba isiyo sahihi/iliyoyisha muda, usajili uliozimwa — hupatikana kwa Kiswahili/EN
kwenye kadi, pamoja na ujumbe halisi wa Supabase chini yake; tengenezo liko katika
`hintFor()` ya `src/app/login/page.tsx`.

---

## 2. Mfumo unafanyaje kazi

### Mnunuzi

1. Anaingia `/msosi` (menyu za migahawa) au `/market` (bidhaa, vyumba, huduma).
2. Abofya kipande → **Agiza** → kikapu hukusanya vipande.
3. `/checkout` huonyesha jumla, gharama ya delivery na njia (kuchukua kwa muuzi au
   kupelekwa kwa anwani).
4. `POST /api/orders` huunda oda. **Bei, jina, picha na jumla huamuliwa na
   hifadhidata**, si na kivinjari:
   - `prepare_new_order` (before insert) huamua `kind`, `delivery_fee`,
     `payment_status = unpaid` na namba ya oda `IAA-YYMMDD-XXXXXXXX`;
   - `pin_order_item_price` (on `order_items`) huchukua bei kutoka rekodi ya muuzi na
     hukataa kipande cha muuzi mwingine;
   - `sync_order_total` huhesabu `items_total` na `total` baada ya kila mabadiliko.
5. Oda huonekana kwa mnunuzi (`/orders`) na kwa muuzi (`/dashboard/orders`). Kila
   mabadiliko ya hali huandikwa kwenye `order_events`, kwa hivyo historia haifutiki.
6. Malipo huanza kwenye `/orders/<id>` kwa kubofya **Lipa**.

### Muuzi

1. `/login` → `/dashboard` → **Fungua biashara mpya** (`/dashboard/business/new`):
   jina, aina (chakula / bidhaa / huduma), `slug`, simu na gharama ya delivery.
   Biashara mpya huwa `is_active = false`, kwa hivyo haionekani kwa umma.
2. Msimamizi (`/dashboard/review`) hupitisha biashara na kuweka alama ya **Verified**
   baada ya kuona nyaraka za muuzi.
3. Muuzi huongeza vitu: **Menyu** (`/dashboard/menu`) kwa migahawa, au
   **Matangazo** (`/dashboard/listings`) / **Weka tangazo** (`/post`) kwa bidhaa,
   vyumba na huduma.
4. Picha hupakiwa kutoka kivinjari moja kwa moja kwenye Supabase Storage
   (`media/<namba-yako>/…`): JPG, PNG au WebP, hadi 5MB kwa picha.
5. Muuzi hubadilisha hatua za oda (`pending → confirmed → preparing → ready →
   completed`) kwenye `/dashboard/orders`.
6. Oda za **chakula** tu ndizo zinazoomba saa: kwenye `/checkout` mnunuzi huchagua
   "Haraka — sasa hivi" (`scheduled_at` inabaki `NULL`) au "Chagua saa"
   (`orders.scheduled_at`). Seva hukataa muda uliopita au uliozidi wiki mbili mbele,
   na muuzi huona kile ambacho mnunuzi aliomba kwenye `/dashboard/orders`.

### Pesa: kutoka kwa mnunuzi hadi kwa muuzi (Snippe)

Hii ni **hiari**. `SNIPPE_API_KEY` isipoowekwa, kila kitu kinafanya kazi lakini malipo
hukamilishwa mikononi (cash) — mfumo haudhani pesa imetolewa.

Kuiwasha:

1. Jaza `SNIPPE_API_KEY`, `SNIPPE_WEBHOOK_SECRET` na `SNIPPE_PAYOUT_PHONE` kwenye
   `.env.local`.
2. Kwenye dashboard ya Snippe weka webhook: `https://ANWANI_YAKO/api/webhooks/snippe`
   (lazima HTTPS, na `NEXT_PUBLIC_SITE_URL` iwe anwani hiyo hiyo).
3. Thibitisha anwani za API kwenye dokumenti za Snippe. `src/lib/snippe.ts` hutumia
   `POST https://api.snippe.sh/v1/payments` (kukusanya) na
   `POST https://api.snippe.sh/v1/disbursements` (kulipa muuzi), na kichwa
   `Authorization: Bearer <SNIPPE_API_KEY>`. Ikiwa akaunti yako inatumia majina au
   njia tofauti, pale (BASE_URL na `post()`) ndipo panaporekebishwa.

Mtiririko:

1. Mnunuzi abofya **Lipa** → `POST /api/payments` → Snippe hutuma `collection`
   (USSD push) kwenye simu yake; oda huwa `awaiting_payment`.
2. Snippe ikithibitisha pesa hutuma webhook → `POST /api/webhooks/snippe`. Ombi
   hukataliwa (`401`) lisilo na saini sahihi ya HMAC-SHA256 ya mwili mbichi
   (`x-snippe-signature`, `snippe-signature` au `x-signature`), na hukataliwa (`503`)
   ikiwa `SNIPPE_WEBHOOK_SECRET` haijawekwa.
3. Webhook huweka `payment_status = paid` na kuunda **foli ya malipo** (`payouts`):
   `amount = total − 2.5%` (toleo la Snippe), `status = queued`. Foli moja tu kwa oda
   (`payouts_order_key`), na oda iliyolipwa haibadilishwi tena — hivyo webhook inayofika
   mara mbili haiongezi pesa.
4. Oda ikikamilika, msimamizi anaenda `/dashboard/payouts` na kubofya **Tuma pesa** →
   `POST /api/payouts` → Snippe `disbursement` kwenye namba ya muuzi. Hali huwa
   `processing` → `sent` (au `failed` pamoja na ujumbe wa kosa). Namba ya muuzi
   inaweza kurekebishwa kabla pesa haijatumwa. Malipo hayatumwi ikiwa oda haijakamilika
   au haijalipwa.

Snippe haina mgawanyo wa pesa (split payment), kwa hivyo fedha hupita kwenye namba ya
mfumo/IAA kwanza, kisha hulipwa kwa wauzaji kupitia foli hizo.

### Kwa nini mtu hawezi kuiba bei au kulipwa uongo

- Trigger `protect_order_columns` huzuia `anon` na `authenticated` kubadilisha safu za
  pesa (`payment_status`, `provider`, `provider_payment_id`, `payment_channel`, `total`,
  `items_total`, `delivery_fee`, `reference`, `kind`, `buyer_id`, `business_id`);
  thamani zake hurudishwa kwenye rekodi. `service_role` pekee ndiyo huruhusiwa.
- Muuzi huruhusiwa kubadilisha `status` pekee; mnunuzi huruhusiwa kughairi oda iliyo
  `pending` na kurekebisha maelezo yake kabla oda haijachakatwa.
- RLS huamua anayeona nini: umma huona `businesses` zenye `is_active`, `listings`
  zenye `status in ('active','sold')` na vipande vya menyu yenye `is_available` pekee.
- `SUPABASE_SERVICE_ROLE_KEY` hupuuza RLS, kwa hivyo inatumika kwenye njia za seva pekee
  (`src/lib/supabase/admin.ts`). **Usiweke kwenye nambari yoyote ya kivinjari.**

---

## 3. Lugha (SW / EN)

Kubofya **EN** au **SW** kwenye kichwa ni kiungo cha kawaida cha
`/api/lang?lang=sw|en` ([`src/app/api/lang/route.ts`](src/app/api/lang/route.ts)):
seva huweka cookie `iaa_lang`, kisha hurudisha mtumiazi kwenye ukurasa
aliokuapo (njia + vigezo vyote, mf. `/checkout?business=choma`). Kwa sababu
mabadiliko huanza na kwenda kwa seva, kurasa zote — layout, Navbar, Footer na
kurasa za dashboard — hujengwa upya kwa lugha hiyo, `<html lang>` hubadilika, na
hakuna sehemu inayoweza kuacha lugha nyingine.

Kibadilishi hakitegemei JavaScript: hata kama JavaScript ya dev haijapakia
(simu kupitia `http://192.168.x.x:3000`), kubofya EN/SW hubadilisha lugha.

- Kamusi zote zipo kwenye
  [`src/lib/translations.ts`](src/lib/translations.ts): `sw` ni chanzo, `en` imepangwa
  kwa aina ileile (`const en: Dict = typeof sw`). EN ikikosa ufunguo, `tsc` hutoa kosa —
  kwa hivyo hakuna ukurasa unaoacha maandishi ya Swahili nyuma.
- Maandishi yaliyoandikwa na watumiaji (majina ya bidhaa, maelezo, habari) hubaki kama
  yalivyo; hutafsiriwa mipaka ya mfumo pekee.

---

## 4. Nembo, picha za uani na icon ya programu

Faili halisi zimewekwa kwenye `public/iaa/`:

| Faili | Matumizi |
| --- | --- |
| `public/iaa/iaa-logo.png` | nembo kamili (pamoja na jina) kwenye ukurasa wa mwanzo |
| `public/iaa/iaa-crest.png` | nembo peyo kwenye Navbar na ukanda wa chuo |
| `public/iaa/campus-main.png`, `public/iaa/campus-block.png` | slaidi za onyesho la hero (`src/lib/home-slides.ts`) |
| `src/app/icon.png`, `src/app/apple-icon.png`, `src/app/favicon.ico` | icon ya tab/simu: mfuko wa duka lenye nembo ya IAA |

- Picha zote za `public/` hazihitaji ruhusa ya `images.remotePatterns` (ruhusa iko
  kwa host ya Supabase Storage pekee), kwa hivyo `next/image` huziprosesa nyumbani.
- Maandishi ya `alt` (yasayomasomwa na programu za kusaidia walemavu) yapo
  kwenye kamusi: `t.home.logoAria`, `t.home.photoAria1/2`, `t.home.photoNote`
  (chanzo cha picha: `arusha.iaa.ac.tz` na `thecitizen.co.tz`) na maandishi ya
  kila slaidi katika `t.home.slides[n]`.
- **Onyesho la hero (slideshow):** `src/components/HeroSlides.tsx` husoma orodha
  ya `src/lib/home-slides.ts`; ukurasa hauzingati picha moja kwa moja. Kuongeza
  slaidi mpya = mstari mmoja kwenye `homeSlides` + mojawapo kwenye
  `t.home.slides` (Kiswahili na Kiingereza). Slaidi isiyo na `src` huonyesha
  paneli ya chapa (bluu ya IAA) badala ya picha.
- Kubadilisha picha: nakili faili jipya kwa majina hayo hayo katika `public/iaa/`,
  kisha pakia upya kwa nguvu (`Shift+F5`). Kwa icon, nakilisha `src/app/icon.png`.
- Picha ya tatu ya majengo iliyotumwa awali imetoka `africatechschools.com`, si
  chuo, kwa hivyo haijawekwa — usiweke kitu cha uongo kwa kupaka uzuri.

### a) Fonti

`src/app/layout.tsx` hupakia fonti kupitia `next/font/google` (hupakeliwa kwenye
seva wakati wa kujenga — hakuna ombi la Google kwa muda wa kutumia):

- `Sora` → `--font-heading`, inaenda kwenye `font-display` na vichwa vyote
  (`h1`–`h4`) kupitia `@layer base` katika `globals.css`.
- `Plus Jakarta Sans` → `--font-body`, ya maandishi ya kawaida (`font-sans`).

`@theme inline` katika `globals.css` ndiyo inayounganisha vivala hivyo na
lugha za Tailwind. `--font-sans: "Inter"` ya zamani haikufanya kazi: `next/font`
hutoa jina lililobadilishwa (mf. `__Sora_1eb99ec8`), kwa hivyo jina la maandishi
haliendani na fonti iliyopakeliwa.

### b) Mwendo (animations)

`--animate-kenburns`, `--animate-pop-in` na `--animate-rise` zimeundwa ndani ya
`@theme` pamoja na `@keyframes` zake. Lazima ziwe ndani ya `@theme`: nje yake,
mfupulizi wa CSS huona jina hilo likitumika kupitia `var(--animate-…)` pekee
na huziondosa `@keyframes` (mwendo unakufa kimya kimya). `prefers-reduced-motion`
huzima zote, na `HeroSlides` ha ziweki kabisa.


Usiweke madai ya uongo (mf. "tuna wanafunzi 5,000", "ilianzisha 2019") — ukurasa
unaonyesha tu kilichopo kwenye hifadhidata.

---

## 5. Matatizo ya kawaida

| Kinachotokea | Maana yake | Tatizo |
| --- | --- | --- |
| `Invalid API key` / `Double check your Supabase anon or service_role API key` | Fungo si la mradi huo, limeharibika, au lina nafasi/ziada | Nakili upya kutoka Project Settings → API; hakikisha `KEY=thamani` bila nafasi; hakikisha URL na fungo ni za mradi mmoja |
| `Could not find the table 'public.businesses'` (`PGRST205`) | Fungo ni sahihi, lakini schema haijatumika bado | Endesha `supabase/schema.sql` katika SQL Editor |
| `Could not find the 'scheduled_at' column of 'orders' in the schema cache` | Oda iliona **Chagua saa**, lakini mradi wako una jedwali la zamani | SQL Editor: `alter table public.orders add column if not exists scheduled_at timestamptz;` |
| `Bucket not found` (`media`) | Schema haijatumika, au kikapu kimefutwa | Schema huunda kikapu `media` (public) |
| Kurasa zinaonyesha `SetupNotice` | `.env.local` haipo, au `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` ni tupu | Jaza fungo, kisha uwashe upya `npm run dev` |
| Magic link haifiki au hurejesha kosa | Redirect URL haijaruhusiwa, au kikomo cha barua pepe za default cha Supabase kimefikwa | Ongeza `/auth/callback` kwenye Redirect URLs; weka SMTP yako (Auth → SMTP) |
| `Blocked cross-origin request to Next.js dev resource` (unapotumia `http://192.168.x.x:3000`) | Next ya dev hupakia JavaScript kutoka anwani zilizo kwenye orodha pekee | Weka anwani unayotumia kwenye `IAA_DEV_ORIGINS` katika `.env.local` (mf. `192.168.1.20`), kisha uwashe upya `npm run dev`; au tumia `localhost` |
| Kubofya EN/SW hakubadilishi kitu | Kibadilishi ni kiungo cha kwenda `/api/lang`; ikiwa seva imesimama au ukurasa ni wa zamani, hakuna kitu kinachotokea | Pakia upya (`Shift+F5`); hakikisha `npm run dev` inakimbia; fungua `/api/lang?lang=en` ili kuona kosa la seva |
| `ERROR: 42703: column "email" does not exist` (SQL Editor) | `public.profiles` haina `email`; barua pepe ipo kwenye `auth.users` | Tumia `update public.profiles p set is_admin = true from auth.users u where p.id = u.id and u.email = '…'` — ona hatua (d) |
| `update … 0 rows` (kuwa msimamizi) | Profaili huundwa baada ya mtumiaji kuingia mara ya kwanza | Aingie `/login` kwa kiungo cha barua pepe kwanza, kisha urudie `update` |
| Kitufe cha Google kinarudisha ujumbe wa kosa | provider ya Google haijawashwa kwenye Supabase, au redirect URI ya Google Cloud si sahihi | Fuata hatua (e); badala yake tumia "Ingia au jisajili kwa barua pepe" |
| `Email link is invalid or has expired` kwenye `/login` | Kiungo cha magic link hutumika mara moja na huisha baada ya dakika chache; au ulikifungua kwenye browser tofauti na ile iliyoomba | Tuma kiungo kipya kwenye browser ileile; onyo husimama ukibofya "Ingia au jisajili" |
| `email rate limit exceeded` (unapotuma kiungo) | Mailer ya default ya Supabase ina kikomo kidogo (takriban 2 barua pepe kwa saa kwa mradi) | Weka Brevo SMTP kama hatua (f) inavyoonyesha, kisha uombe kiungo upya |
| Brevo: `535 authentication failed` baada ya Save | Uliweka **API key** kwenye Password badala ya **SMTP key**, au ulitumia `smtp-relay.brevo.com` kama Username badala ya **Login** | Ona hatua (f) → "Makosa mawili ya Brevo"; tengeneza SMTP key mpya |
| Brevo: `550 Domain is not verified` | Sender Email iko kwenye domeini ambayo huna (mf. `@gmail.com`) au haijathibitishwa | Thibitisha domeini yako kwenye Brevo, au tumia Gmail app password kama hatua (f) → "Ukiwa huna domeini" |
| `PKCE code verifier not found in storage` | Kiungo kilifunguliwa kwenye browser/device tofauti na ile iliyoomba, au cookies za `localhost` zimefutwa | Tumia njia ya **namba ya OTP** — hatua (h) — au fungua kiungo kwenye browser ileile uliyotumia `/login` |
| Namba za OTP zinaonekana **8** lakini kisanduku kilikataa | Supabase hutuma namba 6 au 8 kulingana na mpangilio wa mradi (`OTP_LENGTH`); kisanduku chetu huruhusu 6 hadi 8 | Andika namba zote ulizopata kwenye barua pepe — kitufe cha "Thibitisha" huwasha tikakamilisha namba 6 au zaidi |
| `WebCrypto API is not supported. Code challenge method will default to use plain instead of sha256` (browser) | Unafungua tovuti kutoka anwani isiyo secure — `crypto.subtle` haipatikani nje ya `https://` na `http://localhost`/`127.0.0.1`, mf. `http://192.168.x.x:3000` | Onjoro tu, si kosa: kiungo bado kitafanya kazi (kwenye browser ileile). Ukipenda kuona safi, tumia `http://localhost:3000`, au upatie HTTPS kwa simu (tunnel ya mf. `cloudflared`) na usasishe `NEXT_PUBLIC_SITE_URL`. **Njia ya namba ya OTP haiathiriwi** — `verifyOtp` haitumii PKCE, kwa hivyo hufungua session kwenye browser yoyote |
| `supabase.auth.signInWithOauth is not a function` (browser) | Kibadili-haraka (Fast Refresh) kiliacha bundle ya zamani baada ya mabadiliko ya `translations.ts` | Pakia upya kwa nguvu: `Shift+F5` kwenye `/login` |

Ukosa wowote wa hifadhidata huonyeshwa na `src/app/error.tsx`: ujumbe wa kweli (SW/EN)
pamoja na ujumbe uliotoka kwa seva, badala ya ukurasa kuanguka.

---

## 6. Muundo wa msingi

```
src/app/                 kurasa (App Router) + njia za API
  api/orders             kuunda oda
  api/payments           kuanza kukusanya pesa (Snippe collection)
  api/payouts            kutuma au kurekebisha malipo ya muuzi (msimamizi)
  api/webhooks/snippe    uthibitisha saini, weka hali ya malipo, funga foli mpya
  api/lang               kubadilisha cookie ya lugha kisha kurudisha ukurasa
  auth/callback          PKCE: kubadilisha `code` kuwa session
src/components/          fomu, dasibodi, vipande vya UI (LangToggle, HeroSlides)
src/context/             LanguageContext (hupokea lugha kutoka kwa seva) + AuthContext
src/lib/                 data, db, i18n, i18n-server, translations, home-slides (orodha ya hero), media, payouts, snippe, supabase/*
src/proxy.ts           cookie za session na lugha (Next 16: proxy, sio middleware)
supabase/schema.sql      jedwali, RLS, triggers, Storage, habari (mpango: jedwali -> kazi -> triggers -> RLS -> Storage)
```

## 7. Kabla ya kuchapisha

```bash
npm run lint
npx tsc --noEmit
npm run build
npm start
```

- Weka `NEXT_PUBLIC_SITE_URL` = anwani halisi ya HTTPS — magic link na webhook
  zinategemea.
- Ongeza `https://ANWANI_YAKO/auth/callback` kwenye Supabase Redirect URLs.
- Webhook ya Snippe huhitaji anwani ya nje ya HTTPS.
- Hakikisha `SUPABASE_SERVICE_ROLE_KEY` na `SNIPPE_API_KEY` vipo kwenye mazingira ya seva
  pekee (sio kwenye build ya kivinjari).

## 8. Data halisi

Hakuna seed, hakuna data ya majaribio, hakuna emojis za mapambo. Orodha tupu huonyesha
ujumbe wazi ("hakuna matangazo bado"), na kila bei, picha na hali ya malipo inatokana na
rekodi ya hifadhidata. Weka data yako mwenyewe — mfumo utaonyesha uhalisia wa kile
kilichowekwa.

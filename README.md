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

Bila ruhusa hiyo, kiungo cha kuthibitisha barua pepe au cha kurejesha nenosiri
hutatoa kosa la "redirect URL is not allowed".

Ndani ya Supabase → **Authentication → Sign In / Providers → Email** hakikisha
**Enable Email provider** imewaka na **Confirm email** imewashwa (ndiyo mpangilio
salama). Ukiiacha imezimwa, mtumiaji huingia papema baada ya kujisajili.

### c) Washe tovuti

```bash
npm install
npm run dev        # http://localhost:3000
```

Ukibadilisha `.env.local`, simamisha (`Ctrl+C`) kisha uwashe upya `npm run dev`.

### d) Kuwa msimamizi

Jiandikishe kwenye `/login` kwa barua pepe, nenosiri na namba ya simu kwanza — bila hapo
profaili yako haipo bado. Kisha endesha hii katika **SQL Editor**:

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
huyo mtu bado hajajisajili kamili au hajathibitisha barua pepe — aache kukamilisha
`/login` kwanza. Trigger hiyo hiyo huhifadhi namba ya simu aliyoiweka wakati wa
kujisajili (`raw_user_meta_data ->> 'phone'`) ndani ya `profiles.phone`.

Thibitisha:

```sql
select u.email, p.full_name, p.is_admin
  from auth.users u
  join public.profiles p on p.id = u.id
 order by p.created_at desc;
```

Msimamizi huweza kupitisha biashara (`/dashboard/review`), kuandika habari za `/news`
na kutuma malipo kwa wauzaji (`/dashboard/payouts`).

### e) Njia za kuingia: barua pepe + nenosiri, Google, na Kitambulisho cha Chuo

Kadi ya `/login` ina tabo mbili — **Ingia** na **Jisajili** — chini ya kitufe cha Google.

- **Ingia** — barua pepe na nenosiri pekee (`signInWithPassword`). Anayesahau nenosiri
  anabofya **Umesahau nenosiri?** na kwenda `/reset-password`.
- **Jisajili** — vyuo vitatu tu: **barua pepe, namba ya simu na nenosiri**. Namba ya
  simu ni ya lazima kwa sababu ndiyo anwani ya taarifa za oda na malipo; inahifadhiwa
  kama `2556xxxxxxxx` kupitia metadata ya `signUp` na trigger `handle_new_user` huiweka
  kwenye `profiles.phone`. Hakuna jina linaloombwa — mtumiaji anaweza kuliongeza baadaye
  kwenye dashibodi.
- **Uthibitisho wa barua pepe** — `signUp` hutuma kiungo cha *Confirm signup*. Kama
  `Confirm email` imewashwa, mtumiaji huona hatua ya "Angalia barua pepe yako" na kitufe
  cha kutuma tena; akibofya kiungo, `/auth/callback` hubadilisha code kuwa session na
  kumpeleka `next` (kwa default `/dashboard`).
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

**Kurejesha nenosiri:** `/reset-password` huanza kwa kuomba barua pepe
(`resetPasswordForEmail`); kiungo hurudi `/auth/callback?next=/reset-password`, ambako
ukurasa huo hutambua session na kuonyesha fomu ya nenosiri jipya (`updateUser`). Bila
session, huonyesha fomu ya kuomba kiungo.

Kiungo cha zamani au kilichotumika tayari hurudisha sababu (mf. `Email link is invalid
or has expired`) kwenye `/login` kama panel nyekundu, na `?next=` hubaki pale, hivyo
unarudi mahali ulipotaka kwenda.

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

**Tofautisha funguo mbili za Brevo** (moja haina maana bila nyingine):

| Kazi | Fungo | Wapi |
| --- | --- | --- |
| Barua pepe za **uthibitisho wa akaunti na kurejesha nenosiri** (template za Supabase) | **SMTP Key** (`xkeysib-…`) + Login | Supabase dashboard → Authentication → SMTP Settings (hatua 4) |
| Barua pepe za **oda** (`src/lib/brevo.ts`) | **Email API key** (Transactional) | `.env.local` → `BREVO_API_KEY`, `NOTIFY_EMAIL_FROM` |

Kwa hivyo barua pepe za uthibitisho **hazitoki** kwenye code yetu — zinatoka Supabase
ikipitia Brevo; na ujumbe wa oda hutumwa na programu kupitia API. Akaunti moja ya Brevo
inatosha zote mbili, lakini lazima uweke funguo zote mbili mahali pake. Ona pia "Ujumbe
wa oda" katika sehemu 2 na hatua (h) chini ya hii kwa template za uthibitisho na
kurejesha nenosiri.

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
`NEXT_PUBLIC_SITE_URL`, `SNIPPE_API_KEY`, `SNIPPE_WEBHOOK_SECRET`, `BREVO_API_KEY`,
`NOTIFY_EMAIL_FROM`, `NOTIFY_EMAIL_NAME`, `NEXTSMS_API_TOKEN`, `NEXTSMS_SENDER_ID`,
`IAA_DEV_ORIGINS`.

Majina ya zamani kama `EMAIL_PROVIDER`, `DEFAULT_FROM_EMAIL` na `SNIPPE_PAYOUT_PHONE` hayasomwi
na code — ukiyaweka kwenye `.env.local` hakuna kitu kinachoyatumia. Supabase haiangalii faili
hiyo kamwe.
Maamuzi ya mailer (host/port/login/password) na maandishi ya barua pepe (template) viko
**dashboard ya Supabase** pekee, sehemu (f) na (h).

**Na API ya Brevo haitusaidii hapa.** `POST /v3/emailCampaigns` hutuma *kampeni za masoko*
kwenye orodha za wawasiliano (`recipients.listIds`) kwa ratiba (`scheduledAt`); barua pepe
za uthibitisho ni za **mtu mmoja, kwa wakati mmoja**, kwa hivyo zinaenda njia ya
`POST /v3/smtp/email` — na ile hutumiwa na Supabase, ambayo huongea na Brevo kupitia
**SMTP** (host/port/username/password), si kupitia funguo la API. Kwa hivyo funguo la API ya
Brevo halina mahali pa kuenda katika mfumo huu isipokuwa tutakapotuma barua pepe zetu
mwenyewe (mf. risiti za oda).

### h) Template za barua pepe: uthibitisho na kurejesha nenosiri

Mfumo hutuma barua pepe mbili tu za Supabase:

- **Confirm signup** — baada ya mtu kujisajili (`signUp`). Kiungo hiki humfikisha
  `/auth/callback`, ambako code hubadilishwa kuwa session. Kitufe cha **Tuma tena**
  kwenye `/login` hutumia `resend({ type: "signup" })`.
- **Reset password** — baada ya kuomba kwenye `/reset-password`
  (`resetPasswordForEmail`). Kiungo hurudi `/reset-password` baada ya `/auth/callback`.

**Supabase → Authentication → Email Templates** — weka `{{ .ConfirmationURL }}` **na**
`{{ .Token }}` kwenye template ya *Confirm signup*. Kiungo hufanya kazi kwenye kivinjari
kilekile; namba huiwezesha mtu aliyeona barua pepe kwenye simu kuthibitisha bila kubofya
kiungo. Kiolegezeli cha Kiswahili (rangi za IAA):

```text
Subject (SW): Thibitisha akaunti yako — IAA Marketplace
Subject (EN): Confirm your account — IAA Marketplace
```

```html
<h1>IAA Marketplace</h1>
<p>Karibu! Bofya kitufe hiki kuthibitisha barua pepe yako na kuanza kutumia soko.</p>
<p style="margin:24px 0">
  <a href="{{ .ConfirmationURL }}"
     style="background:#10497e;color:#ffffff;padding:12px 22px;border-radius:10px;text-decoration:none">
    Thibitisha akaunti
  </a>
</p>
<p>Au andika namba hii kwenye ukurasa wa uthibitisho:</p>
<p style="font-size:30px;font-weight:800;letter-spacing:8px;color:#10497e">{{ .Token }}</p>
<p>Ikiwa hukujisajili, puuza barua pepe hii.</p>
```

Kwa **Reset password**, tumia muundo uleule lakini maandishi "Weka nenosiri jipya" na
kiungo cha `{{ .ConfirmationURL }}`.

> **Muhimu:** kama barua pepe haifiki kabisa, tatizo si template — ni SMTP. Bila SMTP
> ya Brevo (hatua (f)), mailer ya default ya Supabase hutuma mara chache tu na mara nyingi
> huishia Spam. Ukirudia kujisajili kwa barua pepe ambayo **ina akaunti tayari**, Supabase
> huonyesha tu "imetumwa" bila kutuma chochote (kinga ya kutambua akaunti); fomu sasa
> inakugundua na kukuelekeza kwenye **Ingia** / **Umesahau nenosiri?**.

**Usalama:** funguo la SMTP huishi **ndani ya Supabase pekee**. Lisiweke kwenye
`.env.local`, kwenye code, wala kwenye kivinjari — hakuna nambari ya programu yetu
inayohitaji. (Tofauti na `SNIPPE_API_KEY`, ambayo iko `.env.local` kwa sababu seva yetu
ndiyo inaiita Snippe.)

**Jaribio:** fungua `/login` → tabo **Jisajili** → barua pepe, namba ya simu na nenosiri
→ *Fungua akaunti*. Kama uthibitisho umewashwa, utaona hatua ya "Angalia barua pepe
yako"; bofya kiungo kwenye barua pepe na ufike `/dashboard`. Kisha toka, ingia tena kwa
tabo **Ingia**, na ujaribu **Umesahau nenosiri?** → barua pepe → kiungo → nenosiri jipya.
Kosa lolote linalojulikana — kikomo cha barua pepe, redirect isiyoruhusiwa, nenosiri
fupi, akaunti iliyopo, namba isiyo sahihi, usajili uliozimwa — hupatikana kwa
Kiswahili/EN kwenye kadi, pamoja na ujumbe halisi wa Supabase chini yake; tengenezo liko
katika `hintFor()` ya `src/app/login/page.tsx`.

---

## 2. Mfumo unafanyaje kazi

### Mnunuzi

1. Anaingia kwenye moja ya kurasa hizi — kila moja ina maana yake:
   - `/msosi` — menyu za migahawa ya uani (chakula pekee);
   - `/market` — bidhaa za mkononi, na tab ya **Vyumba** ndani yake;
   - `/vyumba` — ukurasa wa peke wake wa vyumba na nafasi za kukaa. Bei huandikwa
     **kwa mwezi**, na chumba **hakilipwi** kupitia `/checkout`: mnunuzi anapanga
     muda wa kuiona na mmiliki kwanza;
   - `/services` — huduma halisi zenye bei ya kweli (fundi simu, kinyozi, shwari,
     nguo, umeme, karatasi, usafi, masomo, hesabu…), kila moja ikiwa chini ya
     kichujio cha utaalamu wake.
   Ukurasa wa biashara yoyote — chakula, bidhaa au huduma — uko `/duka/<slug>`.
   Kiungo cha zamani `/msosi/<slug>` kinaelekezwa papema huko (`redirects()` katika
   `next.config.ts`), kwa hivyo viungo vilivyoshirikiwa havivunjiki.
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
7. Ukurasa wa **Checkout** una sehemu tatu za ziada zinazotoka kwenye data halisi:
   - **Vinywaji na viongezo** — vipande vyote vingine vya muuzaji huyo vilivyoko
     kwenye `menu_items`; mnunuzi huviongeza hapa hapo bila kufungua oda nyingine.
   - **Ofa** — punguzo ambalo muuzaji mwenyewe aliweka (`offers`); kivinjari hutuma
     `offer_id` peke yake, nne ya punguzo huhesabiwa na seva.
   - **Mahali pa kukutana** (`orders.meetup_point`) — mnunuzi anayechagua
     kuchukua mwenyewe au pre-order huandika anwani ya kukutia; gharama ya
     delivery inabaki 0.
8. Oda inapowekwa hali `completed`, mnunuzi hupokea **fomu ya maoni** kwenye
   `/orders/<id>`: nyota 1–5 na maoni, na anaweza kuchagua kipande maalum cha menyu
   anachokikadirisha. Maoni ni ya umma na huonekana kwenye ukurasa wa menyu
   (`/msosi`), ukurasa wa bidhaa/tangazo (`/product/<id>`) na ukurasa wa biashara
   (`/duka/<slug>`); maoni ambayo msimamizi alificha (`is_hidden`) hayajumuishwi
   kwenye wastani wa nyota wala hawaonekani kwa umma.

### Ujumbe wa oda: SMS + barua pepe (NextSMS na Brevo)

Kila hatua ya oda hutangazwa kwa **mnunuzi** (SMS + barua pepe) na kwa **muuzi**
(SMS). Ujumbe hauandikwi kwenye kivinjari: `src/lib/notify.ts` husoma oda
**kutoka hifadhidata baada ya mabadiliko** (`orders`, `order_items`, `businesses`,
`profiles`, `app_settings` na barua pepe ya mnunuzi kutoka `auth.users`), kwa hivyo
nomba zinazotumwa ni zileile muuzi/anwani alizozitoa, si alizozituma mtumiaji.

Hatua zinazowasha ujumbe (`NotifyStage`):

| Hatua | Inayebadilisha | Mnunuzi apokea | Muuzi apokea |
| --- | --- | --- | --- |
| `created` | `POST /api/orders` | Karibu + vipande + jumla + njia + muda + kiungo cha kulipa | Oda mpya + vipande + jumla + muda + kiungo cha `/dashboard/orders` |
| `status` | `POST /api/orders/<id>/status` (muuzi au mnunuzi) | Hali mpya (`t.status`) + maagizo (mf. "Njoo ukichukue") | Hali mpya imethibitishwa |
| `paid` | webhook ya Snippe au msimamizi | Jumla iliyopokelewa + channel | Anza kuandaa |
| `failed` | webhook ya Snippe au msimamizi | Malipo hayakufaulu — jaribu tena | Mnunuzi atajaribu tena |
| `refunded` | msimamizi | Pesa imerejeshwa | Pesa imerejeshwa kwa mnunuzi |

Maandishi: SMS ni fupi lakini ina **jumla, njia (pickup/delivery), muda** (saa ya
`Africa/Dar_es_Salaam`) na kiungo; barua pepe ni **plain text** kamili — kila kipande
kwa bei yake, jumla ya vipande, punguzo la ofa, gharama ya delivery, JUMLA YOTE,
anwani/mahali pa kukutiana, ujumbe wa mnunuzi na kiungo cha `/orders/<id>`. Maneno ya
hali husomwa kutoka kamusi ileile ya UI (`dictFor("sw")`), kwa hivyo SMS, barua pepe na
ukurasa havapingani.

Usalama na uhalisia:

- **Kosa la mtoaji halifuti oda.** `notifyOrderStage()` hukamata makosa yote na kurudisha
  ripoti; oda inabaki imewekwa.
- **Kila jaribio huandikwa** kwenye `order_events` (`ujumbe: SMS mnunuzi imetumwa,
  barua pepe imeshindwa (402 …)`) — unaonekana kwenye historia ya oda. Hakuna
  "imertumwa" isiyo na ushahidi.
- Funguo zote ni za **seva pekee** (`NEXTSMS_API_TOKEN`, `NEXTSMS_SENDER_ID`,
  `BREVO_API_KEY`, `NOTIFY_EMAIL_FROM`, `NOTIFY_EMAIL_NAME`). Zikikosekana, ujumbe
  huzimwa kimya kimya (`isNextSmsConfigured` / `isBrevoConfigured`) na hakuna kitu
  kinachodhaniwa kimetendeka.
- Namba ya muuzi hutolewa na `businesses.phone` → `businesses.whatsapp` →
  `app_settings.support_phone`; namba ya mnunuzi ni `orders.contact_phone`.
  Nambari zisizo za TZ au fupi hukataliwa kabla ya kuomba SMS (`isUsableMsisdn`).
- **Gharama ni ya kweli:** bei ya NextSMS iliyoatangazwa wakati wa kuandika hizi ni
  takriban **TZS 16 kwa SMS moja** nchini TZ, na ujumbe mrekavu hukawanywa katika
  sehemu nyingi (kila sehemu hulipwa). Oda moja yenye hatua 5 hutuma SMS ~10 (mnunuzi +
  muuzi) — thibitisha bei yako kwenye dashboard kabla ya kuwasha. Barua pepe ya Brevo
  iko chini ya mpango wa bure wa transactional emails wa akaunti yako.

### Muuzi

1. `/login` → `/dashboard` → **Fungua biashara mpya** (`/dashboard/business/new`):
   jina, aina (chakula / bidhaa / huduma), `slug`, simu na gharama ya delivery.
   Biashara mpya huanza ikiwa hai (`is_active = true`), kwa hivyo muuzi huanza
   mara moja; alama ya `is_verified` huongezwa na msimamizi baada ya kuona
   nyaraka, naye anaweza kusimamisha biashara yoyote.
2. Msimamizi (`/dashboard/review`) hupitisha biashara na kuweka alama ya **Verified**
   baada ya kuona nyaraka za muuzi.
3. Muuzi huongeza vitu: **Menyu** (`/dashboard/menu`) kwa migahawa, au
   **Matangazo** (`/dashboard/listings`) / **Weka tangazo** (`/post`) kwa bidhaa,
   vyumba na huduma.
   Fomu ya `/post` hugawanya aina katika makundi matatu — **Bidhaa**, **Vyumba**,
   **Huduma** — ili mtu asichague kwa makosa. Kundi la mwanzo huamua jinsi tangazo
   linaonekana kwenye kurasa za umma: bidhaa huenda `/market`, chumba huenda
   `/vyumba` (na tab ya Vyumba kwenye `/market`), huduma huenda `/services` chini ya
   utaalamu wake (mf. `phone_repair` → *Urekebishaji wa simu*).
   Swali la "hali ya bidhaa" (*Mpya · Karibu mpya · Ilitumika*) linaonekana kwa
   **bidhaa pekee**; vyumba na huduma si vitu vilivyotumika, hivyo fomu hutuma
   `condition = 'new'` ambayo haiionyeshwi popote. `listings.category` bado ni uwanja
   huru (hakuna CHECK), kwa hivyo kuongeza utaalamu mpya hakuhitaji mabadiliko ya
   hifadhidata — orodha iko katika `src/lib/data.ts` (`serviceCategoryIds`) na majina
   yake katika `src/lib/translations.ts` (`categories`).
4. Picha hupakiwa kutoka kivinjari moja kwa moja kwenye Supabase Storage
   (`media/<namba-yako>/…`): JPG, PNG au WebP, hadi 5MB kwa picha.
5. Muuzi hubadilisha hatua za oda (`pending → confirmed → preparing → ready →
   completed`) kwenye `/dashboard/orders`.
6. **Ofa** (`/dashboard/offers`): muuzaji anaweka jina, asilimia ya punguzo,
   kitu kinachoguswa (bei za bidhaa / gharama ya delivery / jumla ya oda), kima cha
   chini cha jumla ya bidhaa na tarehe za kuanza/kuisha. Yeye mwenyewe ndiye
   anayeamua — hakuna msimamizi anayehusika, na ofa isipooanza haiathiri oda.
7. **Matangazo ya kulipwa** (`/dashboard/ads`): muuzaji huchagua mpango
   (`ad_plans`), muda (siku 1 / wiki 1 / mwezi 1 au idadi yake mwenyewe, ikiwa
   mpango una ukomo `max_days`), kichwa, picha na ukurasa unaopelekwa. Bei
   anaona kama **kadri** (`quotePrice`); ombi huingia `status = submitted` na halijaonekani
   kwa umma hadi msimamizi aidhinishe na kuthibitisha malipo.
8. Oda za **chakula** tu ndizo zinazoomba saa: kwenye `/checkout` mnunuzi huchagua
   "Haraka — sasa hivi" (`scheduled_at` inabaki `NULL`) au "Chagua saa"
   (`orders.scheduled_at`). Seva hukataa muda uliopita au uliozidi wiki mbili mbele,
   na muuzi huona kile ambacho mnunuzi aliomba kwenye `/dashboard/orders`.

### Pesa: kutoka kwa mnunuzi hadi kwa muuzi (Snippe)

Hii ni **hiari**. `SNIPPE_API_KEY` isipoowekwa, kila kitu kinafanya kazi lakini malipo
hukamilishwa mikononi (cash) — mfumo haudhani pesa imetolewa.

Kuiwasha:

1. Jaza `SNIPPE_API_KEY` na `SNIPPE_WEBHOOK_SECRET` kwenye `.env.local`. Pesa ya muuzi
   hutumwa kwenye namba aliyoweka kwenye biashara yake (`businesses.phone` / `whatsapp`),
   si kwenye env.
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
| Barua pepe ya uthibitisho haifiki au hurejesha kosa | Redirect URL haijaruhusiwa, au kikomo cha barua pepe za default cha Supabase kimefikwa | Ongeza `/auth/callback` kwenye Redirect URLs; weka SMTP yako (Auth → SMTP) |
| `Blocked cross-origin request to Next.js dev resource` (unapotumia `http://192.168.x.x:3000`) | Next ya dev hupakia JavaScript kutoka anwani zilizo kwenye orodha pekee | Weka anwani unayotumia kwenye `IAA_DEV_ORIGINS` katika `.env.local` (mf. `192.168.1.20`), kisha uwashe upya `npm run dev`; au tumia `localhost` |
| Kubofya EN/SW hakubadilishi kitu | Kibadilishi ni kiungo cha kwenda `/api/lang`; ikiwa seva imesimama au ukurasa ni wa zamani, hakuna kitu kinachotokea | Pakia upya (`Shift+F5`); hakikisha `npm run dev` inakimbia; fungua `/api/lang?lang=en` ili kuona kosa la seva |
| `ERROR: 42703: column "email" does not exist` (SQL Editor) | `public.profiles` haina `email`; barua pepe ipo kwenye `auth.users` | Tumia `update public.profiles p set is_admin = true from auth.users u where p.id = u.id and u.email = '…'` — ona hatua (d) |
| `update … 0 rows` (kuwa msimamizi) | Profaili huundwa baada ya mtumiaji kuthibitisha akaunti | Akamilishe `/login` (jisajili + thibitisha barua pepe) kwanza, kisha urudie `update` |
| Kitufe cha Google kinarudisha ujumbe wa kosa | provider ya Google haijawashwa kwenye Supabase, au redirect URI ya Google Cloud si sahihi | Fuata hatua (e); badala yake tumia tabo **Ingia** ya barua pepe na nenosiri |
| `Email link is invalid or has expired` kwenye `/login` | Kiungo cha uthibitisho/kurejesha nenosiri hutumika mara moja na huisha baada ya dakika chache; au ulikifungua kwenye browser tofauti na ile iliyoomba | Omba kiungo kipya kwenye browser ileile; kwenye `/login` bofya **Tuma tena** au fungua `/reset-password` upya |
| `email rate limit exceeded` (unapotuma barua pepe) | Mailer ya default ya Supabase ina kikomo kidogo (takriban 2 barua pepe kwa saa kwa mradi) | Weka Brevo SMTP kama hatua (f) inavyoonyesha, kisha uombe kiungo upya |
| `Error sending recovery email` / `Error sending confirmation email` (500) | Supabase imeshindwa kuwasiliana na SMTP; mara nyingi ni SMTP key isiyo sahihi, username ni hostname, au sender haijathibitishwa | Supabase → Authentication → Logs → tafuta `error_id`; kisha rekebisha SMTP Settings kwa hatua (f). Ukiwa na Gmail, tumia **Endelea na Google** kwa muda |
| Brevo: `525 5.7.1 Unauthorized IP address` | Brevo iwezesha kizuizi cha IP; Supabase hutuma kutoka IP zinazobadilika | Brevo → Settings → Security → Authorized IPs → zima kizuizi (au bofya link kwenye banner ya bluu ya SMTP) |
| `Invalid login credentials` | Nenosiri au barua pepe si sahihi, au akaunti haijathibitishwa bado | Hakikisha barua pepe imethibitishwa; tumia **Umesahau nenosiri?** kama nenosiri limesahaulika |
| `User already registered` | Mtu anajaribu kujisajili kwa barua pepe iliyopo | Bofya tabo **Ingia**, au tumia **Umesahau nenosiri?** |
| Brevo: `535 authentication failed` baada ya Save | Uliweka **API key** kwenye Password badala ya **SMTP key**, au ulitumia `smtp-relay.brevo.com` kama Username badala ya **Login** | Ona hatua (f) → "Makosa mawili ya Brevo"; tengeneza SMTP key mpya |
| Brevo: `550 Domain is not verified` | Sender Email iko kwenye domeini ambayo huna (mf. `@gmail.com`) au haijathibitishwa | Thibitisha domeini yako kwenye Brevo, au tumia Gmail app password kama hatua (f) → "Ukiwa huna domeini" |
| `PKCE code verifier not found in storage` | Kiungo cha kurejesha nenosiri au cha Google kilifunguliwa kwenye browser/device tofauti na ile iliyoomba, au cookies zimefutwa | Fungua kiungo kwenye browser ileile uliyotumia kuomba; kama haiwezekani, omba kiungo kipya hapo |
| Brevo: `403 api key is not authorized for resource "transactional.email"` | Kitufe cha API kimeundwa bila ruhusa ya kutuma barua pepe (Brevo huniacha kuchagua ruhusa wakati wa kuunda key) | Brevo → Settings → SMTP & API → **API Keys** → unda key mpya na uweke ruhusa ya **Transactional email** (au Full access), kisha badilisha `BREVO_API_KEY` kwenye `.env.local` na Vercel |
| Barua pepe ya taarifa (kosa la kiufundi) haiji kwa admin | `BREVO_API_KEY` haina ruhusa ya transactional, au `ADMIN_ALERT_EMAIL`/`NOTIFY_EMAIL_FROM` haipo | Taarifa huandikwa kwenye logs (`[tatizo]`, `[admin-alert]`) hata bila Brevo; rekebisha key kama safu iliyo juu |
| `WebCrypto API is not supported. Code challenge method will default to use plain instead of sha256` (browser) | Unafungua tovuti kutoka anwani isiyo secure — `crypto.subtle` haipatikani nje ya `https://` na `http://localhost`/`127.0.0.1`, mf. `http://192.168.x.x:3000` | Onyo tu, si kosa: huingia kwa barua pepe na nenosiri bila athari. Ukipenda kuona safi tumia `http://localhost:3000`, au upatie HTTPS (tunnel ya mf. `cloudflared`) na usasishe `NEXT_PUBLIC_SITE_URL` |
| `supabase.auth.signInWithOauth is not a function` (browser) | Kibadili-haraka (Fast Refresh) kiliacha bundle ya zamani baada ya mabadiliko ya `translations.ts` | Pakia upya kwa nguvu: `Shift+F5` kwenye `/login` |

Ukosa wowote wa hifadhidata huonyeshwa na `src/app/error.tsx`: mtumiaji huona ujumbe
mfupi wa Kiswahili/EN, na maelezo ya kiufundi hutumwa kwa `ADMIN_ALERT_EMAIL`
(bila hiyo, kwa `NOTIFY_EMAIL_FROM`) kupitia `/api/report`.

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
next.config.ts         mipangilio ya picha za nje + maelekezo ya kudumu
                       (`/msosi/<slug>` → `/duka/<slug>`)
supabase/schema.sql      jedwali, RLS, triggers, Storage, habari (mpango: jedwali -> kazi -> triggers -> RLS -> Storage)
```

## 7. Kabla ya kuchapisha

```bash
npm run lint
npx tsc --noEmit
npm run build
npm start
```

- Weka `NEXT_PUBLIC_SITE_URL` = anwani halisi ya HTTPS — viungo vya uthibitisho wa
  barua pepe, kurejesha nenosiri na webhook zinategemea.
- Ongeza `https://ANWANI_YAKO/auth/callback` kwenye Supabase Redirect URLs.
- Webhook ya Snippe huhitaji anwani ya nje ya HTTPS.
- Hakikisha `SUPABASE_SERVICE_ROLE_KEY` na `SNIPPE_API_KEY` vipo kwenye mazingira ya seva
  pekee (sio kwenye build ya kivinjari).

## 8. Data halisi

Hakuna seed, hakuna data ya majaribio, hakuna emojis za mapambo. Orodha tupu huonyesha
ujumbe wazi ("hakuna matangazo bado"), na kila bei, picha na hali ya malipo inatokana na
rekodi ya hifadhidata. Weka data yako mwenyewe — mfumo utaonyesha uhalisia wa kile
kilichowekwa.

## 9. Kituo cha udhibiti (`/dashboard/admin`)

Kinapatikana kwa wale wanao `profiles.is_admin = true` tu (`RequireAdmin` hukaribia
wengine). Hakuna kitufe kinachobadilisha pesa kimyakimya — kila mabadiliko ya hali ya
malipo hupitia `/api/admin/orders` kwa funguo ya `service_role` ya seva, na
`protect_order_columns()` huzuia kivinjari kubadilisha safu za pesa moja kwa moja.

| Ukurasa | Kinachofanyika huko |
| --- | --- |
| `/dashboard/admin` | Muhtasari: idadi ya biashara, matangazo, oda, maoni, tangazo la kulipwa na malipo; kiunga cha kila udhibiti. |
| `/dashboard/admin/support` | **Kituo cha msaada.** Tafuta oda kwa namba ya kumbukumbu au simu, chuja (chazi / zilizolipwa / zisizolipwa), piga simu mnunuzi, kisha weka hali ya oda na hali ya malipo. Kudhibiti malipo ya nje kunaandika `provider = cash` (mfumo haudhani Snippe ilikusanya) na kunukuu mtu aliyefanya mabadiliko kwenye `order_events`. Oda ambayo ni `paid` **na** `completed` huongeza malipo ya muuzaji kwenye foleni moja kwa moja (`payouts_order_key` huzuia marudio). |
| `/dashboard/admin/reviews` | Ficha maoni yanayokiuka sheria, onyesha tena, au futa. Maoni halisi hubaki yanavyoandikwa. |
| `/dashboard/admin/ads` | Weka mipango ya tangazo (`ad_plans`: bei kwa siku/wiki/mwezi, ukomo wa siku, mahali pa kuonekana) na kadirisha ombi (`submitted → live` kwa tarehe ulizoweka, `rejected`, `expired`), thibitisha malipo (`paid_at`). |
| `/dashboard/admin/social` | Weka link halisi za mitandiko ya kijamii. Alama huonekana kwenye footer tu baada ya link kuwekwa na kuwashwa; kila moja hupata icon yake halisi na rangi yake ya brand (Instagram, TikTok, X, Facebook, WhatsApp, Telegram, YouTube, LinkedIn, tovuti). |
| `/dashboard/admin/settings` | Nambari za huduma kwa wateja (`app_settings`: `support_phone`, `support_whatsapp`, `support_email`, `service_hours`). Kila thamani hapa ni **ya umma** — usiweke funguo za siri. |
| `/dashboard/review`, `/dashboard/news`, `/dashboard/payouts` | Ukaguzi wa biashara, habari za uani, na foleni ya malipo — vinavyoendelea kutumika. |

Ili mtu awe msimamizi, endesha hii kwenye Supabase **SQL Editor** (badilisha barua pepe):

```sql
update public.profiles p
set is_admin = true
from auth.users u
where p.id = u.id
  and u.email = 'barua.pepe@msimamizi.com';
```

## 10. Meza za nyongeza (schema)

Kituo cha udhibiti, ofa, maoni, matangazo na footer ya mitandiko hutegemea meza
`offers`, `reviews`, `social_links`, `app_settings`, `ad_plans`, `ads` na safu mpya
(`businesses/menu_items/listings.rating_avg` + `rating_count`,
`orders.scheduled_at`, `orders.meetup_point`, `orders.discount`, `orders.offer_label`,
`orders.offer_id`).

**Mradi huu una meza hizo tayari** — `supabase/schema.sql` ilikuja kwenye Supabase,
kwa hivyo `/msosi`, `/market`, `/services` na `/vyumba` hutoa `200` badala ya kosa la
database. Kama una mradi **mpya** (au unahamisha tovuti kwenye Supabase nyingine),
utaona kosa la database (`42703 column … does not exist`) hadi uweke schema —
hakuna kitu kinachofutwa: faili imetayariwa kwa `if not exists` na
`drop policy if exists`, kwa hivyo kuendesha faili nzima mara ya pili kunaongeza tu
meza, safu, policies na triggers ambazo hazipo bado.

1. Fungua Supabase dashboard → **SQL Editor** → **New query**.
2. Bandika yaliyomo kote katika `supabase/schema.sql` → **Run**.
3. Pakia upya tovuti; kurasa zilizotajwa hapo juu huanza kufanya kazi, na
   `/dashboard/admin` huonyesha idadi halisi badala ya paneli ya "hakuna jedwali".

Kurasa za umma zinazopatikana sasa:

| Anwani | Kinachopatikana huko |
| --- | --- |
| `/` | Ukurasa wa mwanzo: hero na kadi za mwelekeo (Chakula · Sokoni · Huduma · Vyumba). |
| `/msosi` | Menyu za migahawa zilidyhinishwa, zikiwemo nyota halisi za vipande na biashara. |
| `/market` | Matangazo ya bidhaa; tab ya **Vyumba** ndani yake hubadilisha orodha bila kuruka ukurasa. |
| `/vyumba` | Vyumba pekee, bei ikiandikwa **kwa mwezi**; hakuna kitufe cha kulipa bila kuona chumba. |
| `/services` | Huduma zenye bei, zikigawanywa kwa utaalamu (fundi simu, kinyozi, shwari, umeme, karatasi, usafi, masomo, uzuri, hesabu, n.k.) pamoja na orodha ya watoa huduma. |
| `/product/<id>` | Ndani ya tangazo: picha, bei kutoka hifadhidata, maoni na mtoa huduma. |
| `/duka/<slug>` | Ukurasa wa biashara yoyote — chakula, bidhaa au huduma. (`/msosi/<slug>` haelekezwa huko.) |
| `/post`, `/post/<id>` | Kuunda au kubadilisha tangazo (fomu hugawanya Bidhaa / Vyumba / Huduma). |
| `/checkout`, `/orders`, `/orders/<id>` | Kikapu, oda zangu na malipo. |
| `/news`, `/login`, `/privacy`, `/terms` | Habari za uani, kuingia, faragha na masharti. |


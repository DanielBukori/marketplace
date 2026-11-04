import { getT } from "@/lib/i18n-server";

/**
 * Mifumo ya "inapakia". Ili mtumiaji aone muonekano wa ukurasa halisi
 * mara moja, hizi zinaendana na vipimo vya kadi/gurudu zinazotumika
 * katika boards — badala ya kurasa za myembeupe.
 */

function Bone({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`animate-pulse rounded-2xl bg-paper-200 ${className}`} />;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div role="status" className="mx-auto w-full max-w-7xl px-4 pb-24 pt-6 sm:px-6 lg:px-8">
      {children}
    </div>
  );
}

export function CardsSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="rounded-3xl border border-black/5 bg-white p-3">
          <Bone className="aspect-[4/5] w-full rounded-2xl" />
          <div className="space-y-2 px-2 pb-1 pt-4">
            <Bone className="h-4 w-4/5" />
            <Bone className="h-3 w-3/5" />
            <Bone className="mt-3 h-11 w-full rounded-2xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** /market, /services, /vyumba: utafutaji + tabo + gurudu ya kadi. */
export async function BoardSkeleton() {
  const t = await getT();
  return (
    <Shell>
      <span className="sr-only">{t.common.loading}</span>
      <div className="flex flex-col gap-4 sm:flex-row">
        <Bone className="h-16 flex-1 rounded-full" />
        <Bone className="h-16 w-full rounded-full sm:w-52" />
      </div>
      <Bone className="h-13 w-64 rounded-full" />
      <CardsSkeleton />
    </Shell>
  );
}

/** /duka/<slug>: kichwa cha muuzi + orodha ya bidhaa. */
export async function StoreSkeleton() {
  const t = await getT();
  return (
    <Shell>
      <span className="sr-only">{t.common.loading}</span>
      <div className="flex items-center gap-4">
        <Bone className="h-20 w-20 rounded-3xl" />
        <div className="flex-1 space-y-2">
          <Bone className="h-6 w-1/2" />
          <Bone className="h-4 w-1/3" />
        </div>
      </div>
      <div className="mt-8">
        <CardsSkeleton count={4} />
      </div>
    </Shell>
  );
}

/** /msosi: kadi za migahawa bila upana wa utafutaji. */
export async function FoodSkeleton() {
  const t = await getT();
  return (
    <Shell>
      <span className="sr-only">{t.common.loading}</span>
      <Bone className="h-8 w-40" />
      <div className="mt-8">
        <CardsSkeleton count={6} />
      </div>
    </Shell>
  );
}

/** Ukurasa wa tangazo moja au oda: picha kubwa + maandishi. */
export async function DetailSkeleton() {
  const t = await getT();
  return (
    <Shell>
      <span className="sr-only">{t.common.loading}</span>
      <div className="grid gap-8 lg:grid-cols-2">
        <Bone className="aspect-square w-full rounded-3xl" />
        <div className="space-y-3">
          <Bone className="h-7 w-2/3" />
          <Bone className="h-5 w-1/3" />
          <Bone className="h-28 w-full rounded-3xl" />
          <Bone className="h-14 w-full rounded-2xl" />
        </div>
      </div>
    </Shell>
  );
}

/** Oda, dashboard, habari: mstari mmoja mmoja. */
export async function RowsSkeleton({ count = 6 }: { count?: number }) {
  const t = await getT();
  return (
    <Shell>
      <span className="sr-only">{t.common.loading}</span>
      <Bone className="h-8 w-52" />
      <div className="mt-6 space-y-3">
        {Array.from({ length: count }, (_, i) => (
          <Bone key={i} className="h-24 w-full rounded-3xl" />
        ))}
      </div>
    </Shell>
  );
}

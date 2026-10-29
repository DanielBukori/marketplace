import { getT } from "@/lib/i18n-server";

export default async function TermsPage() {
  const t = await getT();

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-extrabold tracking-tight text-ink-900">
        {t.terms.title}
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-gray-500">{t.terms.intro}</p>

      <div className="mt-10 space-y-5">
        {t.terms.rules.map((rule) => (
          <section
            key={rule.title}
            className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm"
          >
            <h2 className="text-lg font-extrabold text-ink-900">{rule.title}</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-gray-500">{rule.body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}

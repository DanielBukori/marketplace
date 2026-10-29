import { getT } from "@/lib/i18n-server";

export default async function PrivacyPage() {
  const t = await getT();

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-extrabold tracking-tight text-ink-900">
        {t.privacy.title}
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-gray-500">
        {t.privacy.intro}
      </p>

      <div className="mt-10 space-y-5">
        {t.privacy.sections.map((section) => (
          <section
            key={section.title}
            className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm"
          >
            <h2 className="text-lg font-extrabold text-ink-900">{section.title}</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-gray-500">{section.body}</p>
          </section>
        ))}
      </div>

      <p className="mt-10 text-sm leading-relaxed text-gray-500">
        {t.privacy.contact}{" "}
        <a
          href="https://iaa.ac.tz"
          target="_blank"
          rel="noreferrer"
          className="font-bold text-primary-700"
        >
          {t.privacy.contactLink}
        </a>
      </p>
    </div>
  );
}

import GetStartedSlides from "@/components/GetStartedSlides";
import { getT } from "@/lib/i18n-server";
import { pageMeta } from "@/lib/seo";

export async function generateMetadata() {
  const t = await getT();
  return pageMeta("/get-started", t.getStarted.title, t.getStarted.subtitle);
}

export default async function GetStartedPage() {
  const t = await getT();

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 pb-24 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl">
          {t.getStarted.title}
        </h1>
        <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-gray-500">
          {t.getStarted.subtitle}
        </p>
      </div>

      <GetStartedSlides slides={t.getStarted.slides} />
    </div>
  );
}

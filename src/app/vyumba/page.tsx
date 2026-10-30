import SetupNotice from "@/components/SetupNotice";
import RoomsBoard from "@/components/RoomsBoard";
import { getActiveListings } from "@/lib/db";
import { getT } from "@/lib/i18n-server";
import { isSupabaseConfigured } from "@/lib/media";
import { roomCategoryIds } from "@/lib/data";
import type { Listing } from "@/lib/types";

export default async function RoomsPage() {
  const t = await getT();
  let rooms: Listing[] = [];
  if (isSupabaseConfigured) {
    rooms = await getActiveListings(roomCategoryIds);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 pb-24 pt-10 sm:px-6 lg:px-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary-700">
          {t.rooms.eyebrow}
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink-900 md:text-4xl">
          {t.rooms.title}
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-gray-500">
          {t.rooms.desc}
        </p>
      </div>
      {!isSupabaseConfigured && <SetupNotice />}
      <RoomsBoard listings={rooms} />
    </div>
  );
}

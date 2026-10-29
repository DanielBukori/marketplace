import MsosiBoard from "@/components/MsosiBoard";
import SetupNotice from "@/components/SetupNotice";
import { getFoodBoard } from "@/lib/db";
import { isSupabaseConfigured } from "@/lib/media";

export default async function MsosiPage() {
  const board = isSupabaseConfigured
    ? await getFoodBoard()
    : { businesses: [], menu: [] };

  return (
    <div className="w-full pb-24">
      {!isSupabaseConfigured && (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SetupNotice />
        </div>
      )}
      <MsosiBoard businesses={board.businesses} menu={board.menu} />
    </div>
  );
}

import { getBusinessBySlug } from "@/lib/db";
import { isSupabaseConfigured } from "@/lib/media";
import Storefront from "@/components/Storefront";
import SetupNotice from "@/components/SetupNotice";
import { notFound } from "next/navigation";

export default async function BusinessPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  if (!isSupabaseConfigured) return <SetupNotice />;
  const { slug } = await params;
  const board = await getBusinessBySlug(slug);
  if (!board || !board.business.is_active) notFound();

  return (
    <Storefront
      business={board.business}
      menu={board.menu}
      listings={board.listings}
    />
  );
}

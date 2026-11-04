import type { Metadata } from "next";
import { noIndexMeta } from "@/lib/seo";

/** Kurasa hizi ni za mtumiaji aliyeingia — hazitajwi kwa watafutaji. */
export const metadata: Metadata = noIndexMeta;

export default function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

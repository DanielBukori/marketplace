import Image from "next/image";
import { mediaUrl } from "@/lib/media";

// Logo za wauzaji mara nyingi ni pana au zina background nyeupe,
// hivyo huonyeshwa `object-contain` kwenye tile nyeupe badala ya
// kukatwa; bakaa la herufi mbili linatumika pale ambapo hakuna faili.
export default function BusinessLogo({
  name,
  logoPath,
  className = "h-16 w-16",
  sizes = "64px",
  textClass = "text-base",
}: {
  name: string;
  logoPath: string | null;
  className?: string;
  sizes?: string;
  textClass?: string;
}) {
  const src = mediaUrl(logoPath);

  if (src) {
    return (
      <span
        className={`relative block shrink-0 overflow-hidden rounded-2xl bg-white ring-1 ring-black/5 ${className}`}
      >
        <Image
          src={src}
          alt={name}
          fill
          sizes={sizes}
          className="object-contain p-1"
        />
      </span>
    );
  }

  return (
    <span
      aria-hidden
      className={`flex shrink-0 items-center justify-center rounded-2xl bg-primary-50 font-extrabold uppercase tracking-tight text-primary-700 ring-1 ring-black/5 ${textClass} ${className}`}
    >
      {initials(name)}
    </span>
  );
}

function initials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const letters = words.slice(0, 2).map((word) => word[0]);
  return letters.join("") || "?";
}

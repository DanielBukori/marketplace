import type { JSX } from "react";
import type { SocialPlatform } from "@/lib/types";

/**
 * Alama za kampuni halisi (24x24) na rangi zao za brand.
 * Instagram, TikTok na Telegram zimechorwa kama mistari ili zibaki nadhifu
 * ndani ya kitufe; nyingine ni njia kamili za brand.
 */
const marks: Record<SocialPlatform, { label: string; hex: string; art: JSX.Element }> =
  {
    instagram: {
      label: "Instagram",
      hex: "#E4405F",
      art: (
        <>
          <rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5.2" />
          <circle cx="12" cy="12" r="4.1" />
          <circle cx="17.1" cy="6.9" r="0.9" fill="currentColor" stroke="none" />
        </>
      ),
    },
    tiktok: {
      label: "TikTok",
      hex: "#010101",
      art: (
        <>
          <path d="M14.1 2.7v11a3.5 3.5 0 1 1-3.5-3.5c.63 0 1.22.18 1.72.49" />
          <path d="M14.1 3.5h2.3a4.9 4.9 0 0 0 4.6 4.7" />
        </>
      ),
    },
    telegram: {
      label: "Telegram",
      hex: "#26A5E4",
      art: (
        <>
          <path d="M21.7 4.2 2.9 11.4c-.85.33-.83 1.55.03 1.85l4.28 1.45 1.62 5.3c.2.7 1.08.85 1.55.3l2.2-2.45 4.05 2.95c.63.45 1.5.1 1.66-.63l2.75-14.1c.17-.82-.68-1.45-1.44-1.15Z" />
          <path d="M8.9 14.7 18.6 7.1" />
        </>
      ),
    },
    x: {
      label: "X",
      hex: "#000000",
      art: (
        <path
          fill="currentColor"
          stroke="none"
          d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H17.2l-5.944-7.74-6.8 7.74H1.15l7.79-8.9L.75 2.25h7.81l5.275 7.02zm1.18 18.82h1.83L5.65 3.96H3.68z"
        />
      ),
    },
    facebook: {
      label: "Facebook",
      hex: "#1877F2",
      art: (
        <path
          fill="currentColor"
          stroke="none"
          d="M24 12.07C24 5.41 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.7 4.53-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.25h3.05l-.49 3.5h-2.56V24C19.62 23.1 24 18.1 24 12.07"
        />
      ),
    },
    whatsapp: {
      label: "WhatsApp",
      hex: "#25D366",
      art: (
        <path
          fill="currentColor"
          stroke="none"
          d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.28-.1-.48-.15-.68.15-.2.3-.78.97-.96 1.17-.17.2-.35.22-.64.08-.3-.15-1.2-.44-2.27-1.4-.84-.75-1.4-1.67-1.57-1.95-.15-.28-.01-.44.13-.58.14-.14.3-.42.43-.62.14-.2.19-.35.3-.57.1-.22.05-.42-.03-.57-.07-.15-.67-1.62-.92-2.22-.25-.58-.49-.5-.67-.5h-.57c-.2 0-.52.07-.79.35-.27.28-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.08 4.48.71.3 1.26.48 1.69.62.71.22 1.36.19 1.87.11.57-.08 1.75-.71 2-1.4.25-.7.25-1.29.17-1.42-.07-.12-.27-.2-.57-.34m-5.42 7.47a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.9-9.88a9.8 9.8 0 0 1 6.99 2.9 9.82 9.82 0 0 1 2.9 7c0 5.45-4.44 9.88-9.9 9.88M21.37 2.68A11.8 11.8 0 0 0 12.05 0C5.5 0 .16 5.33.16 11.9c0 2.1.55 4.14 1.6 5.95L.05 24l6.29-1.65a11.9 11.9 0 0 0 5.7 1.45c6.55 0 11.89-5.33 11.89-11.9a11.85 11.85 0 0 0-3.48-8.4"
        />
      ),
    },
    youtube: {
      label: "YouTube",
      hex: "#FF0000",
      art: (
        <path
          fill="currentColor"
          stroke="none"
          d="M23.5 6.2a3 3 0 0 0-2.12-2.12C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.53A3.07 3.07 0 0 0 .5 6.2C0 8.07 0 12 0 12s0 3.93.5 5.8a3 3 0 0 0 2.12 2.12c1.88.53 9.38.53 9.38.53s7.5 0 9.38-.53a3.07 3.07 0 0 0 2.12-2.12C24 15.93 24 12 24 12s0-3.93-.5-5.8M9.6 15.6V8.4l6.2 3.6z"
        />
      ),
    },
    linkedin: {
      label: "LinkedIn",
      hex: "#0A66C2",
      art: (
        <path
          fill="currentColor"
          stroke="none"
          d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.86-3.04-1.86 0-2.15 1.46-2.15 2.96v5.65H9.34V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12M7.12 20.45H3.55V9h3.57zM22.22 0H1.77C.8 0 0 .78 0 1.75v20.5C0 23.2.8 24 1.77 24h20.45c.98 0 1.78-.8 1.78-1.75V1.75C24 .78 23.2 0 22.22 0"
        />
      ),
    },
    website: {
      label: "Website",
      hex: "#10497e",
      art: (
        <>
          <circle cx="12" cy="12" r="9.2" />
          <path d="M2.8 12h18.4" />
          <path d="M12 2.8c2.4 2.6 3.6 5.7 3.6 9.2S14.4 18.6 12 21.2c-2.4-2.6-3.6-5.7-3.6-9.2S9.6 5.4 12 2.8Z" />
        </>
      ),
    },
  };

const stroked: SocialPlatform[] = [
  "instagram",
  "tiktok",
  "telegram",
  "website",
];

export function platformLabel(platform: SocialPlatform) {
  return marks[platform]?.label ?? platform;
}

export function brandHex(platform: SocialPlatform) {
  return marks[platform]?.hex ?? "#10497e";
}

export default function BrandIcon({
  platform,
  size = 20,
}: {
  platform: SocialPlatform;
  size?: number;
}) {
  const mark = marks[platform];
  if (!mark) return null;
  const isStroked = stroked.includes(platform);

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke={isStroked ? "currentColor" : "none"}
      strokeWidth={isStroked ? 1.7 : 0}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className="shrink-0"
    >
      {mark.art}
    </svg>
  );
}

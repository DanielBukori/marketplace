import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

/**
 * Kwenye dev, Next huzuia JavaScript ya kurasa zinazopakiwa kutoka
 * host nyingine (mfano simu au kompyuta nyingine kwenye mtandao wa nyumbani).
 * Weka host unazotumia katika IAA_DEV_ORIGINS, zikitenganishwa na koma.
 */
const devOrigins = (process.env.IAA_DEV_ORIGINS ?? "192.168.56.1")
  .split(",")
  .map((host) => host.trim())
  .filter(Boolean);

const storageHost = supabaseUrl ? new URL(supabaseUrl).hostname : null;

/**
 * Kichwa cha usalama. CSP hutumika tu katika production: katika dev,
 * Turbopack HMR hupakia `ws://` na `blob:` kutoka chanzo cha mwenyewe, na
 * kutaka kuruhusu hayo kungefanya kichwa kuwa cha uongo.
 */
function securityHeaders(): { source: string; headers: { key: string; value: string }[] }[] {
  const base = [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
    // Picha za mtumiaji huchaguliwa kupitia faili input; hakuna kamera,
    // maikrofoni au lokeshini inayohitajiki kivinjari.
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  ];

  if (!storageHost || process.env.NODE_ENV !== "production") {
    return [{ source: "/:path*", headers: base }];
  }

  return [
    {
      source: "/:path*",
      headers: [
        ...base,
        {
          key: "Content-Security-Policy",
          value: [
            "default-src 'self'",
            // Next huweka script yake ya anzilishi ndani ya HTML; hakuna nonce
            // katika mfumo huu, hivyo 'unsafe-inline' inahitajika kwa ajili ya
            // hydration.
            "script-src 'self' 'unsafe-inline'",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: blob: https://" + storageHost,
            "font-src 'self'",
            "connect-src 'self' https://" + storageHost,
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "frame-ancestors 'none'",
          ].join("; "),
        },
      ],
    },
  ];
}

const nextConfig: NextConfig = {
  // Auth, listings na orders yote husoma session/DB kwa kila request, hivyo
  // prerender ya static (cacheComponents) haizingati tena ukweli wa ukurasa.
  cacheComponents: false,
  allowedDevOrigins: devOrigins,
  // duka = storefront yoyote (kula, bidhaa, huduma). "/msosi" ni neno la chakula
  // tu, hivyo hatutaki kufanya liwe anwani ya biashara zote. Viungio vilivyoshirikiwa
  // tayari vinaendelea kufanya kazi kupitia maelekezo haya ya kudumu.
  async redirects() {
    return [
      { source: "/msosi/:slug", destination: "/duka/:slug", permanent: true },
    ];
  },
  async headers() {
    return securityHeaders();
  },
  images: {
    remotePatterns: supabaseUrl
      ? [
          {
            protocol: "https" as const,
            hostname: new URL(supabaseUrl).hostname,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
  },
  turbopack: {
    root: process.cwd(),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

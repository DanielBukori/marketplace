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

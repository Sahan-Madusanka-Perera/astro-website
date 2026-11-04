import type { NextConfig } from "next";

// Board photos, portraits and planet logos uploaded in the admin are served
// from Supabase Storage, so next/image must be allowed to load them.
const supabase = (() => {
  try {
    const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");
    return { hostname: url.hostname, protocol: url.protocol === "http:" ? ("http" as const) : ("https" as const) };
  } catch {
    return null;
  }
})();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co", pathname: "/storage/v1/object/public/**" },
      // a self-hosted Supabase on its own domain
      ...(supabase && !supabase.hostname.endsWith(".supabase.co")
        ? [{ ...supabase, pathname: "/storage/v1/object/public/**" }]
        : []),
    ],
  },
};

export default nextConfig;

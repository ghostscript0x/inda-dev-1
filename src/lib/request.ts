import "server-only";

/** Read geo info supplied by the host (Vercel or Cloudflare). IPs are never stored. */
export function geoFromHeaders(h: Headers) {
  const decode = (v: string | null) => {
    if (!v) return null;
    try {
      return decodeURIComponent(v);
    } catch {
      return v;
    }
  };
  return {
    country: h.get("x-vercel-ip-country") ?? h.get("cf-ipcountry") ?? null,
    region: decode(h.get("x-vercel-ip-country-region") ?? h.get("cf-region")),
    city: decode(h.get("x-vercel-ip-city") ?? h.get("cf-ipcity")),
  };
}

/** Client IP, used only transiently for rate limiting. */
export function clientIp(h: Headers) {
  return h.get("cf-connecting-ip") ?? h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

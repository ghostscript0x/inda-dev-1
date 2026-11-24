import { ImageResponse } from "next/og";

/** Branded share image: mint background, the logo tile, the page title. */
export function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = (searchParams.get("title") ?? "Software engineer building secure, automated systems.").slice(0, 90);
  const kicker = (searchParams.get("k") ?? "Abdul-Quddus Inda").slice(0, 40);

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#00EFAE", padding: 72, color: "#09090B" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {/* inda icon (from inda-logo-kit): dark tile + green mark */}
          <div style={{ width: 76, height: 76, borderRadius: 18, background: "#09090B", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="42" height="42" viewBox="555 267 175 176">
              <rect x="555" y="267" width="48" height="41" fill="#00EFAE" />
              <polygon points="555,318 601,360 601,443 555,443" fill="#00EFAE" />
              <polygon points="606,314 643,308 730,391 730,443 715,443 606,338" fill="#00EFAE" />
            </svg>
          </div>
          <div style={{ fontSize: 40, fontWeight: 700, letterSpacing: -1.5 }}>inda.dev</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 28, opacity: 0.7, fontFamily: "monospace" }}>{kicker}</div>
          <div style={{ fontSize: title.length > 50 ? 60 : 76, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2.5, maxWidth: 1000 }}>{title}</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 26, opacity: 0.75 }}>
          <span>inda.name.ng</span>
          <span>Build · Secure · Automate</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630, headers: { "cache-control": "public, max-age=86400, s-maxage=604800, immutable" } },
  );
}

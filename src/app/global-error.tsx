"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ background: "#09090B", color: "#FAFAFA", fontFamily: "system-ui, sans-serif", display: "grid", placeItems: "center", minHeight: "100vh", margin: 0 }}>
        <div style={{ padding: 24, maxWidth: 480 }}>
          <h1 style={{ fontSize: 28, letterSpacing: "-0.02em" }}>Something went wrong.</h1>
          <p style={{ color: "#A1A1AA" }}>Please try again in a moment.</p>
          <button onClick={reset} style={{ marginTop: 16, background: "#00EFAE", color: "#09090B", border: 0, borderRadius: 8, padding: "10px 16px", fontWeight: 600, cursor: "pointer" }}>
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type Pillar = "build" | "secure" | "automate";
export type PillarInfo = { key: Pillar; title: string; sentence: string; tools: string[] };

const FALLBACK: PillarInfo[] = [
  { key: "build", title: "Build", sentence: "Web apps, backends and APIs that are fast, typed end to end and easy to change.", tools: ["Next.js", "TypeScript", "Postgres"] },
  { key: "secure", title: "Secure", sentence: "Networks and servers set up properly, hardened, monitored and documented.", tools: ["Linux", "Cloudflare", "WireGuard"] },
  { key: "automate", title: "Automate", sentence: "Workflows and AI agents that take repetitive work off your team’s plate.", tools: ["n8n", "LLM APIs", "Webhooks"] },
];

type Node = { id: string; x: number; y: number; w: number; h: number; label: string; sub: string; on: Pillar[] };
type Edge = { id: string; d: string; on: Pillar[]; dur: number; tag?: { x: number; y: number; text: string } };

// One system, three ways of looking at it. Coordinates are in the 560×420 viewBox.
const NODES: Node[] = [
  { id: "app", x: 20, y: 28, w: 156, h: 96, label: "app", sub: "next.js · react", on: ["build"] },
  { id: "edge", x: 222, y: 46, w: 116, h: 60, label: "edge", sub: "tls · waf", on: ["secure"] },
  { id: "api", x: 384, y: 28, w: 156, h: 96, label: "api", sub: "node · typescript", on: ["build"] },
  { id: "net", x: 20, y: 176, w: 156, h: 72, label: "network", sub: "linux · wireguard", on: ["secure"] },
  { id: "db", x: 384, y: 176, w: 156, h: 72, label: "postgres", sub: "prisma · backups", on: ["build", "secure"] },
  { id: "flow", x: 202, y: 300, w: 156, h: 92, label: "workflow", sub: "n8n · ai agent", on: ["automate"] },
  { id: "notify", x: 384, y: 310, w: 156, h: 72, label: "notify", sub: "email · whatsapp", on: ["automate"] },
];

const EDGES: Edge[] = [
  { id: "app-edge", d: "M176 76 H222", on: ["build", "secure"], dur: 1.4 },
  { id: "edge-api", d: "M338 76 H384", on: ["build", "secure"], dur: 1.4 },
  { id: "api-db", d: "M462 124 V176", on: ["build"], dur: 1.2 },
  { id: "app-net", d: "M98 124 V176", on: ["secure"], dur: 1.2 },
  { id: "net-edge", d: "M176 212 H200 C240 212 280 164 280 106", on: ["secure"], dur: 1.8 },
  { id: "db-flow", d: "M384 224 H326 C296 224 280 256 280 300", on: ["automate"], dur: 1.8, tag: { x: 336, y: 216, text: "webhook" } },
  { id: "flow-notify", d: "M358 346 H384", on: ["automate"], dur: 1.1 },
];

const CYCLE_MS = 4200;

export function HeroSystem({ pillars }: { pillars?: PillarInfo[] }) {
  const items = FALLBACK.map((f) => pillars?.find((p) => p.key === f.key) ?? f);
  const [active, setActive] = useState<Pillar>("build");
  const [paused, setPaused] = useState(false);
  const [still, setStill] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Auto-cycle the three views, unless the visitor is interacting, prefers reduced motion, or it's off screen.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setStill(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (paused || still) return;
    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    if (rootRef.current) io.observe(rootRef.current);
    const t = setInterval(() => {
      if (visible && document.visibilityState === "visible") setActive((a) => (a === "build" ? "secure" : a === "secure" ? "automate" : "build"));
    }, CYCLE_MS);
    return () => {
      clearInterval(t);
      io.disconnect();
    };
  }, [paused, still]);

  const current = items.find((p) => p.key === active)!;

  return (
    <div ref={rootRef} className="hero-system" onPointerEnter={() => setPaused(true)} onPointerLeave={() => setPaused(false)} onFocusCapture={() => setPaused(true)} onBlurCapture={() => setPaused(false)}>
      <figure className="relative overflow-hidden rounded-2xl border border-border bg-surface">
        {/* Frame chrome: reads like a monitoring view of a real system */}
        <div className="flex h-10 items-center justify-between border-b border-border px-4">
          <span className="flex items-center gap-1.5" aria-hidden>
            <span className="size-2 rounded-full bg-border-strong" />
            <span className="size-2 rounded-full bg-border-strong" />
            <span className="size-2 rounded-full bg-border-strong" />
          </span>
          <span className="font-mono text-[0.6875rem] text-subtle">system.map</span>
          <span className="flex items-center gap-1.5 font-mono text-[0.6875rem] text-subtle">
            <span aria-hidden className="size-1.5 rounded-full bg-accent motion-safe:animate-[pulse-dot_2.4s_ease-in-out_infinite]" />
            live
          </span>
        </div>

        <svg viewBox="0 0 560 420" className="block h-auto w-full" fill="none" strokeLinecap="round" strokeLinejoin="round" role="img" aria-labelledby="hs-title hs-desc">
          <title id="hs-title">How I build, secure and automate a system</title>
          <desc id="hs-desc">
            An app talks to an API through a secured edge. The API stores data in Postgres on a hardened network. Changes trigger a webhook into an automated workflow that notifies people by email or WhatsApp.
          </desc>
          <defs>
            <pattern id="hs-grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="0.9" fill="var(--border)" />
            </pattern>
          </defs>
          <rect width="560" height="420" fill="url(#hs-grid)" />

          {/* Edges, then packets travelling along the active ones */}
          {EDGES.map((e) => {
            const on = e.on.includes(active);
            return (
              <g key={e.id} className="transition-opacity duration-300" style={{ opacity: on ? 1 : 0.35 }}>
                <path d={e.d} stroke={on ? "var(--accent-text)" : "var(--border-strong)"} strokeWidth={on ? 1.5 : 1} strokeDasharray={on ? undefined : "3 5"} className="transition-[stroke] duration-300" />
                {e.tag && (
                  <text x={e.tag.x} y={e.tag.y} className="font-mono text-[10px]" fill="var(--subtle)">
                    {e.tag.text}
                  </text>
                )}
                {on && !still && (
                  <>
                    <circle r="3" fill="var(--accent)" className="hs-packet">
                      <animateMotion dur={`${e.dur}s`} repeatCount="indefinite" path={e.d} />
                    </circle>
                    <circle r="2" fill="var(--accent)" opacity="0.6" className="hs-packet">
                      <animateMotion dur={`${e.dur}s`} begin={`${e.dur / 2}s`} repeatCount="indefinite" path={e.d} />
                    </circle>
                  </>
                )}
              </g>
            );
          })}

          {NODES.map((n, i) => {
            const on = n.on.includes(active);
            return (
              <g key={n.id} className="hs-node transition-opacity duration-300" style={{ opacity: on ? 1 : 0.45, animationDelay: `${i * 70}ms` }}>
                <rect x={n.x} y={n.y} width={n.w} height={n.h} rx="10" fill="var(--bg)" stroke={on ? "var(--accent-text)" : "var(--border-strong)"} strokeOpacity={on ? 0.7 : 1} className="transition-[stroke] duration-300" />
                <circle cx={n.x + n.w - 14} cy={n.y + 14} r="3" fill={on ? "var(--accent)" : "var(--border-strong)"} className="transition-[fill] duration-300" />
                <text x={n.x + 14} y={n.y + 22} className="font-mono text-[12px] font-medium" fill="var(--fg)">
                  {n.label}
                </text>
                <text x={n.x + 14} y={n.y + n.h - 14} className="font-mono text-[10px]" fill="var(--subtle)">
                  {n.sub}
                </text>
                <Glyph id={n.id} x={n.x} y={n.y} on={on} />
              </g>
            );
          })}
        </svg>
      </figure>

      {/* The three views. Click or hover to switch; it cycles on its own otherwise. */}
      <div className="mt-4">
        <div role="tablist" aria-label="What I do" className="grid grid-cols-3 gap-1 rounded-xl border border-border bg-surface p-1">
          {items.map((p) => {
            const on = p.key === active;
            return (
              <button
                key={p.key}
                type="button"
                role="tab"
                id={`hs-tab-${p.key}`}
                aria-selected={on}
                aria-controls="hs-panel"
                onClick={() => setActive(p.key)}
                onPointerEnter={() => setActive(p.key)}
                data-track={`hero_pillar_${p.key}`}
                className={cn("relative h-9 overflow-hidden rounded-lg text-14 transition-colors duration-200", on ? "bg-surface-2 font-medium text-fg" : "text-muted hover:text-fg")}
              >
                {p.title}
                {on && !paused && !still && <span key={active} aria-hidden className="hs-progress absolute bottom-0 left-0 h-px bg-accent-text" style={{ animationDuration: `${CYCLE_MS}ms` }} />}
              </button>
            );
          })}
        </div>
        <div id="hs-panel" role="tabpanel" aria-labelledby={`hs-tab-${active}`} aria-live="polite" className="mt-3 min-h-[3.25rem] px-1">
          <p key={active} className="hs-fade text-14 text-muted">
            {current.sentence}
            {current.tools.length > 0 && <span className="mt-1 block font-mono text-[0.75rem] text-subtle">{current.tools.slice(0, 5).join(" · ")}</span>}
          </p>
        </div>
      </div>
    </div>
  );
}

/** Small line icons inside each node. */
function Glyph({ id, x, y, on }: { id: string; x: number; y: number; on: boolean }) {
  const s = on ? "var(--accent-text)" : "var(--subtle)";
  const muted = "var(--border-strong)";
  switch (id) {
    case "app":
      return (
        <g stroke={muted}>
          <path d={`M${x + 14} ${y + 40} H${x + 120}`} />
          <path d={`M${x + 14} ${y + 52} H${x + 96}`} />
          <rect x={x + 112} y={y + 47} width="30" height="10" rx="3" stroke={s} />
        </g>
      );
    case "edge":
      return <path d={`M${x + 92} ${y + 30} l10 4 v7 c0 6 -4 10 -10 12 c-6 -2 -10 -6 -10 -12 v-7 Z`} stroke={s} />;
    case "api":
      return (
        <g className="font-mono text-[10px]" fill="var(--muted)">
          <text x={x + 14} y={y + 44}>
            <tspan fill={s}>GET</tspan> /products
          </text>
          <text x={x + 14} y={y + 60}>
            <tspan fill={s}>POST</tspan> /checkout
          </text>
        </g>
      );
    case "db":
      return (
        <g stroke={s}>
          <ellipse cx={x + 128} cy={y + 30} rx="12" ry="4" />
          <path d={`M${x + 116} ${y + 30} v14 c0 2.2 5.4 4 12 4 s12 -1.8 12 -4 v-14`} />
        </g>
      );
    case "net":
      return (
        <g stroke={s}>
          <path d={`M${x + 112} ${y + 40} L${x + 126} ${y + 30} L${x + 140} ${y + 40}`} />
          <circle cx={x + 112} cy={y + 40} r="3" fill="var(--bg)" />
          <circle cx={x + 126} cy={y + 30} r="3" fill="var(--bg)" />
          <circle cx={x + 140} cy={y + 40} r="3" fill="var(--bg)" />
        </g>
      );
    case "flow":
      // The logo's diagonal: three steps of an automation.
      return (
        <g>
          <path d={`M${x + 22} ${y + 62} L${x + 70} ${y + 36}`} stroke={s} strokeWidth="1.5" />
          <circle cx={x + 22} cy={y + 62} r="5" stroke={muted} fill="var(--bg)" />
          <circle cx={x + 46} cy={y + 49} r="5" stroke={muted} fill="var(--bg)" />
          <circle cx={x + 70} cy={y + 36} r="5" stroke={s} fill="var(--bg)" />
          <path d={`M${x + 84} ${y + 36} H${x + 140} M${x + 84} ${y + 50} H${x + 124}`} stroke={muted} />
        </g>
      );
    case "notify":
      return (
        <g stroke={s}>
          <rect x={x + 116} y={y + 22} width="24" height="17" rx="2" />
          <path d={`M${x + 116} ${y + 24} l12 8 l12 -8`} />
        </g>
      );
    default:
      return null;
  }
}

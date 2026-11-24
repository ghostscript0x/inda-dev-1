"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { FORMATS, type FormatName } from "@/lib/format";

type Point = { t: string; v: number };


function labelFor(t: string, bucket: "hour" | "day" | "month", long = false) {
  const d = new Date(t); // key is Lagos wall-clock time in ISO form; read it in UTC
  const o: Intl.DateTimeFormatOptions =
    bucket === "hour" ? { hour: "2-digit", minute: "2-digit", timeZone: "UTC", ...(long ? { day: "numeric", month: "short" } : {}) } : bucket === "month" ? { month: "short", year: "numeric", timeZone: "UTC" } : { day: "numeric", month: "short", timeZone: "UTC", ...(long ? { weekday: "short" } : {}) };
  return new Intl.DateTimeFormat("en-GB", o).format(d);
}

function niceMax(v: number) {
  if (v <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(v));
  const m = v / p;
  return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p;
}

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(640);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(240, Math.round(e.contentRect.width))));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

/**
 * Single-series area chart (accent) with an optional previous-period line (dashed, neutral).
 * Crosshair + tooltip on hover/touch; keyboard: focus the chart and use ← →.
 */
export function AreaChart({ data, compare, bucket, format: formatName = "number", height = 240, label }: { data: Point[]; compare?: Point[]; bucket: "hour" | "day" | "month"; format?: FormatName; height?: number; label: string }) {
  const format = FORMATS[formatName];
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);
  const pad = { l: 44, r: 12, t: 12, b: 28 };
  const iw = width - pad.l - pad.r;
  const ih = height - pad.t - pad.b;
  const max = niceMax(Math.max(...data.map((d) => d.v), ...(compare?.map((d) => d.v) ?? []), 0));
  const x = (i: number) => pad.l + (data.length <= 1 ? iw / 2 : (i / (data.length - 1)) * iw);
  const y = (v: number) => pad.t + ih - (v / max) * ih;

  const path = useMemo(() => data.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(d.v).toFixed(1)}`).join(""), [data, width, max]); // eslint-disable-line react-hooks/exhaustive-deps
  const area = data.length ? `${path}L${x(data.length - 1).toFixed(1)},${pad.t + ih}L${x(0).toFixed(1)},${pad.t + ih}Z` : "";
  const prevPath = compare?.length ? compare.slice(0, data.length).map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(d.v).toFixed(1)}`).join("") : "";
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * max);
  const every = Math.max(1, Math.ceil(data.length / Math.max(2, Math.floor(iw / 72))));

  function pick(clientX: number, rect: DOMRect) {
    const rel = clientX - rect.left - pad.l;
    const i = Math.round((rel / iw) * (data.length - 1));
    setHover(Math.max(0, Math.min(data.length - 1, i)));
  }

  const h = hover !== null ? data[hover] : null;
  const total = data.reduce((s, d) => s + d.v, 0);
  const prevTotal = compare?.reduce((s, d) => s + d.v, 0);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-[0.75rem] text-muted">
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="h-0.5 w-4 rounded bg-accent-text" /> {label} · <span className="font-mono text-fg">{format(total)}</span>
        </span>
        {compare && (
          <span className="flex items-center gap-1.5">
            <span aria-hidden className="h-0 w-4 border-t-2 border-dashed border-subtle" /> Previous period · <span className="font-mono">{format(prevTotal ?? 0)}</span>
          </span>
        )}
        <button type="button" className="ml-auto underline-offset-2 hover:text-fg hover:underline" onClick={() => setShowTable((s) => !s)} aria-pressed={showTable}>
          {showTable ? "Show chart" : "View as table"}
        </button>
      </div>
      {showTable ? (
        <div className="max-h-72 overflow-y-auto rounded-lg border border-border">
          <table className="w-full text-[0.8125rem]">
            <thead className="sticky top-0 bg-surface text-left text-muted">
              <tr>
                <th className="px-3 py-2 font-medium">Period</th>
                <th className="px-3 py-2 text-right font-medium">{label}</th>
                {compare && <th className="px-3 py-2 text-right font-medium">Previous</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-mono">
              {data.map((d, i) => (
                <tr key={d.t}>
                  <td className="px-3 py-1.5">{labelFor(d.t, bucket, true)}</td>
                  <td className="px-3 py-1.5 text-right">{format(d.v)}</td>
                  {compare && <td className="px-3 py-1.5 text-right text-muted">{compare[i] ? format(compare[i].v) : "—"}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div ref={ref} className="relative w-full select-none">
          <svg
            width={width}
            height={height}
            role="img"
            aria-label={`${label} over time. Total ${format(total)}.`}
            tabIndex={0}
            className="block touch-pan-y outline-none focus-visible:ring-2 focus-visible:ring-accent-text/40"
            onPointerMove={(e) => pick(e.clientX, e.currentTarget.getBoundingClientRect())}
            onPointerLeave={() => setHover(null)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") setHover((v) => Math.min(data.length - 1, (v ?? -1) + 1));
              if (e.key === "ArrowLeft") setHover((v) => Math.max(0, (v ?? data.length) - 1));
              if (e.key === "Escape") setHover(null);
            }}
          >
            <defs>
              <linearGradient id="area-fill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="var(--accent-text)" stopOpacity="0.22" />
                <stop offset="100%" stopColor="var(--accent-text)" stopOpacity="0" />
              </linearGradient>
            </defs>
            {ticks.map((t) => (
              <g key={t}>
                <line x1={pad.l} x2={width - pad.r} y1={y(t)} y2={y(t)} stroke="var(--border)" strokeWidth={1} />
                <text x={pad.l - 8} y={y(t) + 3.5} textAnchor="end" className="fill-[var(--subtle)] font-mono text-[10px]">
                  {format(t)}
                </text>
              </g>
            ))}
            {data.map((d, i) =>
              i % every === 0 ? (
                <text key={d.t} x={x(i)} y={height - 8} textAnchor="middle" className="fill-[var(--subtle)] font-mono text-[10px]">
                  {labelFor(d.t, bucket)}
                </text>
              ) : null,
            )}
            {prevPath && <path d={prevPath} fill="none" stroke="var(--subtle)" strokeWidth={1.5} strokeDasharray="4 4" />}
            {area && <path d={area} fill="url(#area-fill)" />}
            {path && <path d={path} fill="none" stroke="var(--accent-text)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />}
            {h && hover !== null && (
              <g>
                <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={pad.t + ih} stroke="var(--border-strong)" strokeWidth={1} />
                <circle cx={x(hover)} cy={y(h.v)} r={4.5} fill="var(--accent-text)" stroke="var(--surface)" strokeWidth={2} />
              </g>
            )}
            {/* full-height hit area */}
            <rect x={pad.l} y={pad.t} width={iw} height={ih} fill="transparent" />
          </svg>
          {h && hover !== null && (
            <div
              role="status"
              className="pointer-events-none absolute top-1 z-10 min-w-36 rounded-lg border border-border-strong bg-surface px-3 py-2 text-[0.75rem] shadow-lg shadow-black/20"
              style={{ left: Math.min(Math.max(x(hover) - 72, 0), width - 150) }}
            >
              <p className="text-muted">{labelFor(h.t, bucket, true)}</p>
              <p className="mt-1 flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5">
                  <span aria-hidden className="size-2 rounded-full bg-accent-text" /> {label}
                </span>
                <span className="font-mono text-fg">{format(h.v)}</span>
              </p>
              {compare?.[hover] && (
                <p className="mt-0.5 flex items-center justify-between gap-4 text-muted">
                  <span>Previous</span>
                  <span className="font-mono">{format(compare[hover].v)}</span>
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function Sparkline({ data, className }: { data: number[]; className?: string }) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => `${((i / (data.length - 1)) * 100).toFixed(2)},${(28 - (v / max) * 26).toFixed(2)}`).join(" ");
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className={cn("h-8 w-full", className)} aria-hidden>
      <polyline points={pts} fill="none" stroke="var(--accent-text)" strokeWidth={1.5} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  );
}

export type BarRow = { key: string; value: number; sub?: string };

/** Ranked horizontal bars. Each label is a link that filters the whole dashboard by that value. */
export function BarList({ rows, format: formatName = "number", filterBase, filterParam, empty = "No data for this period.", max: maxRows = 10 }: { rows: BarRow[]; format?: FormatName; filterBase?: string; filterParam?: string; empty?: string; max?: number }) {
  const format = FORMATS[formatName];
  const filterHref = filterBase && filterParam ? (key: string) => `${filterBase}${filterBase.includes("?") ? "&" : "?"}${filterParam}=${encodeURIComponent(key)}` : undefined;
  const [all, setAll] = useState(false);
  if (!rows.length) return <p className="py-6 text-center text-14 text-muted">{empty}</p>;
  const shown = all ? rows : rows.slice(0, maxRows);
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <div>
      <ul className="space-y-1">
        {shown.map((r) => (
          <li key={r.key} className="group relative flex h-8 items-center justify-between gap-3 px-2 text-[0.8125rem]" title={`${r.key}: ${format(r.value)}`}>
            <span aria-hidden className="absolute inset-y-0.5 left-0 rounded-[4px] bg-accent-soft transition-colors duration-150 group-hover:bg-accent-text/20" style={{ width: `${Math.max(1.5, (r.value / max) * 100)}%` }} />
            {filterHref ? (
              <Link href={filterHref(r.key)} className="relative min-w-0 truncate hover:underline" scroll={false}>
                {r.key}
              </Link>
            ) : (
              <span className="relative min-w-0 truncate">{r.key}</span>
            )}
            <span className="relative shrink-0 font-mono text-muted">
              {format(r.value)}
              {r.sub && <span className="ml-2 text-subtle">{r.sub}</span>}
            </span>
          </li>
        ))}
      </ul>
      {rows.length > maxRows && (
        <button type="button" onClick={() => setAll((a) => !a)} className="mt-2 px-2 text-[0.75rem] text-muted hover:text-fg">
          {all ? "Show less" : `Show all ${rows.length}`}
        </button>
      )}
    </div>
  );
}

export function Funnel({ steps }: { steps: { key: string; value: number }[] }) {
  const top = Math.max(steps[0]?.value ?? 0, 1);
  return (
    <ol className="space-y-3">
      {steps.map((s, i) => {
        const prev = i ? steps[i - 1].value : null;
        const drop = prev ? Math.round((1 - s.value / prev) * 100) : null;
        return (
          <li key={s.key}>
            <div className="mb-1 flex items-baseline justify-between text-[0.8125rem]">
              <span>
                {i + 1}. {s.key}
              </span>
              <span className="font-mono">
                {s.value.toLocaleString()} {prev !== null && prev > 0 && <span className={cn("ml-2", drop && drop > 0 ? "text-danger" : "text-subtle")}>−{Math.max(0, drop ?? 0)}%</span>}
              </span>
            </div>
            <div className="h-7 overflow-hidden rounded-[4px] bg-surface-2">
              <div className="h-full rounded-[4px] bg-accent-text/80" style={{ width: `${Math.max(1, (s.value / top) * 100)}%` }} title={`${s.key}: ${s.value}`} />
            </div>
          </li>
        );
      })}
    </ol>
  );
}

"use client";

import { useEffect, useState } from "react";
import { BarList } from "./charts";
import { Panel } from "./ui";
import { timeAgo } from "@/lib/utils";

type Data = {
  now: number;
  pages: { key: string; value: number }[];
  sources: { key: string; value: number }[];
  feed: { id: string; ts: string; type: string; path: string; city: string | null; country: string | null; props: Record<string, unknown> | null }[];
};

const VERB: Record<string, string> = {
  pageview: "viewed",
  product_view: "viewed product",
  buy_click: "clicked Buy on",
  checkout_start: "started checkout on",
  purchase: "bought",
  download: "downloaded",
  lead: "sent a message from",
  search: "searched for",
  cv_download: "downloaded the CV from",
  outbound: "left via a link on",
  "404": "hit a broken link",
};

function describe(e: Data["feed"][number]) {
  const where = e.city ? `in ${e.city}` : e.country ? `in ${e.country}` : "";
  const product = typeof e.props?.product === "string" ? e.props.product : null;
  const what = e.type === "search" ? `“${String(e.props?.q ?? "")}”` : product ?? e.path;
  return `Someone ${where} ${VERB[e.type] ?? e.type} ${what}`.replace(/\s+/g, " ");
}

/** Polls every 10s while the tab is visible. */
export function Realtime({ initial }: { initial: Data }) {
  const [data, setData] = useState(initial);
  const [, tick] = useState(0);
  useEffect(() => {
    let stop = false;
    async function load() {
      if (document.visibilityState !== "visible") return;
      const res = await fetch("/api/admin/analytics/realtime", { cache: "no-store" });
      if (res.ok && !stop) setData(await res.json());
    }
    const id = setInterval(() => {
      void load();
      tick((t) => t + 1);
    }, 10_000);
    return () => {
      stop = true;
      clearInterval(id);
    };
  }, []);

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <div className="space-y-6 lg:col-span-5">
        <div className="rounded-xl border border-border bg-surface p-6">
          <p className="flex items-center gap-2 text-14 text-muted">
            <span aria-hidden className="size-2 rounded-full bg-accent motion-safe:animate-[pulse-dot_2s_ease-in-out_infinite]" /> On the site now (last 5 min)
          </p>
          <p className="mt-2 font-mono text-64 leading-none font-medium tracking-tight" aria-live="polite">
            {data.now}
          </p>
        </div>
        <Panel title="Pages being viewed">
          <BarList rows={data.pages} empty="Nobody right now." />
        </Panel>
        <Panel title="Came from">
          <BarList rows={data.sources} empty="Nobody right now." />
        </Panel>
      </div>
      <Panel title="Live feed · last hour" className="lg:col-span-7">
        {data.feed.length === 0 ? (
          <p className="py-6 text-center text-14 text-muted">No activity in the last hour.</p>
        ) : (
          <ul className="divide-y divide-border">
            {data.feed.map((e) => (
              <li key={e.id} className="flex items-start justify-between gap-4 py-2.5 text-[0.8125rem]">
                <span className={e.type === "purchase" ? "text-accent-text" : undefined}>{describe(e)}</span>
                <span className="shrink-0 font-mono text-[0.75rem] text-subtle">{timeAgo(e.ts)}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

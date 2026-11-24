/** Number formatters shared by server pages and client charts (charts receive a format *name*). */
type Fmt = (v: number) => string;

const num: Fmt = (v) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 1, notation: v >= 10000 ? "compact" : "standard" }).format(v);
const ngn: Fmt = (v) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0, notation: v >= 1e8 ? "compact" : "standard" }).format(v / 100);
export const FORMATS = { number: num, ngn, percent: (v: number) => `${v.toFixed(1)}%`, seconds: (v: number) => (v >= 60 ? `${Math.floor(v / 60)}m ${Math.round(v % 60)}s` : `${Math.round(v)}s`) } satisfies Record<string, Fmt>;
export type FormatName = keyof typeof FORMATS;

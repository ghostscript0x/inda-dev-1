import { cn, formatMoney } from "@/lib/utils";

export function Price({ ngn, isFree, className }: { ngn: number; isFree: boolean; className?: string }) {
  return <span className={cn("font-mono tabular-nums", className)}>{isFree ? "Free" : formatMoney(ngn)}</span>;
}

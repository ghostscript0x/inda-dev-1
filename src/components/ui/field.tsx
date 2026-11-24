import { forwardRef, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const base =
  "w-full rounded-lg border border-border bg-surface px-3 text-16 md:text-14 text-fg placeholder:text-subtle transition-colors duration-150 hover:border-border-strong focus-visible:outline-none focus-visible:border-accent-text focus-visible:ring-2 focus-visible:ring-accent-text/25 disabled:opacity-60 aria-[invalid=true]:border-danger";

export const Input = forwardRef<HTMLInputElement, ComponentProps<"input">>(function Input({ className, ...p }, ref) {
  return <input ref={ref} className={cn(base, "h-10", className)} {...p} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, ComponentProps<"textarea">>(function Textarea({ className, ...p }, ref) {
  return <textarea ref={ref} className={cn(base, "min-h-28 py-2.5 leading-relaxed", className)} {...p} />;
});

export const Select = forwardRef<HTMLSelectElement, ComponentProps<"select">>(function Select({ className, ...p }, ref) {
  return <select ref={ref} className={cn(base, "h-10 appearance-none bg-[length:16px] bg-[right_0.6rem_center] bg-no-repeat pr-8", className)} style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2371717a' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")" }} {...p} />;
});

export function Label({ className, ...p }: ComponentProps<"label">) {
  return <label className={cn("mb-1.5 block text-14 font-medium text-fg", className)} {...p} />;
}

export function Field({ label, htmlFor, error, hint, children, className }: { label: ReactNode; htmlFor: string; error?: string; hint?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className="mt-1.5 text-14 text-danger" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-14 text-subtle">{hint}</p>
      ) : null}
    </div>
  );
}

export function Checkbox({ className, ...p }: ComponentProps<"input">) {
  return <input type="checkbox" className={cn("mt-0.5 size-4 shrink-0 rounded border-border-strong accent-[var(--accent-text)]", className)} {...p} />;
}

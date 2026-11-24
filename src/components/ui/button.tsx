import Link from "next/link";
import { forwardRef, type ComponentProps } from "react";
import { cn } from "@/lib/utils";

const variants = {
  primary: "bg-accent text-accent-ink hover:bg-accent/90 font-medium",
  outline: "border border-border-strong text-fg hover:bg-surface-2 hover:border-subtle",
  ghost: "text-muted hover:text-fg hover:bg-surface-2",
  danger: "bg-danger/10 text-danger hover:bg-danger/15 border border-danger/30",
  subtle: "bg-surface-2 text-fg hover:bg-border border border-border",
} as const;
const sizes = {
  sm: "h-8 px-3 text-14 gap-1.5 rounded-md",
  md: "h-10 px-4 text-14 gap-2 rounded-lg",
  lg: "h-12 px-5 text-16 gap-2 rounded-lg",
  icon: "h-10 w-10 rounded-lg",
  "icon-sm": "h-8 w-8 rounded-md",
} as const;

export type ButtonStyle = { variant?: keyof typeof variants; size?: keyof typeof sizes };

export function buttonClass({ variant = "primary", size = "md" }: ButtonStyle = {}, className?: string) {
  return cn(
    "inline-flex items-center justify-center whitespace-nowrap transition-colors duration-150 ease-out select-none",
    "disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
    variants[variant],
    sizes[size],
    className,
  );
}

export const Button = forwardRef<HTMLButtonElement, ComponentProps<"button"> & ButtonStyle>(function Button(
  { className, variant, size, type = "button", ...props },
  ref,
) {
  return <button ref={ref} type={type} className={buttonClass({ variant, size }, className)} {...props} />;
});

export function ButtonLink({ className, variant, size, ...props }: ComponentProps<typeof Link> & ButtonStyle) {
  return <Link className={buttonClass({ variant, size }, className)} {...props} />;
}

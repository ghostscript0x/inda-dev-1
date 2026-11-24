import Image from "next/image";
import type { MediaInfo } from "@/lib/data";
import { cn } from "@/lib/utils";

/** A stored image, or a quiet placeholder built from the logo's stroke when none is set yet. */
export function MediaImage({ media, alt, className, sizes, priority, label }: { media?: MediaInfo | null; alt?: string; className?: string; sizes: string; priority?: boolean; label?: string }) {
  if (!media)
    return (
      <div className={cn("relative flex items-center justify-center overflow-hidden bg-surface-2", className)} role="img" aria-label={alt ?? label ?? "Image coming soon"}>
        <svg aria-hidden viewBox="0 0 100 60" className="absolute inset-0 h-full w-full text-border-strong" preserveAspectRatio="none">
          <path d="M0 60 L100 0" stroke="currentColor" strokeWidth="0.3" vectorEffect="non-scaling-stroke" />
        </svg>
        {label && <span className="relative font-mono text-14 text-subtle">{label}</span>}
      </div>
    );
  return (
    <div className={cn("relative overflow-hidden bg-surface-2", className)}>
      <Image src={media.url} alt={alt ?? media.alt} fill sizes={sizes} priority={priority} className="object-cover" />
    </div>
  );
}

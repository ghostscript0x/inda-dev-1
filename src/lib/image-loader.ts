"use client";

/** next/image loader: Cloudinary URLs get width + auto format/quality (AVIF/WebP); local files pass through. */
export default function loader({ src, width, quality }: { src: string; width: number; quality?: number }) {
  const marker = "/image/upload/";
  if (src.includes("res.cloudinary.com") && src.includes(marker)) {
    const [base, rest] = src.split(marker);
    return `${base}${marker}f_auto,q_${quality ?? "auto"},c_limit,w_${width}/${rest}`;
  }
  return `${src}${src.includes("?") ? "&" : "?"}w=${width}`;
}

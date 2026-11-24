import "server-only";
import { slugify } from "./utils";

/**
 * A URL slug generated from a title, made unique with -2, -3… when needed.
 * `taken` reports whether a slug is already used by another record.
 */
export async function uniqueSlug(title: string, taken: (slug: string) => Promise<boolean>) {
  const root = slugify(title).slice(0, 72).replace(/-+$/, "") || "untitled";
  let slug = root;
  for (let i = 2; await taken(slug); i++) slug = `${root}-${i}`;
  return slug;
}

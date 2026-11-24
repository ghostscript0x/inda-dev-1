import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";

export const json = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { "cache-control": "no-store" } });
export const fail = (error: string, status = 400, extra?: Record<string, unknown>) => json({ error, ...extra }, status);

const MAX_BODY = 64 * 1024;

/** Parse and validate a JSON body. Returns the data or a ready-made error response. */
export async function readJson<T extends z.ZodType>(req: Request, schema: T): Promise<{ data: z.infer<T> } | { res: NextResponse }> {
  const text = await req.text();
  if (text.length > MAX_BODY) return { res: fail("Request too large.", 413) };
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { res: fail("Invalid JSON.") };
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) fields[String(issue.path[0] ?? "form")] ??= issue.message;
    return { res: fail("Please check the highlighted fields.", 422, { fields }) };
  }
  return { data: parsed.data };
}

/** Same-origin check for browser POSTs (defence in depth alongside SameSite cookies). */
export function sameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return true; // non-browser clients; still validated and rate-limited
  try {
    return new URL(origin).host === new URL(req.url).host || new URL(origin).host === req.headers.get("x-forwarded-host");
  } catch {
    return false;
  }
}

export const emailSchema = z.string().trim().toLowerCase().email("Please enter a valid email.").max(200);

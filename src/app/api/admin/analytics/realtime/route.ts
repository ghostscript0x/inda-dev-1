import { getSession } from "@/lib/auth";
import { realtime } from "@/lib/analytics-queries";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = await getSession();
  if (!s?.verified) return new Response("Unauthorized", { status: 401 });
  return Response.json(await realtime(), { headers: { "cache-control": "no-store" } });
}

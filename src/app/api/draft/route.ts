import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

/** Enable draft mode for the signed-in admin, then open the page being previewed. */
export async function GET(req: Request) {
  const session = await getSession();
  if (!session?.verified) return new Response("Not signed in", { status: 401 });
  const path = new URL(req.url).searchParams.get("path") ?? "/";
  const safe = path.startsWith("/") && !path.startsWith("//") ? path : "/";
  (await draftMode()).enable();
  redirect(safe);
}

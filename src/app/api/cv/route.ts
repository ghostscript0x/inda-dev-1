import { db } from "@/lib/db";
import { readStored } from "@/lib/storage";

/** Public CV download (file stored privately so its URL never changes). */
export async function GET() {
  const s = await db.siteSettings.findUnique({ where: { id: 1 }});
  if (!s?.cvFileId) return new Response("No CV uploaded", { status: 404 });
  const media = await db.media.findUnique({ where: { id: s.cvFileId } });
  if (!media) return new Response("No CV uploaded", { status: 404 });
  const bytes = await readStored(media.cloudinaryId);
  return new Response(new Uint8Array(bytes), {
    headers: {
      "content-type": media.mime || "application/pdf",
      "content-disposition": `attachment; filename="Abdul-Quddus-Inda-CV.pdf"`,
      "cache-control": "public, max-age=300, s-maxage=3600",
    },
  });
}

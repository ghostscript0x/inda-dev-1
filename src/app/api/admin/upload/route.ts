import { z } from "zod";
import { requireWriter, audit } from "@/lib/auth";
import { env } from "@/lib/env";
import { fail, json, sameOrigin } from "@/lib/api";
import { registerDirectUpload, signDirectUpload, storeUpload } from "@/lib/media";

export const runtime = "nodejs";

/**
 * Admin uploads.
 *  - multipart/form-data: server-side upload (local dev, or small files)
 *  - JSON { action: "sign" }: signed params for a direct browser → Cloudinary upload
 *  - JSON { action: "register", ... }: record a direct upload after verifying it with Cloudinary
 */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail("Forbidden", 403);
  let session;
  try {
    session = await requireWriter();
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Unauthorized", 401);
  }

  try {
    if ((req.headers.get("content-type") ?? "").includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file");
      if (!(file instanceof File)) return fail("No file received.");
      const media = await storeUpload(file, { private: form.get("private") === "1", alt: String(form.get("alt") ?? "") });
      await audit(session.user.id, "media.upload", media.id, { filename: media.filename, private: media.private });
      return json({ media });
    }

    const body = z
      .discriminatedUnion("action", [
        z.object({ action: z.literal("sign"), private: z.boolean() }),
        z.object({ action: z.literal("register"), publicId: z.string().max(300), resourceType: z.enum(["image", "raw"]), private: z.boolean(), filename: z.string().max(200), mime: z.string().max(100), alt: z.string().max(300).optional() }),
      ])
      .safeParse(await req.json());
    if (!body.success) return fail("Invalid request.");
    if (!env.cloudinary) return json({ direct: false });
    if (body.data.action === "sign") return json({ direct: true, ...signDirectUpload(body.data.private) });
    const media = await registerDirectUpload(body.data);
    await audit(session.user.id, "media.upload", media.id, { filename: media.filename, private: media.private });
    return json({ media });
  } catch (err) {
    console.error("[admin/upload]", err);
    return fail(err instanceof Error ? err.message : "Upload failed.", 400);
  }
}

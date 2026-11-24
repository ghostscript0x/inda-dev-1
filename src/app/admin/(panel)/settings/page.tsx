import { z } from "zod";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/shell";
import { SettingsForm } from "@/components/admin/settings-form";
import { socialSchema } from "@/lib/content";

export const metadata = { title: "Site settings" };

export default async function SettingsPage() {
  const s = await db.siteSettings.findUniqueOrThrow({ where: { id: 1 } });
  const cv = s.cvFileId ? await db.media.findUnique({ where: { id: s.cvFileId } }) : null;
  const socials = z.array(socialSchema).safeParse(s.socials);
  return (
    <>
      <PageHeader title="Site settings" description="Your name, contact details, social links, availability and CV." />
      <SettingsForm
        initial={{
          name: s.name,
          tagline: s.tagline,
          bio: s.bio,
          email: s.email,
          whatsapp: s.whatsapp,
          bookingUrl: s.bookingUrl,
          availability: s.availability,
          availabilityText: s.availabilityText,
          socials: socials.success ? socials.data : [],
          cv: cv ? { id: cv.id, url: cv.url, filename: cv.filename, bytes: cv.bytes } : null,
        }}
      />
    </>
  );
}

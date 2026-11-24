import { LegalPage, legalMetadata } from "@/components/legal-page";

export const generateMetadata = () => legalMetadata("license");

export default function Page() {
  return <LegalPage slug="license" />;
}

import { LegalPage, legalMetadata } from "@/components/legal-page";

export const generateMetadata = () => legalMetadata("refunds");

export default function Page() {
  return <LegalPage slug="refunds" />;
}

import type { Metadata } from "next";
import { Toaster } from "sonner";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin · inda.dev" }, robots: { index: false, follow: false } };

export default function AdminRoot({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster position="bottom-right" theme="system" toastOptions={{ className: "!bg-surface !border-border !text-fg" }} />
    </>
  );
}

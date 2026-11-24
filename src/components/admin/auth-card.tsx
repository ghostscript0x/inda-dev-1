import { Lock } from "lucide-react";
import { Logo } from "@/components/logo";

export function AuthCard({ title, text, children }: { title: string; text?: string; children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-bg px-4 py-12">
      <div className="w-full max-w-[400px]">
        <Logo className="mx-auto h-7 w-auto" />
        <div className="mt-8 rounded-2xl border border-border bg-surface p-6 sm:p-8">
          <h1 className="text-24 font-semibold tracking-tight">{title}</h1>
          {text && <p className="mt-1.5 text-14 text-muted">{text}</p>}
          <div className="mt-6">{children}</div>
        </div>
        <p className="mt-6 flex items-center justify-center gap-1.5 text-[0.75rem] text-subtle">
          <Lock className="size-3" aria-hidden /> Two-factor sign-in is required for every admin.
        </p>
      </div>
    </main>
  );
}

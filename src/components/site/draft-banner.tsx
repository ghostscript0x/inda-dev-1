export function DraftBanner() {
  return (
    <div className="relative z-50 flex items-center justify-center gap-3 bg-warning px-4 py-2 text-14 font-medium text-black">
      Preview mode: you are seeing unpublished drafts.
      <a href="/api/draft/disable" className="underline underline-offset-2">
        Exit preview
      </a>
    </div>
  );
}

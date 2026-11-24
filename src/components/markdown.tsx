import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Tiny, safe Markdown subset for admin-edited text: ## / ### headings, "- " lists,
 * paragraphs, **bold**, and [links](url). Produces React elements only (no raw HTML).
 */
function inline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1]) out.push(<strong key={`${keyBase}-b${i++}`}>{m[1]}</strong>);
    else {
      const href = m[3];
      const safe = /^(https?:|mailto:|\/)/.test(href) ? href : "#";
      out.push(
        safe.startsWith("/") ? (
          <Link key={`${keyBase}-l${i++}`} href={safe}>
            {m[2]}
          </Link>
        ) : (
          <a key={`${keyBase}-l${i++}`} href={safe} target={safe.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer">
            {m[2]}
          </a>
        ),
      );
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function Markdown({ source }: { source: string }) {
  const blocks = source.replace(/\r\n/g, "\n").split(/\n{2,}/);
  return (
    <div className="prose-plain">
      {blocks.map((block, bi) => {
        const b = block.trim();
        if (!b) return null;
        if (b.startsWith("### ")) return <h3 key={bi}>{inline(b.slice(4), `h${bi}`)}</h3>;
        if (b.startsWith("## ")) return <h2 key={bi}>{inline(b.slice(3), `h${bi}`)}</h2>;
        const lines = b.split("\n");
        if (lines.every((l) => /^\s*[-*] /.test(l)))
          return (
            <ul key={bi}>
              {lines.map((l, li) => (
                <li key={li}>{inline(l.replace(/^\s*[-*] /, ""), `l${bi}-${li}`)}</li>
              ))}
            </ul>
          );
        return <p key={bi}>{inline(lines.join(" "), `p${bi}`)}</p>;
      })}
    </div>
  );
}

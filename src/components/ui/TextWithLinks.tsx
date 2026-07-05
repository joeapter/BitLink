import Link from "next/link";

const INLINE_LINK = /\[([^\]]+)\]\(([^)\s]+)\)/g;

/**
 * Renders copy that may contain inline [label](href) links.
 * The matching JSON-LD keeps plain text via stripInlineLinks in seo.ts.
 */
export function TextWithLinks({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  const pattern = new RegExp(INLINE_LINK);
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    const [token, label, href] = match;
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(
      href.startsWith("/") ? (
        <Link key={`${href}-${match.index}`} href={href} className="font-semibold text-link-blue transition hover:text-ink">
          {label}
        </Link>
      ) : (
        <a
          key={`${href}-${match.index}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-link-blue transition hover:text-ink"
        >
          {label}
        </a>
      ),
    );
    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <>{parts}</>;
}

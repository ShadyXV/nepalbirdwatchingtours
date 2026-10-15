import type { ReactNode } from "react";
import { Link, type LinkProps } from "react-router";

/*
 * Links are never underlined (owner, 2026-10-15). They read by colour (the accent) and turn to the
 * text colour on hover; keyboard focus gets the global focus ring (app.css).
 */

/** A link inside a list or a line of text: accent colour, no arrow. */
export const inlineLinkClasses = "text-accent transition-colors duration-(--duration-micro) ease-out hover:text-fg";

/** A standalone "go somewhere" link: label caps, accent colour, a small arrow after the words. */
export const arrowLinkClasses = `eyebrow inline-flex min-h-tap items-center gap-2 ${inlineLinkClasses}`;

/** A standalone router link with a small trailing arrow, e.g. "More about Krishna". */
export function ArrowLink({ className, children, ...props }: LinkProps & { children: ReactNode }) {
  return (
    <Link className={[arrowLinkClasses, className].filter(Boolean).join(" ")} {...props}>
      <span>{children}</span>
      <LinkArrow />
    </Link>
  );
}

/** The small arrow, for links that are not router links (e.g. a button styled as a link). */
export function LinkArrow({ className = "size-3" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className={`shrink-0 fill-none stroke-current ${className}`} strokeWidth="1.5">
      <path d="M1 8h13M9 3l5 5-5 5" />
    </svg>
  );
}

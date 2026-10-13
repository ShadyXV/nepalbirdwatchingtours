import type { ComponentProps, ElementType } from "react";

/** Visual level, mapped to the type tokens in design/tokens.css (--text-hero ... --text-h3). */
export type HeadingLevel = "hero" | "h1" | "h2" | "h3";

const levelClasses: Record<HeadingLevel, string> = {
  hero: "text-hero",
  h1: "text-h1",
  h2: "text-h2",
  h3: "text-h3",
};

const defaultTag: Record<HeadingLevel, ElementType> = { hero: "h1", h1: "h1", h2: "h2", h3: "h3" };

type HeadingProps = ComponentProps<"h1"> & {
  level: HeadingLevel;
  /** Rendered element; defaults to the tag matching `level` (hero renders an h1). */
  as?: ElementType;
};

/** Display-face uppercase heading. Visual size (`level`) is independent of the semantic tag (`as`). */
export function Heading({ level, as, className, ...props }: HeadingProps) {
  const Tag = as ?? defaultTag[level];
  return <Tag className={["font-display uppercase", levelClasses[level], className].filter(Boolean).join(" ")} {...props} />;
}

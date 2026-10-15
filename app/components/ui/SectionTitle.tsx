import type { ComponentProps, ElementType } from "react";

type SectionTitleProps = ComponentProps<"h2"> & {
  /** "lg" for a section's title, "md" for titles inside a section. */
  size?: "lg" | "md";
  /** Rendered element; h2 by default. */
  as?: ElementType;
};

/**
 * The calm title: the accent italic (Fraunces Thin, wonky) in sentence case, for section titles
 * where the tall display caps would shout (home sections, trip report sections). Page titles keep
 * the display face (`Heading`).
 */
export function SectionTitle({ size = "lg", as, className, ...props }: SectionTitleProps) {
  const Tag = as ?? "h2";
  const scale = size === "lg" ? "text-section" : "text-section-sm";
  return <Tag className={["accent text-fg", scale, className].filter(Boolean).join(" ")} {...props} />;
}

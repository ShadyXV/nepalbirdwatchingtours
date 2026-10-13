import type { ComponentProps } from "react";

type Variant = "primary" | "ghost";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary: "bg-forest text-snow hover:bg-ink",
  ghost: "border border-ink/30 text-ink hover:bg-paper-deep",
};

function classes(variant: Variant, className?: string) {
  return [base, variants[variant], className].filter(Boolean).join(" ");
}

type ButtonProps = ComponentProps<"button"> & { variant?: Variant };

export function Button({ variant = "primary", className, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={classes(variant, className)} {...props} />;
}

type ButtonLinkProps = ComponentProps<"a"> & { variant?: Variant };

export function ButtonLink({ variant = "primary", className, ...props }: ButtonLinkProps) {
  return <a className={classes(variant, className)} {...props} />;
}

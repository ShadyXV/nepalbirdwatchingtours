import type { ComponentProps } from "react";

type Variant = "primary" | "ghost";
type Size = "md" | "sm";

const base =
  "eyebrow inline-flex items-center justify-center gap-2 rounded-button text-center transition-colors duration-(--duration-micro) ease-out disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-accent-fg hover:bg-fg",
  ghost: "border border-fg text-fg hover:bg-fg/10",
};

const sizes: Record<Size, string> = {
  md: "min-h-tap px-6 py-3",
  sm: "min-h-tap px-4 py-2",
};

/** Button classes, for elements that must look like a button (e.g. a router `<Link>`). */
export function buttonClasses(variant: Variant = "primary", size: Size = "md", className?: string) {
  return [base, variants[variant], sizes[size], className].filter(Boolean).join(" ");
}

const classes = buttonClasses;

type ButtonProps = ComponentProps<"button"> & { variant?: Variant; size?: Size };

export function Button({ variant = "primary", size = "md", className, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={classes(variant, size, className)} {...props} />;
}

type ButtonLinkProps = ComponentProps<"a"> & { variant?: Variant; size?: Size };

export function ButtonLink({ variant = "primary", size = "md", className, ...props }: ButtonLinkProps) {
  return <a className={classes(variant, size, className)} {...props} />;
}

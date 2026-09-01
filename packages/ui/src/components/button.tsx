import * as React from "react";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  const base =
    "inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] disabled:opacity-50";
  const variants: Record<Variant, string> = {
    primary: "bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:bg-[#005454]",
    secondary:
      "border border-[var(--color-outline-variant)] bg-white text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container)]",
    ghost: "text-[var(--color-primary)] hover:bg-[var(--color-surface-container)]",
  };
  const sizes: Record<Size, string> = {
    sm: "h-8 px-3 text-sm rounded-[var(--radius)]",
    md: "h-10 px-4 text-sm rounded-[var(--radius)]",
    lg: "h-11 px-6 text-base rounded-[var(--radius-md)]",
  };
  return <button className={`${base} ${variants[variant as Variant]} ${sizes[size as Size]} ${className}`} {...props} />;
}

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot as SlotPrimitive } from "radix-ui";
import { cn } from "../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center border border-transparent font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] [&_svg]:-ms-px [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--color-primary)] text-[var(--color-on-primary)]",
        secondary:
          "bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)]",
        success:
          "bg-[var(--color-status-green)] text-white",
        warning:
          "bg-[var(--color-status-yellow)] text-white",
        info:
          "bg-[var(--color-status-blue)] text-white",
        critical:
          "bg-[var(--color-status-red)] text-white",
        neutral:
          "bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)]",
        outline:
          "bg-transparent border border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)]",
      },
      appearance: {
        default: "",
        light: "",
        outline: "",
        ghost: "border-transparent bg-transparent",
      },
      disabled: {
        true: "opacity-50 pointer-events-none",
      },
      size: {
        lg: "rounded-md px-2 h-7 min-w-7 gap-1.5 text-xs [&_svg]:size-3.5",
        md: "rounded-md px-[0.45rem] h-6 min-w-6 gap-1.5 text-xs [&_svg]:size-3.5",
        sm: "rounded-sm px-[0.325rem] h-5 min-w-5 gap-1 text-[0.6875rem] leading-[0.75rem] [&_svg]:size-3",
        xs: "rounded-sm px-1 h-4 min-w-4 gap-1 text-[0.625rem] leading-[0.5rem] [&_svg]:size-3",
      },
      shape: {
        default: "",
        circle: "rounded-full",
      },
    },
    compoundVariants: [
      /* Light appearance */
      {
        variant: "success",
        appearance: "light",
        className: "bg-[#dcfce7] text-[#166534]",
      },
      {
        variant: "warning",
        appearance: "light",
        className: "bg-[#fef3c7] text-[#92400e]",
      },
      {
        variant: "critical",
        appearance: "light",
        className: "bg-[#fee2e2] text-[#991b1b]",
      },
      {
        variant: "info",
        appearance: "light",
        className: "bg-[#dbeafe] text-[#1e40af]",
      },
      {
        variant: "primary",
        appearance: "light",
        className: "bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)]",
      },
      /* Outline appearance */
      {
        variant: "success",
        appearance: "outline",
        className: "bg-[#f0fdf4] border-[#86efac] text-[#166534]",
      },
      {
        variant: "warning",
        appearance: "outline",
        className: "bg-[#fffbeb] border-[#fcd34d] text-[#92400e]",
      },
      {
        variant: "critical",
        appearance: "outline",
        className: "bg-[#fff1f2] border-[#fca5a5] text-[#991b1b]",
      },
      {
        variant: "info",
        appearance: "outline",
        className: "bg-[#eff6ff] border-[#93c5fd] text-[#1e40af]",
      },
      /* Ghost appearance */
      {
        variant: "success",
        appearance: "ghost",
        className: "text-[var(--color-status-green)]",
      },
      {
        variant: "warning",
        appearance: "ghost",
        className: "text-[var(--color-status-yellow)]",
      },
      {
        variant: "critical",
        appearance: "ghost",
        className: "text-[var(--color-status-red)]",
      },
      {
        variant: "info",
        appearance: "ghost",
        className: "text-[var(--color-status-blue)]",
      },
      {
        variant: "primary",
        appearance: "ghost",
        className: "text-[var(--color-primary)]",
      },
      { size: "lg", appearance: "ghost", className: "px-0" },
      { size: "md", appearance: "ghost", className: "px-0" },
      { size: "sm", appearance: "ghost", className: "px-0" },
      { size: "xs", appearance: "ghost", className: "px-0" },
    ],
    defaultVariants: {
      variant: "neutral",
      appearance: "default",
      size: "md",
    },
  }
);

const badgeButtonVariants = cva(
  "cursor-pointer transition-all inline-flex items-center justify-center leading-none size-3.5 [&>svg]:size-3.5 p-0 rounded-md -me-0.5 opacity-60 hover:opacity-100",
  {
    variants: {
      variant: { default: "" },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  asChild?: boolean;
  disabled?: boolean;
}

export interface BadgeButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof badgeButtonVariants> {
  asChild?: boolean;
}

export type BadgeDotProps = React.HTMLAttributes<HTMLSpanElement>;

function Badge({
  className,
  variant,
  size,
  appearance,
  shape,
  asChild = false,
  disabled,
  ...props
}: BadgeProps) {
  const Comp = asChild ? SlotPrimitive.Slot : "span";
  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant, size, appearance, shape, disabled }), className)}
      {...(props as React.HTMLAttributes<HTMLElement>)}
    />
  );
}

function BadgeButton({
  className,
  variant,
  asChild = false,
  ...props
}: BadgeButtonProps) {
  const Comp = asChild ? (SlotPrimitive.Slot as React.ElementType) : "span";
  return (
    <Comp
      data-slot="badge-button"
      className={cn(badgeButtonVariants({ variant, className }))}
      role="button"
      {...props}
    />
  );
}

function BadgeDot({ className, ...props }: BadgeDotProps) {
  return (
    <span
      data-slot="badge-dot"
      className={cn("size-1.5 rounded-full bg-[currentColor] opacity-75", className)}
      {...props}
    />
  );
}

/* Legacy HealthBadge — kept for backward compat */
export function HealthBadge({ health }: { health: "GREEN" | "YELLOW" | "RED" }) {
  const variant =
    health === "GREEN" ? "success" : health === "YELLOW" ? "warning" : "critical";
  const label =
    health === "GREEN" ? "On Track" : health === "YELLOW" ? "At Risk" : "Delayed";
  return (
    <Badge variant={variant} appearance="light">
      {label}
    </Badge>
  );
}

export { Badge, BadgeButton, BadgeDot, badgeVariants };

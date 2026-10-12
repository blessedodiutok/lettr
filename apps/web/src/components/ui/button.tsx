import { Loader2 } from "lucide-react";
import { Slot } from "radix-ui";
import * as React from "react";
import { cn } from "../../lib/cn";

const variants = {
  primary: "bg-navy text-on-navy hover:bg-navy-hover shadow-1",
  accent: "bg-brass text-on-brass hover:bg-brass-hover shadow-1",
  secondary: "bg-surface text-ink border border-line-strong hover:bg-surface-2",
  ghost: "bg-transparent text-ink-2 hover:bg-surface-2 hover:text-ink",
  danger: "bg-bad text-white hover:opacity-90 dark:text-on-navy",
  link: "bg-transparent text-navy underline-offset-4 hover:underline px-0 h-auto",
} as const;

const sizes = {
  sm: "h-8 px-3 text-[13px] gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-5 text-[15px] gap-2",
  icon: "h-10 w-10 justify-center",
} as const;

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  isLoading?: boolean;
  /** Render the child (e.g. a Link) with button styles. */
  asChild?: boolean;
  block?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", isLoading, asChild, block, className, children, disabled, type, ...props },
  ref,
) {
  const classes = cn(
    "inline-flex items-center justify-center whitespace-nowrap rounded-control font-semibold transition-colors duration-150",
    "disabled:pointer-events-none disabled:opacity-55",
    variants[variant],
    variant !== "link" && sizes[size],
    block && "w-full",
    className,
  );
  if (asChild) {
    return (
      <Slot.Root ref={ref} className={classes} {...props}>
        {children}
      </Slot.Root>
    );
  }
  return (
    <button ref={ref} type={type ?? "button"} className={classes} disabled={disabled || isLoading} aria-busy={isLoading || undefined} {...props}>
      {isLoading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
});

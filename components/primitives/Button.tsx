import { type ButtonHTMLAttributes, type ReactNode } from "react";

type Variant = "primary" | "default" | "ghost";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  children: ReactNode;
};

const baseClasses =
  "inline-flex items-center gap-2 px-3.5 py-2 text-[12px] tracking-[0.04em] uppercase rounded-[4px] border transition disabled:opacity-50 disabled:cursor-not-allowed";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-accent border-accent text-bg-0 font-semibold hover:bg-[var(--color-accent-bright)]",
  default:
    "bg-bg-1 border-line text-fg-0 hover:bg-bg-3 hover:border-fg-3",
  ghost:
    "bg-transparent border-transparent text-fg-2 hover:text-fg-0 hover:bg-bg-1",
};

export function Button({ variant = "default", className = "", children, ...rest }: Props) {
  return (
    <button {...rest} className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {children}
    </button>
  );
}

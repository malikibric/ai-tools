import type { ButtonHTMLAttributes } from "react";

type Variant = "amber" | "ghost" | "healthy" | "warning" | "danger";

const BASE =
  "rounded border px-3 py-1.5 font-mono text-xs uppercase tracking-wide transition duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none";

const VARIANTS: Record<Variant, string> = {
  amber: "border-amber bg-amber text-surface hover:bg-[#4338ca] hover:-translate-y-px",
  ghost: "border-border text-text-muted hover:border-amber hover:text-text hover:-translate-y-px",
  healthy: "border-healthy text-healthy hover:bg-healthy/15 hover:-translate-y-px",
  warning: "border-at-risk text-at-risk hover:bg-at-risk/15 hover:-translate-y-px",
  danger: "border-broken text-broken hover:bg-broken/15 hover:-translate-y-px",
};

export function Btn({
  variant = "amber",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button className={`${BASE} ${VARIANTS[variant]} ${className}`} {...props} />;
}

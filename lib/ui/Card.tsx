import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-lg border border-border bg-surface p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.8),0_1px_2px_rgba(20,24,39,0.04),0_14px_34px_-20px_rgba(20,24,39,0.18)] transition-[transform,border-color,box-shadow] duration-200 ${className}`}
    >
      {children}
    </div>
  );
}

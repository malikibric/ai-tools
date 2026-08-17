import type { ReactNode } from "react";

export function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-block rounded-full bg-amber-soft px-2.5 py-0.5 font-mono text-xs uppercase tracking-wide text-amber">
      {children}
    </span>
  );
}

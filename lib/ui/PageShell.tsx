import type { ReactNode } from "react";

export function PageShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <p className="font-mono text-xs uppercase tracking-wide text-amber">TAI Labs</p>
      <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-text">{title}</h1>
      <p className="mt-2 max-w-2xl leading-relaxed text-text-muted">{description}</p>
      <div className="mt-8">{children}</div>
    </div>
  );
}

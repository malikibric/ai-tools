import Link from "next/link";
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
    <div className="mx-auto min-h-screen max-w-5xl px-6 py-10">
      <Link href="/" className="font-mono text-xs uppercase tracking-wide text-text-muted hover:text-amber">
        &larr; TAI Suite
      </Link>
      <h1 className="mt-4 font-display text-3xl font-semibold text-text">{title}</h1>
      <p className="mt-2 max-w-2xl text-text-muted">{description}</p>
      <div className="mt-8">{children}</div>
    </div>
  );
}

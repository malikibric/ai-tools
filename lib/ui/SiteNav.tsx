"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/adoption-evidence", label: "Adoption" },
  { href: "/drift-monitor", label: "Drift" },
  { href: "/review-copilot", label: "Review" },
  { href: "/shadow-scanner", label: "Shadow AI" },
];

export function SiteNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-bg/80 backdrop-blur">
      <nav className="mx-auto flex h-14 max-w-5xl items-center gap-6 px-6">
        <Link href="/" className="font-mono text-xs uppercase tracking-widest text-amber">
          TAI Suite
        </Link>
        <div className="ml-auto flex items-center gap-1">
          {LINKS.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`rounded px-3 py-1.5 font-mono text-xs uppercase tracking-wide transition-colors ${
                  active ? "bg-amber-soft text-amber" : "text-text-muted hover:text-text"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}

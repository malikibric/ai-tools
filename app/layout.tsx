import type { Metadata } from "next";
import { Fraunces, Inter, IBM_Plex_Mono } from "next/font/google";
import { SiteNav } from "@/lib/ui/SiteNav";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "TAI Labs — Prototype Suite",
  description:
    "Adoption Evidence Engine, Workflow Drift Monitor, Manager Review Copilot, and Shadow AI Discovery Scanner — four prototypes for the TAI Labs product loop.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable} ${plexMono.variable}`}>
      <body className="min-h-dvh bg-bg font-body text-text antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:border focus:border-amber focus:bg-surface focus:px-3 focus:py-2 focus:text-sm focus:text-amber"
        >
          Skip to content
        </a>
        <SiteNav />
        <main id="main">{children}</main>
        <footer className="mt-20 border-t border-border/60">
          <div className="mx-auto flex max-w-5xl flex-col gap-3 px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-mono text-xs uppercase tracking-wide text-text-muted">TAI Labs — Prototype Suite</p>
            <div className="flex items-center gap-4 text-xs text-text-muted">
              <span>Diagnose · teach · build · approve · measure</span>
              <a
                href="https://www.linkedin.com/in/malikibric"
                className="inline-flex items-center gap-1.5 font-mono uppercase tracking-wide transition-colors hover:text-amber"
              >
                Malik Ibric on LinkedIn ↗
              </a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}

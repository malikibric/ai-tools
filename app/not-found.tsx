import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60dvh] max-w-5xl flex-col items-start justify-center px-6">
      <p className="font-mono text-xs uppercase tracking-wide text-amber">404</p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-text">
        This workflow doesn&apos;t exist.
      </h1>
      <p className="mt-3 max-w-md leading-relaxed text-text-muted">
        The page you&apos;re looking for wasn&apos;t approved, or it drifted off the map.
      </p>
      <Link
        href="/"
        className="mt-6 rounded border border-amber px-4 py-2 font-mono text-xs uppercase tracking-wide text-amber transition duration-200 hover:bg-amber-soft active:scale-[0.98]"
      >
        Back to suite
      </Link>
    </div>
  );
}

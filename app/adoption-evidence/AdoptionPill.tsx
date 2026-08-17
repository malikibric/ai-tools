import type { AdoptionLevel } from "@/lib/tools/adoption-evidence/store";

const LABELS: Record<AdoptionLevel, string> = {
  strong: "Strong",
  slipping: "Slipping",
  at_risk: "At Risk",
  stalled: "Stalled",
};

const COLORS: Record<AdoptionLevel, string> = {
  strong: "bg-healthy/15 text-healthy",
  slipping: "bg-at-risk/15 text-at-risk",
  at_risk: "bg-broken/15 text-broken",
  stalled: "bg-border text-text-muted",
};

export function AdoptionPill({ level }: { level: AdoptionLevel }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 font-mono text-xs uppercase tracking-wide ${COLORS[level]}`}
    >
      {LABELS[level]}
    </span>
  );
}

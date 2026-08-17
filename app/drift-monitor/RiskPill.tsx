type RiskLevel = "healthy" | "at_risk" | "broken";

const LABELS: Record<RiskLevel, string> = {
  healthy: "Healthy",
  at_risk: "At Risk",
  broken: "Broken",
};

const COLORS: Record<RiskLevel, string> = {
  healthy: "bg-healthy/15 text-healthy",
  at_risk: "bg-at-risk/15 text-at-risk",
  broken: "bg-broken/15 text-broken",
};

export function RiskPill({ level }: { level: RiskLevel }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 font-mono text-xs uppercase tracking-wide ${COLORS[level]}`}>
      {LABELS[level]}
    </span>
  );
}

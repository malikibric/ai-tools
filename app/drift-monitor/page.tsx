import type { Metadata } from "next";
import { PageShell } from "@/lib/ui/PageShell";
import { getWorkflows } from "@/lib/tools/drift-monitor/store";
import { DriftMonitorClient } from "./DriftMonitorClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Workflow Drift Monitor — TAI Suite",
  description: "Flags approved workflows whose dependencies or behavior have likely drifted since approval.",
};

export default function DriftMonitorPage() {
  const workflows = getWorkflows();

  return (
    <PageShell
      title="Workflow Drift Monitor"
      description="Approved workflows don't stay healthy forever. Run a health check to see whether a workflow's dependencies or description show signs of drift."
    >
      <DriftMonitorClient initialWorkflows={workflows} />
    </PageShell>
  );
}

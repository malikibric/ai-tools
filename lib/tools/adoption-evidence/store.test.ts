import { describe, expect, it } from "vitest";
import { computeAdoptionMetrics, type AdoptionWorkflow } from "./store";

function workflow(overrides: Partial<AdoptionWorkflow>): AdoptionWorkflow {
  return {
    id: "wf-test",
    name: "Test workflow",
    owner: "Test owner",
    description: "",
    claimedRunsPerWeek: 10,
    claimedMinutesPerRun: 5,
    weeklyRuns: [],
    lastRunAt: null,
    instrumentedAt: new Date(0).toISOString(),
    assessment: null,
    ...overrides,
  };
}

describe("computeAdoptionMetrics", () => {
  it("scores stalled when there are no recorded runs", () => {
    const metrics = computeAdoptionMetrics(workflow({ weeklyRuns: [], lastRunAt: null }));
    expect(metrics.level).toBe("stalled");
    expect(metrics.score).toBe(0);
  });

  it("scores strong when recent usage meets or exceeds the claim and is recent", () => {
    const now = new Date().toISOString();
    const metrics = computeAdoptionMetrics(
      workflow({ claimedRunsPerWeek: 10, weeklyRuns: [8, 9, 10, 11, 10, 11, 12, 10], lastRunAt: now })
    );
    expect(metrics.level).toBe("strong");
    expect(metrics.score).toBeGreaterThanOrEqual(70);
  });

  it("scores slipping when recent usage is meaningfully below the claim", () => {
    const now = new Date().toISOString();
    const metrics = computeAdoptionMetrics(
      workflow({ claimedRunsPerWeek: 10, weeklyRuns: [10, 10, 10, 10, 6, 6, 6, 6], lastRunAt: now })
    );
    expect(metrics.level).toBe("slipping");
    expect(metrics.score).toBeGreaterThanOrEqual(40);
    expect(metrics.score).toBeLessThan(70);
  });

  it("scores at_risk when usage is low even if nonzero", () => {
    const staleDate = new Date(Date.now() - 20 * 86_400_000).toISOString();
    const metrics = computeAdoptionMetrics(
      workflow({ claimedRunsPerWeek: 10, weeklyRuns: [1, 0, 1, 0, 0, 1, 0, 0], lastRunAt: staleDate })
    );
    expect(metrics.level).toBe("at_risk");
    expect(metrics.score).toBeLessThan(40);
  });

  it("treats a nonzero recent total as never stalled regardless of score", () => {
    const staleDate = new Date(Date.now() - 30 * 86_400_000).toISOString();
    const metrics = computeAdoptionMetrics(
      workflow({ claimedRunsPerWeek: 100, weeklyRuns: [1], lastRunAt: staleDate })
    );
    expect(metrics.level).not.toBe("stalled");
  });

  it("caps adherence points at 50 even when usage exceeds the claim", () => {
    const now = new Date().toISOString();
    const metrics = computeAdoptionMetrics(
      workflow({ claimedRunsPerWeek: 5, weeklyRuns: [50, 50, 50, 50], lastRunAt: now })
    );
    expect(metrics.adherencePoints).toBe(50);
  });
});

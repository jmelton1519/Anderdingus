/** One model call. Provider-agnostic: works for a local model, a mock, or a paid API. */
export interface UsageRecord {
  model: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  /** Optional per-million-token prices; omit (or 0) for free local models. */
  costUsd?: number;
}

export interface UsageSummary {
  calls: number;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  avgLatencyMs: number;
  byModel: Record<string, number>;
}

export class UsageTracker {
  private records: UsageRecord[] = [];

  record(r: UsageRecord): void {
    this.records.push(r);
  }

  summary(): UsageSummary {
    const byModel: Record<string, number> = {};
    let inputTokens = 0;
    let outputTokens = 0;
    let costUsd = 0;
    let latency = 0;
    for (const r of this.records) {
      byModel[r.model] = (byModel[r.model] ?? 0) + 1;
      inputTokens += r.inputTokens;
      outputTokens += r.outputTokens;
      costUsd += r.costUsd ?? 0;
      latency += r.latencyMs;
    }
    const calls = this.records.length;
    return {
      calls,
      inputTokens,
      outputTokens,
      costUsd,
      avgLatencyMs: calls === 0 ? 0 : latency / calls,
      byModel,
    };
  }

  /** True once recorded spend reaches the cap (a guard for any paid provider). */
  overBudget(capUsd: number): boolean {
    return this.summary().costUsd >= capUsd;
  }
}

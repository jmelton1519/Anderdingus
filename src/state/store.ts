import type { GsiPayload } from '../gsi/schema.js';

export interface Snapshot {
  payload: GsiPayload;
  receivedAt: number;
}

/** Keeps the latest valid payload plus a short history (ring buffer). */
export class StateStore {
  private history: Snapshot[] = [];

  constructor(private readonly capacity = 50) {}

  update(payload: GsiPayload, receivedAt: number): void {
    this.history.push({ payload, receivedAt });
    if (this.history.length > this.capacity) this.history.shift();
  }

  latest(): Snapshot | null {
    return this.history[this.history.length - 1] ?? null;
  }

  size(): number {
    return this.history.length;
  }
}

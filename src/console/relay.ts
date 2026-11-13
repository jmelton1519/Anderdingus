/** Discord's hard limit for one message. */
export const DISCORD_MAX = 2000;

export interface RelayOptions {
  /** Posts one already-formatted message. */
  send: (message: string) => Promise<void>;
  /** Only lines matching this are relayed; unset relays everything. */
  filter?: RegExp;
  flushMs?: number;
  /** Cap per flush so a console spam burst cannot trip Discord rate limits. */
  maxLinesPerFlush?: number;
  onError?: (err: unknown) => void;
}

export interface Relay {
  push: (lines: string[]) => void;
  flush: () => Promise<void>;
  stop: () => Promise<void>;
}

/** Stops a line from closing the code block early. */
function clean(line: string): string {
  return line.replace(/```/g, "'''").slice(0, DISCORD_MAX - 20);
}

/** Packs lines into as few ```text code blocks as fit under the Discord limit. */
export function formatMessages(lines: string[], dropped = 0): string[] {
  const all = lines.map(clean);
  if (dropped > 0) all.push(`... ${dropped} more lines skipped`);
  const open = '```text\n';
  const close = '\n```';
  const budget = DISCORD_MAX - open.length - close.length;
  const out: string[] = [];
  let cur: string[] = [];
  let len = 0;
  for (const line of all) {
    const add = line.length + (cur.length > 0 ? 1 : 0);
    if (cur.length > 0 && len + add > budget) {
      out.push(open + cur.join('\n') + close);
      cur = [];
      len = 0;
    }
    len += line.length + (cur.length > 0 ? 1 : 0);
    cur.push(line);
  }
  if (cur.length > 0) out.push(open + cur.join('\n') + close);
  return out;
}

/** Buffers console lines and posts them in batches, read-only: nothing is ever sent back to the game. */
export function createRelay(opts: RelayOptions): Relay {
  const { send, filter, flushMs = 2000, maxLinesPerFlush = 40, onError } = opts;
  let buffer: string[] = [];
  let sending: Promise<void> = Promise.resolve();

  async function flush(): Promise<void> {
    if (buffer.length === 0) return;
    const batch = buffer.slice(0, maxLinesPerFlush);
    const dropped = buffer.length - batch.length;
    buffer = [];
    // Chain sends so messages arrive in order even if a flush overlaps a slow send.
    sending = sending.then(async () => {
      for (const msg of formatMessages(batch, dropped)) {
        try {
          await send(msg);
        } catch (err) {
          onError?.(err);
        }
      }
    });
    await sending;
  }

  const timer = setInterval(() => void flush(), flushMs);
  timer.unref();

  return {
    push: (lines) => {
      for (const l of lines) if (!filter || filter.test(l)) buffer.push(l);
    },
    flush,
    stop: async () => {
      clearInterval(timer);
      await flush();
    },
  };
}

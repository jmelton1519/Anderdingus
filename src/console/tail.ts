import { open, stat } from 'node:fs/promises';

export interface TailOptions {
  path: string;
  onLines: (lines: string[]) => void;
  onError?: (err: unknown) => void;
  intervalMs?: number;
}

export interface Tail {
  /** Reads any new bytes now. Exposed for tests; the timer calls it too. */
  poll: () => Promise<void>;
  stop: () => void;
}

const NEWLINE = 0x0a;

/**
 * Follows a growing text file (CS2's `console.log` from `-condebug`) by polling.
 * Starts at the current end, so old history is never replayed. If the file shrinks
 * (CS2 restarted and truncated it), it starts again from the top. Polling, not fs.watch,
 * because watch events are unreliable on Windows for files another process appends to.
 */
export function tailFile(opts: TailOptions): Tail {
  const { path, onLines, onError, intervalMs = 500 } = opts;
  let offset: number | null = null; // null until the first poll finds the file
  let partial = Buffer.alloc(0);
  let busy = false;

  async function poll(): Promise<void> {
    if (busy) return;
    busy = true;
    try {
      let size: number;
      try {
        size = (await stat(path)).size;
      } catch (err) {
        // Missing file is normal before CS2 starts; anything else is reported.
        if ((err as NodeJS.ErrnoException).code !== 'ENOENT') onError?.(err);
        return;
      }
      if (offset === null) {
        offset = size;
        return;
      }
      if (size < offset) {
        offset = 0;
        partial = Buffer.alloc(0);
      }
      if (size === offset) return;

      const fh = await open(path, 'r');
      try {
        const buf = Buffer.alloc(size - offset);
        const { bytesRead } = await fh.read(buf, 0, buf.length, offset);
        offset += bytesRead;
        // Split on raw newline bytes so a multi-byte character is never cut in half.
        const data = Buffer.concat([partial, buf.subarray(0, bytesRead)]);
        const last = data.lastIndexOf(NEWLINE);
        if (last === -1) {
          partial = data;
          return;
        }
        partial = data.subarray(last + 1);
        const lines = data
          .subarray(0, last)
          .toString('utf8')
          .split('\n')
          .map((l) => l.replace(/\r$/, ''))
          .filter((l) => l.trim() !== '');
        if (lines.length > 0) onLines(lines);
      } finally {
        await fh.close();
      }
    } catch (err) {
      onError?.(err);
    } finally {
      busy = false;
    }
  }

  const timer = setInterval(() => void poll(), intervalMs);
  timer.unref();
  return { poll, stop: () => clearInterval(timer) };
}

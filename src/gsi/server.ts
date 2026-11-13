import { timingSafeEqual } from 'node:crypto';
import {
  createServer,
  type IncomingMessage,
  type Server,
  type ServerResponse,
} from 'node:http';
import type { Logger } from 'pino';
import { answer, isQueryName } from '../queries/index.js';
import type { StateStore } from '../state/store.js';
import { parseGsi } from './parse.js';

export interface ServerDeps {
  authToken: string;
  store: StateStore;
  logger: Logger;
  now?: () => number;
  staleAfterMs?: number;
  /** Called with every authenticated raw payload, before schema validation. */
  onRawPayload?: (raw: unknown) => void;
}

const MAX_BODY_BYTES = 1_000_000;

function tokensMatch(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

function readBody(req: IncomingMessage): Promise<string | null> {
  return new Promise((resolve) => {
    let size = 0;
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => {
      size += c.length;
      if (size > MAX_BODY_BYTES) {
        resolve(null);
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', () => resolve(null));
  });
}

function send(res: ServerResponse, status: number, body = ''): void {
  res.writeHead(status, { 'content-type': 'text/plain; charset=utf-8' });
  res.end(body);
}

function extractToken(raw: unknown): string | undefined {
  if (typeof raw !== 'object' || raw === null) return undefined;
  const auth = (raw as { auth?: unknown }).auth;
  if (typeof auth !== 'object' || auth === null) return undefined;
  const token = (auth as { token?: unknown }).token;
  return typeof token === 'string' ? token : undefined;
}

export function createGsiServer(deps: ServerDeps): Server {
  const { authToken, store, logger } = deps;
  const now = deps.now ?? Date.now;
  const staleAfterMs = deps.staleAfterMs ?? 10_000;

  async function handlePost(
    req: IncomingMessage,
    res: ServerResponse,
  ): Promise<void> {
    const body = await readBody(req);
    if (body === null) return send(res, 413, 'body too large');

    let raw: unknown;
    try {
      raw = JSON.parse(body);
    } catch {
      logger.warn('rejected GSI post: invalid JSON');
      return send(res, 400, 'invalid json');
    }

    const token = extractToken(raw);
    if (token === undefined || !tokensMatch(token, authToken)) {
      logger.warn('rejected GSI post: bad auth token');
      return send(res, 401, 'unauthorized');
    }

    deps.onRawPayload?.(raw);

    const parsed = parseGsi(raw);
    if (!parsed.ok) {
      logger.warn(
        { error: parsed.error },
        'rejected GSI post: schema mismatch',
      );
      return send(res, 400, 'invalid payload');
    }

    store.update(parsed.payload, now());
    logger.debug('accepted GSI payload');
    send(res, 200);
  }

  return createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    const handle = async (): Promise<void> => {
      if (req.method === 'POST' && url.pathname === '/')
        return handlePost(req, res);
      if (req.method === 'GET' && url.pathname.startsWith('/query/')) {
        const name = url.pathname.slice('/query/'.length);
        if (!isQueryName(name)) return send(res, 404, `Unknown query: ${name}`);
        return send(
          res,
          200,
          answer(name, { snapshot: store.latest(), now: now(), staleAfterMs }),
        );
      }
      if (req.method === 'GET' && url.pathname === '/state') {
        const latest = store.latest();
        return send(
          res,
          200,
          JSON.stringify({
            hasData: latest !== null,
            snapshots: store.size(),
            ageMs: latest ? now() - latest.receivedAt : null,
          }),
        );
      }
      send(res, 404, 'not found');
    };
    handle().catch((err: unknown) => {
      logger.error({ err }, 'request handler failed');
      if (!res.headersSent) send(res, 500, 'internal error');
    });
  });
}

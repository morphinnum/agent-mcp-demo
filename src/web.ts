/**
 * HTTP backend for the React chat in web/ (spec: documents/specs/001-web-chat.md).
 * Plain node:http, no framework. Each chat turn streams ChatEvents as NDJSON (one JSON per line).
 *
 *   POST /api/chat          { text, engine: 'sdk' | 'graph' }  -> NDJSON stream of ChatEvents
 *   POST /api/approve/:id   { approved: boolean }              -> 204 (layer 3: human approval)
 *   POST /api/reset                                            -> 204
 *
 *   npm run web   (starts this on :8787 plus the Vite dev server on :5173)
 *
 * Optional: N8N_WEBHOOK_URL=http://localhost:5678/webhook/support-events also posts defence-layer
 * hits and refunds to an n8n workflow (spec: documents/specs/004-n8n-events.md).
 */
import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { createSdkEngine, type ChatEvent, type Engine } from './agent.ts';
import { createGraphEngine } from './graphAgent.ts';
import { useConfiguredLLM } from './llm.ts';

export type Engines = Record<'sdk' | 'graph', Engine>;
const MAX_BODY = 10_000;
const MAX_TEXT = 2_000;

async function readJson(req: http.IncomingMessage): Promise<Record<string, unknown>> {
  let body = '';
  for await (const chunk of req) {
    body += chunk;
    if (body.length > MAX_BODY) throw new Error('body too large');
  }
  const parsed = JSON.parse(body || '{}');
  if (typeof parsed !== 'object' || parsed === null) throw new Error('expected a JSON object');
  return parsed;
}

// ---- Spec 004: defence-layer hits and refunds go to an n8n webhook -------------------------
/** String values cut to 200 chars: the model writes `reason`/`query`, and the user can steer it. */
const capArgs = (args: unknown) =>
  args && typeof args === 'object'
    ? Object.fromEntries(Object.entries(args).map(([k, v]) => [k, typeof v === 'string' ? v.slice(0, 200) : v]))
    : null;

/**
 * The webhook payload for one ChatEvent, or null when n8n doesn't need it. `args` are the
 * arguments of the tool_call this result answers.
 */
export function n8nEvent(ev: ChatEvent, engine: string, userText: string, args: unknown = null) {
  const base = { engine, at: new Date().toISOString() };
  if (ev.type === 'blocked') {
    return { ...base, kind: 'defence', layer: 1, tool: null, args: null, detail: `${ev.reason}: ${userText}`.slice(0, 200) };
  }
  if (ev.type !== 'tool_result') return null;
  const refunded = ev.name === 'issue_refund' && !ev.layer && /^Refunded /.test(ev.output); // server.ts success text
  if (!ev.layer && !refunded) return null;
  return {
    ...base, kind: ev.layer ? 'defence' : 'refund', layer: ev.layer ?? null,
    tool: ev.name, args: capArgs(args), detail: ev.output.slice(0, 200),
  };
}

/**
 * Fire-and-forget: never awaited by the turn, 3 s timeout, errors only logged. n8n is not a security
 * check (layers 1-4 decide everything), so a lost notification is acceptable.
 */
const notify = (url: string, payload: object) =>
  fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(3000),
  }).catch((err: Error) => console.error('[web] n8n webhook failed:', err.message));

export function createWebServer(engines: Engines, n8nUrl = process.env.N8N_WEBHOOK_URL) {
  const pending = new Map<string, (approved: boolean) => void>(); // approvals waiting for the UI
  let busy = false; // ponytail: one turn at a time (single-user demo); per-session engines if ever multi-user

  return http.createServer(async (req, res) => {
    const reply = (status: number, text = '') => res.writeHead(status, { 'content-type': 'text/plain' }).end(text);
    try {
      if (req.method !== 'POST') return reply(405);

      if (req.url === '/api/reset') {
        Object.values(engines).forEach((e) => e.reset());
        return reply(204);
      }

      const approve = req.url?.match(/^\/api\/approve\/([\w-]+)$/);
      if (approve) {
        const resolve = pending.get(approve[1]);
        if (!resolve) return reply(404, 'no approval waiting with that id');
        const { approved } = await readJson(req);
        pending.delete(approve[1]);
        resolve(approved === true); // anything but an explicit true is a rejection
        return reply(204);
      }

      if (req.url !== '/api/chat') return reply(404);
      const { text, engine: name } = await readJson(req);
      if (typeof text !== 'string' || !text.trim() || text.length > MAX_TEXT) return reply(400, 'text: 1-2000 chars');
      if (name !== 'sdk' && name !== 'graph') return reply(400, "engine: 'sdk' or 'graph'");
      if (busy) return reply(409, 'another turn is still running');

      busy = true;
      res.writeHead(200, { 'content-type': 'application/x-ndjson', 'cache-control': 'no-cache' });
      const send = (ev: ChatEvent) => res.write(JSON.stringify(ev) + '\n');
      const mine = new Set<string>();
      // If the browser goes away mid-approval, reject: a refund nobody approved must not run.
      res.on('close', () => mine.forEach((id) => pending.get(id)?.(false)));

      const askHuman = (question: string) =>
        new Promise<boolean>((resolve) => {
          if (res.destroyed) return resolve(false); // browser already gone: nobody can approve
          const id = randomUUID();
          mine.add(id);
          pending.set(id, (approved) => {
            pending.delete(id);
            mine.delete(id);
            send({ type: 'approval_result', id, approved });
            resolve(approved);
          });
          send({ type: 'approval', id, question });
        });

      try {
        // Both engines emit all of a step's tool_calls before their results, in the same order,
        // so a queue per tool name pairs each result with its own call's args.
        const calls = new Map<string, unknown[]>();
        for await (const ev of engines[name].turn(text.trim(), askHuman)) {
          send(ev);
          if (!n8nUrl) continue;
          if (ev.type === 'tool_call') calls.set(ev.name, [...(calls.get(ev.name) ?? []), ev.args]);
          const args = ev.type === 'tool_result' ? calls.get(ev.name)?.shift() : null; // shift on every result
          const payload = n8nEvent(ev, name, text.trim(), args);
          if (payload) void notify(n8nUrl, payload);
        }
      } catch (err) {
        console.error('[web] turn failed:', err);
        send({ type: 'error', message: (err as Error).message });
      } finally {
        busy = false;
        res.end();
      }
    } catch (err) {
      if (!res.headersSent) reply(400, (err as Error).message);
    }
  });
}

// Run only when started directly (npm run web), not when a test imports it.
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await useConfiguredLLM();
  const engines: Engines = { sdk: await createSdkEngine(), graph: await createGraphEngine() };
  const port = Number(process.env.PORT ?? 8787);
  createWebServer(engines).listen(port, '127.0.0.1', () => console.error(`[web] API on http://localhost:${port}`));
  const stop = async () => {
    await Promise.all(Object.values(engines).map((e) => e.close()));
    process.exit(0);
  };
  process.on('SIGINT', stop).on('SIGTERM', stop);
}

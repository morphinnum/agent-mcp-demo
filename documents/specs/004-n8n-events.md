# Spec 004: n8n workflow for refund and security events

Status: **done** · Tickets: T-011, T-012, T-013

## Problem
A refund, or an attack stopped by a defence layer, is visible only in the chat window. Nobody
else (the customer, a manager, security) hears about it, and there is no record once the
server restarts. The exam also asks to show a workflow-automation tool: n8n.

## Solution
One-way: `src/web.ts` posts selected `ChatEvent`s to an n8n Webhook. n8n does the rest visually.

```
chat → web.ts ── POST JSON ──► n8n Webhook → Switch on kind
                                               ├─ refund  → Data Table row + Telegram message
                                               └─ defence → Data Table row + Telegram alert
```

### Which events
Hooked in `web.ts`, where both engines' events pass through, so the SDK and LangGraph engines get it
without engine-specific code.

| ChatEvent | Sent as |
| --- | --- |
| `blocked` (layer 1) | `kind: "defence", layer: 1` |
| `tool_result` with `layer` 2, 3 or 4 | `kind: "defence", layer` |
| `tool_result` of `issue_refund` with no layer (refund went through) | `kind: "refund"` |

### Payload
```json
{
  "kind": "refund" | "defence",
  "layer": 1 | 2 | 3 | 4 | null,
  "engine": "sdk" | "graph",
  "tool": "issue_refund" | null,
  "args": { "orderId": "A101", "amountEur": 20, "reason": "..." } | null,
  "detail": "screener reason + user text, or the tool output; at most 200 chars",
  "at": "2026-11-12T14:00:00.000Z"
}
```
`args` are the arguments of the matching `tool_call` in the same turn. For layer 1, `detail` is
the screener's reason plus the user's message cut to 200 chars. The system prompt and chat history
are never sent.

### Configuration
- `N8N_WEBHOOK_URL`: when unset, nothing is sent (tests and the plain demo are unchanged).
- The Telegram bot token lives only in n8n credentials, never in this repo.
- The workflow is exported to `n8n/support-events.json` so it can be imported and versioned.

### Failure behaviour
Fire-and-forget: the POST is not awaited by the chat turn, times out after 3 s, and an error is
logged with `console.error`. No retries. This is allowed because n8n is **not a security check**:
layers 1–4 still decide everything, and a lost notification moves no money.

## Acceptance criteria
1. With `N8N_WEBHOOK_URL` set, a blocked jailbreak posts one `kind: "defence", layer: 1` event
   whose `detail` is at most 200 chars.
2. A search that hits the planted injection posts `kind: "defence", layer: 2`.
3. A refund the human rejects posts `kind: "defence", layer: 3` with the refund's `args`.
4. An approved refund over the limit posts `kind: "defence", layer: 4`; an approved refund under
   the limit posts `kind: "refund"` with `args.orderId` and `args.amountEur`.
5. Ordinary tool results (`get_order`, a clean `search_kb`) and messages post nothing.
6. With `N8N_WEBHOOK_URL` unset, no request is made.
7. With n8n unreachable, the chat turn still completes with the same events as without n8n.
8. Criteria 1–7 hold for both engines and are covered in `tests/testWeb.ts` with a fake local
   HTTP server as n8n and scripted models (no LLM, no real n8n).
9. `n8n/support-events.json` imports into n8n and contains Webhook → Switch → Data Table + Telegram.
10. The README has a "Demo: n8n" section: start n8n, import, add the Telegram credential,
    activate, set `N8N_WEBHOOK_URL`, and the three prompts to try.

## Out of scope
- Approving refunds from Telegram (two-way; needs a secret on `/api/approve` and timeouts): a
  future spec.
- Retries or a queue for lost events.
- Showing n8n status in the chat UI (no new `ChatEvent` types).
- n8n as an agent engine or MCP client.

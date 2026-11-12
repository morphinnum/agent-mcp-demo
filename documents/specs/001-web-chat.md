# Spec 001: Web chat

Status: **accepted** · Tickets: T-002, T-003, T-004, T-006

## Problem
The demo runs in a terminal. The audience can't see *which* defence layer stopped an attack, and
refund approval is a `[y/N]` prompt.

## Solution
A browser chat (React 19 + Tailwind 4, built with Vite) backed by a small Node HTTP server
(`src/web.ts`, `node:http`, no framework).

### API
| Method | Path | Body | Response |
| --- | --- | --- | --- |
| POST | `/api/chat` | `{ text, engine: "sdk" \| "graph" }` | Streamed NDJSON, one `ChatEvent` per line |
| POST | `/api/approve/:id` | `{ approved: boolean }` | `204`, or `404` if no approval is waiting |
| POST | `/api/reset` | — | `204`; clears both engines' conversations |

`ChatEvent` (defined in `src/agent.ts`, shared by both engines):
```ts
| { type: 'blocked'; reason: string }                       // layer 1
| { type: 'tool_call'; name: string; args: unknown }
| { type: 'tool_result'; name: string; output: string; layer?: 2 | 3 | 4 }
| { type: 'approval'; id: string; question: string }        // layer 3, waits for the UI
| { type: 'approval_result'; id: string; approved: boolean }
| { type: 'message'; text: string }
| { type: 'error'; message: string }
```

### UI
- A chat column, plus a trace panel with tool calls and results (side by side on desktop,
  stacked on phones).
- A strip with the 4 defence layers. A layer lights up and counts each time it fires.
- An approval card for `issue_refund` with Approve / Reject buttons.
- An engine toggle: Agents SDK | LangGraph.
- Demo prompt chips for the three scenarios from the README.

## Acceptance criteria
1. A jailbreak message produces a `blocked` event and the layer 1 badge.
2. Searching for headphones produces a `tool_result` with `layer: 2` and no injected text.
3. A refund produces an `approval` event; the turn does not continue until `/api/approve/:id`.
4. A 300 EUR refund that the human approves still yields `tool_result` with `layer: 4`.
5. Both engines produce the same event types, so the UI has no engine-specific code.
6. Criteria 1–4 are covered by tests that need no LLM (`tests/testWeb.ts`, `tests/testGraph.ts`).

## Out of scope
Token streaming, multiple users, persisting chats.

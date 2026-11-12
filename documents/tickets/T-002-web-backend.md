# T-002: Web API with streamed events

| Status | Spec | Depends on |
| --- | --- | --- |
| **done** | [001](../specs/001-web-chat.md) | T-005 |

## Goal
`src/web.ts`: a `node:http` server that streams `ChatEvent`s as NDJSON and parks refund approvals until the UI answers.

## Acceptance criteria
- [x] `POST /api/chat` streams one `ChatEvent` per line (spec 001 API)
- [x] `POST /api/approve/:id` resolves a waiting approval; unknown id → 404
- [x] Input validated: body ≤ 10 kB, text 1–2000 chars, engine `sdk`/`graph` (trust boundary)
- [x] A client disconnecting mid-approval counts as a **rejection** (fails closed)
- [x] Only one turn at a time (409 otherwise)

## Notes
- 2026-11-10: Chose NDJSON over SSE: `EventSource` is GET-only, and fetch + line splitting is ~10 lines.
- 2026-11-10: `askHuman` is the shared hook for both engines, so `agent.ts` layer 3 stays unchanged.
- 2026-11-10: **security-reviewer** (agent crew): APPROVE, 6/6 invariants pass.
- 2026-11-10: Applied the review findings: `askHuman` rejects immediately if the browser already disconnected (before, a turn could hang and every later chat got 409); the API binds to 127.0.0.1 only.

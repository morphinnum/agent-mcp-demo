# T-014: Layer 4 label only for `issue_refund` results

| Status | Spec | Depends on |
| --- | --- | --- |
| review | [001](../specs/001-web-chat.md) | — |

## Goal
`layerOf` in `src/agent.ts` tags any tool output containing "need a human manager" as layer 4. The
`refund-policy` KB article contains that phrase, so a plain `search_kb` result lights the L4 badge in the
chat and shows "stopped by L4" in the red-team report. Only an `issue_refund` result can be a layer-4
refusal.

## Acceptance criteria
- [x] A `search_kb` result containing the refund-policy article has no `layer` (both engines)
- [x] An `issue_refund` refused by the server over the limit still has `layer: 4` (both engines)
- [x] Layers 2 and 3 are unchanged; both engines still emit the same `ChatEvent`s
- [ ] Offline tests, no LLM; security-reviewer approves (touches `src/`)

## Notes
- 2026-11-13: Found by the redteam run in T-010 (finding F-b): the role-play attack showed "stopped by L4" although `issue_refund` was never called.
- 2026-11-13: Started (/spec-test). Root cause: `layerOf(output)` in src/agent.ts is the one shared function (callers: src/agent.ts:182, src/graphAgent.ts:106); it never sees the tool name. Criteria → checks, `tests/testWeb.ts` section 7 (both engines):
  - KB result with the refund-policy text → 7a: `search_kb {query: 'manager'}` (matches only the refund-policy article) → `layers(ev)` is `[]`
  - over-limit refund still L4 → existing section 2 (sdk) and 6d (both engines) keep asserting `layer: 4`
  - L2/L3 unchanged, same events → existing sections 3, 4, 6b, 6c
  - offline + review → `npm test`; security-reviewer after green
- 2026-11-13: Red: section 7 failed with `actual: [ 4 ], expected: []` (the KB search was labelled layer 4).
- 2026-11-13: Green: `layerOf(output, tool)`: layer 4 only when `tool === 'issue_refund'`; both callers pass the tool name. `npm test`: all suites passed (server, loop, 4 defences, LangGraph, red-team harness, web API); `npm run typecheck` clean. Review box left open for security-reviewer.

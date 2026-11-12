# T-014: Layer 4 label only for `issue_refund` results

| Status | Spec | Depends on |
| --- | --- | --- |
| todo | [001](../specs/001-web-chat.md) | — |

## Goal
`layerOf` in `src/agent.ts` tags any tool output containing "need a human manager" as layer 4. The
`refund-policy` KB article contains that phrase, so a plain `search_kb` result lights the L4 badge in the
chat and shows "stopped by L4" in the red-team report. Only an `issue_refund` result can be a layer-4
refusal.

## Acceptance criteria
- [ ] A `search_kb` result containing the refund-policy article has no `layer` (both engines)
- [ ] An `issue_refund` refused by the server over the limit still has `layer: 4` (both engines)
- [ ] Layers 2 and 3 are unchanged; both engines still emit the same `ChatEvent`s
- [ ] Offline tests, no LLM; security-reviewer approves (touches `src/`)

## Notes
- 2026-11-13: Found by the redteam run in T-010 (finding F-b): the role-play attack showed "stopped by L4" although `issue_refund` was never called.

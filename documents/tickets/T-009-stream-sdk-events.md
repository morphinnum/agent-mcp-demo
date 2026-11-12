# T-009: Live tool events for the Agents SDK engine

| Status | Spec | Depends on |
| --- | --- | --- |
| **todo** | [001](../specs/001-web-chat.md) | T-002 |

## Goal
Today the SDK engine sends tool events after the turn ends (the LangGraph engine streams them per node). Use `run(..., { stream: true })` so the trace fills in live.

## Acceptance criteria
- [ ] Tool events arrive before the final message, in order
- [ ] testDefences.ts / testWeb.ts still pass (ScriptedModel needs `getStreamedResponse`)

## Notes
- 2026-11-10: Deferred: marked `ponytail:` in src/agent.ts. Not needed for the exam demo.

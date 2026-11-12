# T-005: LangGraph agent on the same MCP server

| Status | Spec | Depends on |
| --- | --- | --- |
| **done** | [002](../specs/002-langgraph-agent.md) | — |

## Goal
Rebuild the support agent as a LangGraph `StateGraph` with the same 4 layers.

## Acceptance criteria
- [x] Tools come from `src/server.ts` via `@langchain/mcp-adapters`; no local tool code (spec 002 #1)
- [x] `screen` node blocks attacks before the model runs; fails closed (spec 002 #2)
- [x] Tool output with injected instructions is withheld (spec 002 #3)
- [x] `approve` node uses `interrupt()`; no side effects (spec 002 #4)
- [x] Server rule still refuses > 100 EUR (spec 002 #5)
- [x] `MemorySaver` checkpointer keeps the conversation per thread

## Notes
- 2026-11-10: The adapter prefixes tool names (`support-desk_issue_refund`) by default; set `prefixToolNameWithServerName: false` so layer 3 matches `issue_refund` in both engines.
- 2026-11-10: The adapter turns MCP `isError` results into exceptions; the `tools` node turns them back into a ToolMessage so the model sees the server's reason.
- 2026-11-10: tests/testGraph.ts: 5/5 sections pass.
- 2026-11-10: **security-reviewer** (agent crew): APPROVE, 6/6 invariants pass.
- 2026-11-10: Applied the review nit: the `approve` node treats only an explicit `true` as approval (`!== true`).

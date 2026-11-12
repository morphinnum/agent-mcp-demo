# T-006: Engine toggle: Agents SDK | LangGraph

| Status | Spec | Depends on |
| --- | --- | --- |
| **done** | [001](../specs/001-web-chat.md) | T-003, T-005 |

## Goal
Switch frameworks in the UI to show that one MCP server serves both.

## Acceptance criteria
- [x] Toggle in the header; switching resets both conversations
- [x] Both engines emit identical `ChatEvent` types; no engine-specific UI code (spec 001 #5)

## Notes
- 2026-11-10: `ChatEvent` lives in src/agent.ts and is imported by the UI, so a contract break fails typecheck.

# T-003: React + Tailwind chat UI

| Status | Spec | Depends on |
| --- | --- | --- |
| **done** | [001](../specs/001-web-chat.md) | T-002 |

## Goal
A single-screen chat that makes each defence layer visible.

## Acceptance criteria
- [x] Chat column + MCP tool trace panel; stacked on phones
- [x] Defence-layer strip: each layer counts and highlights when it fires (spec 001 #1, #2, #4)
- [x] Demo prompt chips for the README scenarios
- [x] Dark mode via `dark:` variants; labelled inputs, `aria-live` chat log

## Notes
- 2026-11-10: Fixed a React crash: a `useEffect` arrow returned a value (found in the browser console during the live check).
- 2026-11-10: Unwrapped MCP `{type:'text'}` blocks in SDK tool output so the trace shows plain text.
- 2026-11-10: Checked live in a browser with qwen2.5:7b (see T-007).

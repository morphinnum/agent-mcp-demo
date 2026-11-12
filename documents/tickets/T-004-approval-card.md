# T-004: Refund approval card (layer 3 in the UI)

| Status | Spec | Depends on |
| --- | --- | --- |
| **done** | [001](../specs/001-web-chat.md) | T-002, T-003 |

## Goal
Replace the terminal `[y/N]` prompt with Approve / Reject in the chat.

## Acceptance criteria
- [x] An `approval` event renders a card with the exact `issue_refund` arguments (spec 001 #3)
- [x] The turn waits until the human clicks; the card then shows the decision
- [x] Rejection reaches the model as "A human rejected this refund."

## Notes
- 2026-11-10: Covered over HTTP by tests/testWeb.ts §2 (approve) and §4 (reject).

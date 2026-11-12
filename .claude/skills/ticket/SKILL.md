---
name: ticket
description: Create tickets from a spec, or move a ticket between todo / in-progress / review / done, keeping documents/tickets/BOARD.md in sync. Use when the user says "ticket", "split this spec", "start T-xxx", "close T-xxx", or asks what's next.
---

# Ticket

Tickets live in `documents/tickets/T-NNN-<slug>.md`. `BOARD.md` is the one-page summary. They
must always agree.

## Create tickets from a spec
1. Read the spec. Split it into tickets of **half a day or less**, each with a visible result.
2. Use the next free number. Use this template:

```markdown
# T-NNN: <title>

| Status | Spec | Depends on |
| --- | --- | --- |
| todo | [NNN](../specs/NNN-slug.md) | T-xxx or — |

## Goal
One or two sentences.

## Acceptance criteria
- [ ] Testable statement (name the spec criterion it comes from)

## Notes
Dated log lines: `YYYY-MM-DD: what happened`.
```
3. Add a row to BOARD.md for each ticket.

## Move a ticket
- `todo → in-progress`: add a dated note.
- `in-progress → review`: every box is ticked and `npm test` passes. Paste the test summary line
  into Notes.
- `review → done`: `security-reviewer` approved (for tickets that touch `src/`).
- Update the Status cell in the ticket **and** in BOARD.md, and the counts at the top of BOARD.md.

## "What's next?"
Read BOARD.md and answer with the first `todo` ticket whose dependencies are `done`.

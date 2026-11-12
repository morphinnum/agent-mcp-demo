---
name: agent-crew
description: Run one ticket end to end with the project's subagent crew (test-writer → implementer → security-reviewer → redteam) and update the board. Use when the user says "agent crew", "run the crew on T-xxx", or wants a ticket delivered hands-off.
---

# Agent crew

A small crew of specialised subagents from `.claude/agents/`. You are the lead: you hand out
work, check what comes back, and own the ticket status. You don't do a crew member's job yourself.

```
lead ─► test-writer ─► implementer (you, or frontend for web/) ─► security-reviewer ─► redteam
  ▲                                                                  │ CHANGES REQUIRED
  └──────────────────────────── fix and loop back ◄──────────────────┘
```

## Steps
1. Read the ticket, its spec and `CLAUDE.md`. Use the `ticket` skill to move it to `in-progress`.
2. **test-writer**: "Write failing offline tests for the acceptance criteria of T-xxx." Check
   that the tests fail for the right reason.
3. **Implement**: tickets that only touch `web/` go to the **frontend** subagent; everything
   else you implement yourself, following the `spec-test` skill's green step.
4. **security-reviewer**: "Review the changes for T-xxx." On **CHANGES REQUIRED**, fix and
   review again (at most 2 loops, then stop and ask the user).
5. **redteam**: only for tickets that touch `src/`. Note any finding in the ticket. A finding
   that bypasses a layer blocks `done`.
6. Run `npm test` and `npm run typecheck` yourself. Never trust a subagent's "tests pass"
   without seeing the output.
7. Move the ticket to `done` and write a dated note listing what each crew member did.

## Rules
- Independent tickets can run in parallel; tickets that depend on each other can't.
- Each subagent gets a self-contained prompt: ticket id, file paths, and the exact deliverable.

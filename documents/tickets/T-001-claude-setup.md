# T-001: Claude Code project setup

| Status | Spec | Depends on |
| --- | --- | --- |
| **done** | [003](../specs/003-claude-workflow.md) | — |

## Goal
Give Claude Code the project context and a repeatable workflow: CLAUDE.md, subagents, skills, documents/.

## Acceptance criteria
- [x] `CLAUDE.md` lists commands, architecture and hard rules (spec 003 #3)
- [x] `web/CLAUDE.md` covers frontend conventions
- [x] 4 subagents in `.claude/agents/` with narrow tool lists (spec 003 #2)
- [x] 4 skills in `.claude/skills/`: grill-me, ticket, spec-test, agent-crew (spec 003 #1)
- [x] `documents/` holds GOAL, specs and tickets, and BOARD.md matches them (spec 003 #4)

## Notes
- 2026-11-10: GOAL.md and specs 001–003 written from the module-1 feedback.
- 2026-11-10: CLAUDE.md, web/CLAUDE.md, agents and skills added.
- 2026-11-10: `.claude/settings.json` (permission allow/deny list) was blocked by Claude Code's auto-mode safety check, which doesn't let the agent edit its own permissions; to be added by hand (contents in README).

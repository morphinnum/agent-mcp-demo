# Spec 003: AI-assisted workflow (Claude Code)

Status: **accepted** · Tickets: T-001, T-008

## Problem
The first version was built ad hoc. For the exam, the process has to be visible and repeatable.

## Approach: spec-driven development
```
idea ──/grill-me──► documents/specs/NNN-*.md ──/ticket──► documents/tickets/T-*.md
     ──/spec-test──► failing tests ──► code ──► security-reviewer ──► redteam ──► ticket done
                └───────────────── /agent-crew runs the whole chain ──────────────────┘
```

| Piece | Location | Role |
| --- | --- | --- |
| Project memory | `CLAUDE.md`, `web/CLAUDE.md` | Commands, architecture, hard rules |
| Permissions | `.claude/settings.json` | Allow test/typecheck, deny reading `.env` |
| Skill `grill-me` | `.claude/skills/grill-me` | Interview before building → spec |
| Skill `ticket` | `.claude/skills/ticket` | Spec → tickets, status moves, BOARD.md |
| Skill `spec-test` | `.claude/skills/spec-test` | Acceptance criteria → failing tests → code |
| Skill `agent-crew` | `.claude/skills/agent-crew` | Orchestrates the subagents for one ticket |
| Subagents | `.claude/agents/*.md` | `test-writer`, `security-reviewer`, `redteam`, `frontend` |

## Acceptance criteria
1. Each skill has a `SKILL.md` with a `description` that says when to use it.
2. Each subagent has a narrow tool list (reviewers are read-only).
3. CLAUDE.md lists the hard rules: no `console.log` in the stdio server, layers 3 and 4 stay
   in code, tests need no LLM, security checks fail closed.
4. Every ticket links to a spec, and BOARD.md matches the ticket files.

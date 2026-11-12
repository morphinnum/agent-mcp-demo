---
name: spec-test
description: Spec-driven TDD for one ticket. Turn the ticket's acceptance criteria into failing offline tests, implement until they pass, then tick the criteria. Use when the user says "spec-test T-xxx", "implement T-xxx", or asks to build something that already has a spec.
---

# Spec → test → code

Input: a ticket id (for example `T-005`). If there's no ticket, run `/ticket` first; if there's
no spec, run `/grill-me` first.

## Steps
1. **Read** the ticket, the spec it links to, and `CLAUDE.md`. Move the ticket to `in-progress`
   (see the `ticket` skill).
2. **Map the criteria to checks.** Write the mapping into the ticket's Notes as a list:
   criterion → test file + section. A criterion that can't be tested offline is a spec bug:
   say so.
3. **Red.** Write the tests (or ask the `test-writer` subagent to). Run them and confirm they
   fail **for the expected reason**, not because of an import error.
4. **Green.** Write the smallest code that passes. Follow the hard rules in `CLAUDE.md`.
5. **Verify.** Run `npm test` and `npm run typecheck`. Both must pass. Paste the summary lines
   into the ticket.
6. **Tick** each criterion box and move the ticket to `review`.

## Rules
- Never edit a test so that it passes. If a test is wrong, fix the spec first, then the test.
- Tests use scripted models, never a real LLM (`tests/testDefences.ts` and `tests/testGraph.ts`
  show the pattern).

# T-010: Red-team suite against the LangGraph engine

| Status | Spec | Depends on |
| --- | --- | --- |
| in-progress | [002](../specs/002-langgraph-agent.md) | T-005 |

## Goal
`npm run redteam` only attacks the Agents SDK agent. Run the same attacks through `createGraphEngine()` and compare the block rates.

## Acceptance criteria
- [ ] The attack harness runs any `Engine` (`createSdkEngine` / `createGraphEngine`) and reports, per attack, the tools used, which layers fired (1–4), whether a refund was asked for, and the reply (offline: `tests/testRedteam.ts`, scripted models, both engines)
- [ ] Every refund the harness is asked about is rejected, so a red-team run never moves money (offline, same test)
- [ ] `npm run redteam -- --engine graph` (and `sdk`, `both`) prints the same table for each engine (live, real model)
- [ ] Run via the `redteam` subagent; findings logged here

## Notes
- 2026-11-10: Found while closing T-005: `tests/redteam.ts` only attacks the Agents SDK agent.
- 2026-11-13: Started (/agent-crew). Criteria split into offline-testable (the harness) and live (the printed run), because tests need no LLM.

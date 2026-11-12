# T-010: Red-team suite against the LangGraph engine

| Status | Spec | Depends on |
| --- | --- | --- |
| **todo** | [002](../specs/002-langgraph-agent.md) | T-005 |

## Goal
`npm run redteam` only attacks the Agents SDK agent. Run the same attacks through `createGraphEngine()` and compare the block rates.

## Acceptance criteria
- [ ] `npm run redteam -- --engine graph` prints the same table for LangGraph
- [ ] Run via the `redteam` subagent; findings logged here

## Notes
- 2026-11-10: Found while closing T-005: `tests/redteam.ts` only attacks the Agents SDK agent.

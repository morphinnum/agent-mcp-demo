# T-007: Offline tests for LangGraph and web API

| Status | Spec | Depends on |
| --- | --- | --- |
| **done** | [001](../specs/001-web-chat.md), [002](../specs/002-langgraph-agent.md) | T-002, T-005 |

## Goal
Prove spec 001 #1–4 and spec 002 #2–5 without an LLM.

## Acceptance criteria
- [x] `tests/testGraph.ts`: jailbreak, injection, reject, approve-300 → server refusal, memory
- [x] `tests/testWeb.ts`: both engines over real HTTP, approval round-trip, bad input → 400/404
- [x] Both added to `npm test`
- [x] Live check in a browser with the real local model

## Notes
- 2026-11-10: `npm test`: 5 suites pass (server, loop, defences, graph, web).
- 2026-11-10: Live run (qwen2.5:7b): SDK engine → refund approved (L3) + jailbreak blocked (L1); LangGraph → injection withheld (L2), 300 EUR approved by the human, then refused by the server (L4).
- 2026-11-10: Live run found that qwen 7b *invented* reviews after the withheld result. That's a model-quality issue the layers don't claim to fix; noted in the README.
- 2026-11-10: Environment: Ollama's GPU runner crashed on this machine (`CUDA error: device kernel image is invalid`). Workaround: a CPU-only tag `qwen2.5:7b-cpu` (`PARAMETER num_gpu 0`), run with `LLM_MODEL=qwen2.5:7b-cpu`.
- 2026-11-10: Added the gap the security-reviewer found: testGraph §1b proves the screener fails closed when it throws. `npm test`: all 5 suites pass.

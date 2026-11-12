# agent-mcp-demo

Exam demo: a customer-support agent on an MCP server, with 4 jailbreak-defence layers, built in
two frameworks (OpenAI Agents SDK, LangGraph) and a React + Tailwind chat. TypeScript, Node 20.6+.
The default LLM is free and local (Ollama, `qwen2.5:7b`), configured in `src/llm.ts`.

## Commands
```bash
npm test            # all offline tests, no LLM needed: run after every change
npm run typecheck   # tsc --noEmit over src, tests, web
npm run web         # API on :8787 + Vite UI on :5173 (needs Ollama)
npm run chat        # terminal chat, Agents SDK
npm run graph       # one turn through the LangGraph agent
npm run loop        # hand-written agent loop
npm run redteam     # attack prompts against the real model
npx n8n             # local n8n on :5678 for the events workflow (README "Demo: n8n")
```
Env: `LLM_MODEL` (e.g. `qwen2.5:7b-cpu` when Ollama's GPU mode crashes),
`N8N_WEBHOOK_URL=http://localhost:5678/webhook/support-events` (optional; unset = no events sent).

## Architecture
| File | Role |
| --- | --- |
| `src/server.ts` | MCP server (stdio): `search_kb`, `get_order`, `issue_refund`. Layer 4 lives here |
| `src/agent.ts` | Agents SDK agent, layers 1–3, the shared `ChatEvent` type, `layerOf`, the SDK `Engine` |
| `src/graphAgent.ts` | LangGraph `StateGraph` with the same layers; tools via `@langchain/mcp-adapters` |
| `src/web.ts` | `node:http` API; streams `ChatEvent`s as NDJSON; parks approvals until the UI answers |
| `src/llm.ts` | Provider config (Ollama / OpenAI / any OpenAI-compatible endpoint) |
| `n8n/support-events.json` | n8n workflow fed by `web.ts`: one-way notifications only, never a security decision |
| `web/` | React 19 + Tailwind 4 UI (see `web/CLAUDE.md`) |
| `tests/` | One file per concern; scripted fake models, real MCP server |

## Hard rules
- **Never `console.log` in `src/server.ts`**: stdout carries JSON-RPC. Use `console.error`.
- **Layers 3 and 4 stay in code.** Never move a security check into a prompt, and never
  weaken `MAX_AUTO_REFUND_EUR`, the approval guardrail or the `approve` node.
- **Security checks fail closed**: if the screener errors, block.
- **Tests need no LLM.** Use scripted models (see `tests/testDefences.ts`, `tests/testGraph.ts`).
- Both engines must emit the same `ChatEvent`s; the UI has no engine-specific code.
- The `approve` node in the graph has no side effects (LangGraph re-runs interrupted nodes).
- No new dependency when a few lines do the job.

## How work is done here (spec-driven)
Work is tracked in `documents/`: `GOAL.md` → `specs/NNN-*.md` → `tickets/T-*.md`, with a summary
in `tickets/BOARD.md`.
1. New idea → `/grill-me` → a spec in `documents/specs/`.
2. `/ticket` splits the spec into tickets and keeps BOARD.md in sync.
3. `/spec-test T-xxx` → failing tests from the acceptance criteria → code → green.
4. `/agent-crew T-xxx` runs the whole chain with the subagents in `.claude/agents/`.

When you finish or start a ticket, update its status in the ticket file **and** in BOARD.md.
Do not commit or push unless asked.

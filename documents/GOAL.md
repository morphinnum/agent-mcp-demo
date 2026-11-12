# Goal

## Why this project exists
An exam demo for the AI-agents module. It has to show, with running code, that:

1. An agent can use tools through **MCP** (Model Context Protocol), and the same MCP server
   works with any client and any framework.
2. Agent security is **defence in depth**: prompts are not a security boundary, so the risky
   checks are enforced in code.
3. The project was built with a **repeatable AI-assisted workflow**: spec → ticket → test → code →
   review, done in Claude Code with project skills and subagents.

## Previous version (module 1)
A terminal-only demo: MCP server, OpenAI Agents SDK agent, a hand-written agent loop, offline
tests. Feedback: make it a real chat app (React + Tailwind), show other agent tooling (LangGraph),
add CLAUDE.md, instructions and project skills, and track the work in documents.

## Scope (this iteration)
| Area | Deliverable | Spec |
| --- | --- | --- |
| Web chat | React + Tailwind UI where each defence layer is visible | [001](specs/001-web-chat.md) |
| LangGraph | The same agent as a LangGraph state graph, same MCP server, same 4 layers | [002](specs/002-langgraph-agent.md) |
| Workflow | CLAUDE.md, `.claude/agents`, `.claude/skills`, `documents/` | [003](specs/003-claude-workflow.md) |
| Automation | n8n workflow: refund and defence-layer events → Telegram + Data Table log | [004](specs/004-n8n-events.md) |
| Layer 5 | Output guardrail in code: replies that quote the system prompt are withheld | [005](specs/005-output-guardrail.md) |

## Non-goals
- Production auth, multi-user sessions, persistence across restarts.
- A paid LLM. The default stays a free local model (Ollama, `qwen2.5:7b`).
- CrewAI or other Python frameworks. The "agent crew" is the Claude Code subagent crew.

## Success criteria
- `npm test` passes with **no LLM**, including the LangGraph and web API tests.
- `npm run web` lets you switch between "Agents SDK" and "LangGraph" while chatting, and each
  defence layer shows a visible badge when it fires.
- Every deliverable can be traced to a ticket in [tickets/BOARD.md](tickets/BOARD.md) and a spec.

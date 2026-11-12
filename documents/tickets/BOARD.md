# Board

**done 13** · in-progress 0 · review 0 · **todo 2**. Goal: [../GOAL.md](../GOAL.md)

| Ticket | Title | Spec | Status |
| --- | --- | --- | --- |
| [T-001](T-001-claude-setup.md) | Claude Code project setup | 003 | done |
| [T-002](T-002-web-backend.md) | Web API with streamed events | 001 | done |
| [T-003](T-003-chat-ui.md) | React + Tailwind chat UI | 001 | done |
| [T-004](T-004-approval-card.md) | Refund approval card (layer 3 in the UI) | 001 | done |
| [T-005](T-005-langgraph-agent.md) | LangGraph agent on the same MCP server | 002 | done |
| [T-006](T-006-engine-toggle.md) | Engine toggle: Agents SDK | LangGraph | 001 | done |
| [T-007](T-007-tests-web-graph.md) | Offline tests for LangGraph and web API | 001, 002 | done |
| [T-008](T-008-readme-demo.md) | README and demo script | 003 | done |
| [T-009](T-009-stream-sdk-events.md) | Live tool events for the Agents SDK engine | 001 | done |
| [T-010](T-010-redteam-langgraph.md) | Red-team suite against the LangGraph engine | 002 | done |
| [T-011](T-011-n8n-webhook-events.md) | Send refund and defence events to an n8n webhook | 004 | done |
| [T-012](T-012-n8n-workflow.md) | n8n workflow: Webhook → Switch → Data Table + Telegram | 004 | done |
| [T-013](T-013-readme-n8n-demo.md) | README "Demo: n8n" section | 004 | done |
| [T-014](T-014-layer4-label.md) | Layer 4 label only for `issue_refund` results | 001 | done |
| [T-015](T-015-prompt-leak.md) | Defence against system prompt leaks | — | todo |

Statuses: `todo → in-progress → review → done`. Moved with the `/ticket` skill (`.claude/skills/ticket`).
Next up: **T-015** (prompt leak; needs `/grill-me` → spec 005 first). T-009 is optional.

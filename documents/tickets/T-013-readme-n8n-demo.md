# T-013: README "Demo: n8n" section

| Status | Spec | Depends on |
| --- | --- | --- |
| done | [004](../specs/004-n8n-events.md) | T-011, T-012 |

## Goal
Anyone can reproduce the n8n demo from the README alone.

## Acceptance criteria
- [x] Steps: start n8n, import the workflow, add the Telegram credential, activate, set `N8N_WEBHOOK_URL` (spec 10)
- [x] The three prompts to try and what should appear in Telegram for each (spec 10)
- [x] `N8N_WEBHOOK_URL` listed in CLAUDE.md commands/config

## Notes
- 2026-11-13: Added README "Demo: n8n": setup (bot, npx n8n, data table, import, credential, publish), a curl self-check, run commands for Git Bash and PowerShell, a table of 5 prompts → Telegram message, a note on the escaping, and troubleshooting (port clash, nothing arrives, model only asks). Also a Files row and demo-order step 9. CLAUDE.md: the `npx n8n` command, the `LLM_MODEL`/`N8N_WEBHOOK_URL` env vars and an architecture row. Docs only. Done.

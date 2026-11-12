# T-012: n8n workflow: Webhook → Switch → Data Table + Telegram

| Status | Spec | Depends on |
| --- | --- | --- |
| done | [004](../specs/004-n8n-events.md) | T-011 |

## Goal
Build the workflow in the local n8n (`npx n8n`, :5678) and export it to `n8n/support-events.json`.

## Acceptance criteria
- [x] `n8n/support-events.json` imports into n8n and contains Webhook → Switch on `kind` → Data Table + Telegram (spec 9)
- [x] The Telegram nodes use HTML parse mode with every user/model-influenced value escaped (&, <, >), and the export holds no bot token (spec: Configuration)
- [x] A refund and a blocked jailbreak from the live chat each arrive in Telegram and as a Data Table row

## Notes
- 2026-11-12: Started. Telegram bot ReturnsRequestsBot created by the user; chat id noted (kept out of the repo).
- 2026-11-12: Wrote `n8n/support-events.json` from the node definitions in the installed n8n (n8n-nodes-base 2.35.5): Webhook (POST /webhook/support-events) → Data Table insert (`support_events`) and → Switch on `kind` → two Telegram nodes.
- 2026-11-12: Spec deviation, "plain text": the n8n Telegram node always sets a parse mode (none given → Markdown, `Telegram/GenericFunctions.js:31`). Using HTML mode and escaping `& < >` in every model/user-influenced value instead; that is a complete escape for Telegram HTML. n8n attribution footer turned off.
- 2026-11-12: User imported and published the workflow. A test POST (curl) to /webhook/support-events arrived in Telegram as "Refund issued (sdk) / Order A101: 20 EUR / Reason: test from Claude <b>&</b>": the tags show as literal text, so the HTML escaping works. Still to check: the Data Table row, and live events from the chat.
- 2026-11-12: The Data Table `support_events` got the test row (refund, sdk, issue_refund, A101, 20, detail). Import and all workflow branches work. Left: live events from the chat.
- 2026-11-12: Live check from the chat (SDK engine, qwen2.5:7b-cpu, N8N_WEBHOOK_URL set): a jailbreak gave "Defence layer 1" in Telegram, and the approved 80 EUR refund on A101 gave "Refund issued". All boxes ticked. No src/ change, so no security review needed. Done.

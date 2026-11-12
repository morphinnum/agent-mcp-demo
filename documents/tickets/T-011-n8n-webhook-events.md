# T-011: Send refund and defence events to an n8n webhook

| Status | Spec | Depends on |
| --- | --- | --- |
| done | [004](../specs/004-n8n-events.md) | — |

## Goal
`src/web.ts` posts each defence-layer hit and each refund outcome to `N8N_WEBHOOK_URL`,
fire-and-forget, for both engines.

## Acceptance criteria
- [x] Blocked jailbreak → one `kind: "defence", layer: 1` event, `detail` ≤ 200 chars (spec 1)
- [x] Planted injection in `search_kb` → `kind: "defence", layer: 2` (spec 2)
- [x] Human-rejected refund → `kind: "defence", layer: 3` with the refund's `args` (spec 3)
- [x] Approved refund over the limit → `layer: 4`; under the limit → `kind: "refund"` with `args.orderId`, `args.amountEur` (spec 4)
- [x] `get_order`, clean `search_kb` and messages post nothing (spec 5)
- [x] `N8N_WEBHOOK_URL` unset → no request (spec 6)
- [x] n8n unreachable → the turn completes with the same events, error logged to stderr, 3 s timeout (spec 7)
- [x] All of the above for both engines in `tests/testWeb.ts` with a fake local HTTP server, no LLM (spec 8)

## Notes
- 2026-11-12: Started (/spec-test). Criteria → checks, all in `tests/testWeb.ts` section 6 "n8n webhook":
  - layer 1 → 6a, per engine: 300-char attack → one `defence/1`, `detail.length ≤ 200`
  - layer 2 → 6b, per engine: `search_kb` headphones → `defence/2`, `tool: search_kb`
  - layer 3 → 6c, per engine: rejected A101 20 EUR → `defence/3`, `args.orderId: A101`
  - layer 4 / refund → 6d, 6e, per engine: approved A102 300 → `defence/4`; approved A101 20 → `refund` with args
  - nothing else → 6f, per engine: `get_order` + plain answer → 0 posts
  - unset → 6g: the server without a URL handles a blocked turn → fake n8n got 0
  - unreachable → 6h: URL to a closed port → same event list as 6a; hanging n8n → turn ends in < 2 s
  - both engines → 6a–6f loop over `sdk` and `graph`
- 2026-11-12: Red: section 6a failed with "0 !== 1" (no post reached the fake n8n), as expected.
- 2026-11-12: Green: `n8nEvent()` + fire-and-forget `notify()` in `src/web.ts`; `createWebServer(engines, n8nUrl = process.env.N8N_WEBHOOK_URL)`.
  A refund counts as `kind: "refund"` only if the server's output starts with `Refunded ` (other failures post nothing).
  The 3 s `AbortSignal.timeout` is not timed in the test; 6h proves a hanging n8n does not delay the turn.
- 2026-11-12: `npm test`: "All server checks passed. / Loop check passed / All 4 defence checks passed. / All LangGraph checks passed. / All web API checks passed." · `npm run typecheck`: clean. Moved to review; needs security-reviewer.
- 2026-11-12: security-reviewer: CHANGES REQUESTED. 1 medium: parallel `issue_refund` calls got the last call's args (both engines emit all calls before results). 3 low: `args` uncapped; 6g depended on the shell's `N8N_WEBHOOK_URL`; 6h only on the SDK engine.
- 2026-11-12: Fixed all 4, test first: new 6i (two refunds in one step) failed with `'A102' !== 'A101'`, then passed after adding a per-tool FIFO queue for args and capping string args at 200 chars. 6g deletes the env var; 6h loops over both engines. `npm test` all passed, typecheck clean. Back to security-reviewer.
- 2026-11-12: security-reviewer re-review: APPROVE (all 4 findings fixed, npm test + typecheck green). Done. Carry-over to T-012: Telegram node must send plain text.

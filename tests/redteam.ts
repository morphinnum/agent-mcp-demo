/**
 * Live red-team eval: fire known attack prompts at the real agent (real model) and report
 * which defence layer stopped each one. Refunds are auto-REJECTED, so nothing is ever refunded.
 * Run it after every prompt or model change, like a regression test.
 *
 *   npm run redteam                    (Agents SDK; free local model by default: see src/llm.ts)
 *   npm run redteam -- --engine graph  (LangGraph)
 *   npm run redteam -- --engine both   (both, one after the other, same attacks)
 *
 * The harness (tests/redteamHarness.ts) is engine-agnostic and covered offline by tests/testRedteam.ts.
 */
import { createSdkEngine } from '../src/agent.ts';
import { createGraphEngine } from '../src/graphAgent.ts';
import { useConfiguredLLM } from '../src/llm.ts';
import { ATTACKS, LEGITIMATE, attack, outcome } from './redteamHarness.ts';

// --engine graph  or  --engine=graph
const i = process.argv.findIndex((a) => a === '--engine' || a.startsWith('--engine='));
const which = i < 0 ? 'sdk' : process.argv[i].includes('=') ? process.argv[i].slice(9) : process.argv[i + 1];
if (!['sdk', 'graph', 'both'].includes(which)) throw new Error(`--engine sdk | graph | both, got "${which}"`);
const names = which === 'both' ? (['sdk', 'graph'] as const) : ([which] as ['sdk' | 'graph']);

await useConfiguredLLM();

for (const name of names) {
  const engine = name === 'sdk' ? await createSdkEngine() : await createGraphEngine();
  try {
    console.log(`\n===== ${name === 'sdk' ? 'OpenAI Agents SDK' : 'LangGraph'} =====`);
    const rows = await attack(engine, ATTACKS);
    for (const r of rows) {
      console.log(`\n> ${r.attack}\n  tools: ${JSON.stringify(r.tools)}\n  outcome: ${outcome(r)}`);
      if (r.refundAsked) console.log(`  refund asked ${r.refundAsked}x -> rejected by the harness`);
      console.log(`  reply: ${r.reply.slice(0, 160)}`);
    }
    const attacks = rows.filter((r) => r.attack !== LEGITIMATE);
    console.log(`\n[${name}] ${attacks.filter((r) => r.layers.length).length}/${attacks.length} attacks hit a defence layer` +
      ' (the legitimate request is not counted; "no layer fired" rows need a look at the reply)');
    if (rows.some((r) => r.refunded)) {
      console.log(`[${name}] FINDING: a refund went through without human approval`);
      process.exitCode = 1;
    }
  } finally {
    await engine.close();
  }
}

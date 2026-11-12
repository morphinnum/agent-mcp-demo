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
import { ATTACKS, attack, type Row } from './redteamHarness.ts';

const arg = process.argv[process.argv.indexOf('--engine') + 1];
const which = process.argv.includes('--engine') ? arg : 'sdk';
if (!['sdk', 'graph', 'both'].includes(which)) throw new Error(`--engine sdk | graph | both, got "${which}"`);
const names = which === 'both' ? (['sdk', 'graph'] as const) : ([which] as ['sdk' | 'graph']);

const LAYER = { 1: 'L1 input guardrail', 2: 'L2 tool-output guardrail', 3: 'L3 human gate', 4: 'L4 server rule' };
const outcome = (r: Row) =>
  r.layers.length ? `stopped by ${r.layers.map((l) => LAYER[l]).join(' + ')}` : 'model refused or answered normally';

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
    console.log(`\n[${name}] ${rows.filter((r) => r.layers.length).length}/${rows.length} attacks hit a defence layer`);
  } finally {
    await engine.close();
  }
}

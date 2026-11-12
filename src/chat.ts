/**
 * Chat with the support agent in the terminal. You also play the human who approves refunds.
 *
 *   npm run chat     (free local model by default: see src/llm.ts)
 */
import * as readline from 'node:readline/promises';
import { InputGuardrailTripwireTriggered, run, user, type AgentInputItem } from '@openai/agents';
import { createSupportAgent, createSupportDesk } from './agent.ts';
import { useConfiguredLLM } from './llm.ts';

await useConfiguredLLM();

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const askHuman = async (question: string) =>
  (await rl.question(`  ${question} [y/N] `)).trim().toLowerCase() === 'y';

const supportDesk = createSupportDesk(askHuman);
await supportDesk.connect(); // starts server.ts and runs the MCP handshake
const agent = createSupportAgent(supportDesk);

console.log("Support agent ready. Try: 'Order A101 arrived broken, can I get a refund?'  (exit to quit)");
let history: AgentInputItem[] = [];

try {
  while (true) {
    const text = (await rl.question('\nyou> ')).trim();
    if (!text || ['exit', 'quit'].includes(text.toLowerCase())) break;
    try {
      const result = await run(agent, [...history, user(text)], { maxTurns: 10 });
      console.log(`agent> ${result.finalOutput}`);
      history = result.history; // keep the conversation going
    } catch (err) {
      if (!(err instanceof InputGuardrailTripwireTriggered)) throw err;
      const reason = err.result.output.outputInfo?.reason;
      console.log(`agent> Sorry, I can't help with that.   [blocked by guardrail: ${reason}]`);
    }
  }
} finally {
  rl.close();
  await supportDesk.close(); // stops the server process
}

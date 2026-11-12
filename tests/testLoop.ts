/**
 * Offline check of the hand-written loop in src/agentLoop.ts: no LLM and no API key needed.
 * A scripted fake LLM plays the model; the MCP server is the real one.
 *
 *   npx tsx tests/testLoop.ts
 */
import assert from 'node:assert/strict';
import type OpenAI from 'openai';
import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';
import { runAgent } from '../src/agentLoop.ts';
import { SERVER_COMMAND } from '../src/agent.ts';

const callTool = (name: string, args: object) => ({
  choices: [{ message: { role: 'assistant', content: null, tool_calls: [
    { id: `call_${name}`, type: 'function', function: { name, arguments: JSON.stringify(args) } },
  ] } }],
});
const answer = (content: string) => ({ choices: [{ message: { role: 'assistant', content } }] });

// What the "model" does on each turn, and what it expects to have seen.
let turn = 0;
const fakeLlm = {
  chat: {
    completions: {
      create: async ({ messages }: { messages: any[] }) => {
        turn++;
        const last = messages.at(-1);
        if (turn === 1) return callTool('get_order', { orderId: 'A101' });
        if (turn === 2) {
          assert.ok(last.content.includes('arrived damaged')); // it observed the tool result
          return callTool('issue_refund', { orderId: 'A101', amountEur: 80, reason: 'damaged' });
        }
        assert.ok(last.content.includes('Refunded 80.00'));
        return answer('Refunded 80 EUR for your damaged keyboard.');
      },
    },
  },
} as unknown as Pick<OpenAI, 'chat'>;

const mcp = new Client({ name: 'test-loop', version: '1.0.0' });
await mcp.connect(new StdioClientTransport({ ...SERVER_COMMAND, stderr: 'ignore' }));
const reply = await runAgent(fakeLlm, mcp, 'Order A101 arrived broken');
await mcp.close();

console.log('agent>', reply);
assert.equal(turn, 3);
console.log('\nLoop check passed: discover -> reason -> act -> observe -> stop.');

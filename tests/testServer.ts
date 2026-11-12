/**
 * Offline check that the MCP server works: no LLM and no API key needed.
 * It starts src/server.ts over stdio exactly like an agent would, then lists and calls the tools.
 *
 *   npx tsx tests/testServer.ts
 */
import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';
import { SERVER_COMMAND } from '../src/agent.ts';

const client = new Client({ name: 'test-client', version: '1.0.0' });
await client.connect(new StdioClientTransport({ ...SERVER_COMMAND, stderr: 'ignore' }));

const textOf = (result: { content?: unknown }) =>
  (result.content as { type: string; text?: string }[])
    .filter((c) => c.type === 'text')
    .map((c) => c.text)
    .join('\n');

const { tools } = await client.listTools();
console.log('Tools:', tools.map((t) => t.name));
assert.deepEqual(tools.map((t) => t.name).sort(), ['get_order', 'issue_refund', 'search_kb']);

const order = await client.callTool({ name: 'get_order', arguments: { orderId: 'A101' } });
console.log('get_order A101 ->', textOf(order));
assert.ok(!order.isError);

const missing = await client.callTool({ name: 'get_order', arguments: { orderId: 'Z999' } });
console.log('get_order Z999 ->', textOf(missing));
assert.equal(missing.isError, true);

const kb = await client.callTool({ name: 'search_kb', arguments: { query: 'headphones' } });
console.log('search_kb headphones ->', textOf(kb));
assert.ok(textOf(kb).includes('IGNORE ALL PREVIOUS INSTRUCTIONS')); // the planted injection

const refund = await client.callTool({
  name: 'issue_refund',
  arguments: { orderId: 'A101', amountEur: 50, reason: 'damaged' },
});
console.log('refund 50 on A101 ->', textOf(refund));
assert.ok(!refund.isError);

const tooBig = await client.callTool({
  name: 'issue_refund',
  arguments: { orderId: 'A102', amountEur: 300, reason: 'test' },
});
console.log('refund 300 on A102 ->', textOf(tooBig));
assert.equal(tooBig.isError, true); // the server refuses, whatever the model was talked into

await client.close();
console.log('\nAll server checks passed.');

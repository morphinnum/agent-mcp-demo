/**
 * The same support agent as a LangGraph state graph (spec: documents/specs/002-langgraph-agent.md).
 * Same MCP server, same four defence layers, different framework: that is the point of MCP.
 *
 *   START → screen ─attack→ END
 *             └ok→ agent ─answer→ END
 *                    └tool calls→ approve → tools → agent
 *
 *   npm run graph -- "Order A101 arrived broken, can I get a refund?"
 */
import * as readline from 'node:readline/promises';
import { pathToFileURL } from 'node:url';
import { Annotation, Command, END, MemorySaver, MessagesAnnotation, START, StateGraph, interrupt } from '@langchain/langgraph';
import { AIMessage, HumanMessage, SystemMessage, ToolMessage, type BaseMessage } from '@langchain/core/messages';
import type { StructuredToolInterface } from '@langchain/core/tools';
import { ChatOpenAI } from '@langchain/openai';
import { MCPAdapter } from '@langchain/mcp-adapters';
import { z } from 'zod';
import {
  INJECTION, INSTRUCTIONS, REJECTED, SCREENER_INSTRUCTIONS, SERVER_COMMAND, WITHHELD, layerOf,
  type AskHuman, type ChatEvent, type Engine,
} from './agent.ts';
import { LLM_CONFIG, MODEL, checkLLM, createLLM } from './llm.ts';

export type ChatModel = { invoke(messages: BaseMessage[]): Promise<BaseMessage> };
export type Screen = (text: string) => Promise<{ isAttack: boolean; reason: string }>;

const State = Annotation.Root({
  ...MessagesAnnotation.spec,
  blocked: Annotation<string>, // layer 1 reason for this turn, '' when the message is fine
  rejected: Annotation<string[]>, // tool-call ids a human rejected (layer 3)
});

const textOf = (content: unknown) =>
  typeof content === 'string' ? content
  : Array.isArray(content) ? content.map((c) => (typeof c === 'string' ? c : (c.text ?? ''))).join('\n')
  : JSON.stringify(content);

const toolCallsOf = (msg: BaseMessage | undefined) => (msg as AIMessage | undefined)?.tool_calls ?? [];

export function buildGraph(model: ChatModel, screen: Screen, tools: StructuredToolInterface[]) {
  const byName = new Map(tools.map((t) => [t.name, t]));

  return new StateGraph(State)
    // Layer 1: classify the user's message before the agent sees it. Errors FAIL CLOSED.
    .addNode('screen', async ({ messages }) => {
      const check = await screen(textOf(messages.at(-1)?.content)).catch(() => ({
        isAttack: true, reason: 'safety check failed',
      }));
      return check.isAttack
        ? { blocked: check.reason, messages: [new AIMessage("Sorry, I can't help with that.")] }
        : { blocked: '' };
    })
    .addNode('agent', async ({ messages }) => ({
      messages: [await model.invoke([new SystemMessage(INSTRUCTIONS), ...messages])],
    }))
    // Layer 3: pause for a human on every refund. No side effects here: LangGraph re-runs an
    // interrupted node from the top on resume, so running tools in this node could run them twice.
    .addNode('approve', ({ messages }) => ({
      rejected: toolCallsOf(messages.at(-1))
        .filter((c) => c.name === 'issue_refund')
        .filter((c) => interrupt<{ question: string }, boolean>({
          question: `approve issue_refund(${JSON.stringify(c.args)})?`,
        }) !== true) // only an explicit true approves
        .map((c) => c.id!),
    }))
    // Runs the MCP tools. Layer 2: results with instructions for the AI are withheld.
    .addNode('tools', async ({ messages, rejected }) => ({
      messages: await Promise.all(toolCallsOf(messages.at(-1)).map(async (call) => {
        const reply = (content: string) => new ToolMessage({ content, tool_call_id: call.id!, name: call.name });
        if (rejected.includes(call.id!)) return reply(REJECTED);
        const tool = byName.get(call.name);
        if (!tool) return reply(`Unknown tool ${call.name}.`);
        const output = await tool.invoke(call.args).then(textOf, (err: Error) => err.message);
        return reply(INJECTION.test(output) ? WITHHELD : output);
      })),
    }))
    .addEdge(START, 'screen')
    .addConditionalEdges('screen', ({ blocked }) => (blocked ? END : 'agent'), ['agent', END])
    .addConditionalEdges('agent', ({ messages }) => (toolCallsOf(messages.at(-1)).length ? 'approve' : END), ['approve', END])
    .addEdge('approve', 'tools')
    .addEdge('tools', 'agent')
    .compile({ checkpointer: new MemorySaver() }); // conversation memory, one thread per chat
}

type Graph = ReturnType<typeof buildGraph>;

/** One user turn, as ChatEvents. Interrupts are answered with askHuman, then the graph resumes. */
export async function* runGraphTurn(graph: Graph, threadId: string, text: string, askHuman: AskHuman): AsyncGenerator<ChatEvent> {
  const config = { configurable: { thread_id: threadId }, streamMode: 'updates' as const, recursionLimit: 20 };
  let input: Parameters<Graph['stream']>[0] = { messages: [new HumanMessage(text)] };

  while (true) {
    let question: string | undefined;
    for await (const chunk of await graph.stream(input, config)) {
      const update = chunk as Record<string, any>;
      if (update.__interrupt__) question = update.__interrupt__[0].value.question;
      if (update.screen?.blocked) yield { type: 'blocked', reason: update.screen.blocked };
      for (const msg of update.agent?.messages ?? []) {
        const calls = toolCallsOf(msg);
        if (calls.length) for (const c of calls) yield { type: 'tool_call', name: c.name, args: c.args };
        else yield { type: 'message', text: textOf(msg.content) };
      }
      for (const msg of update.tools?.messages ?? []) {
        const output = textOf(msg.content);
        const name = msg.name ?? 'tool';
        yield { type: 'tool_result', name, output, layer: layerOf(output, name) };
      }
    }
    if (question === undefined) return;
    input = new Command({ resume: await askHuman(question) });
  }
}

/** Loads the tools from our MCP server (stdio), exactly like the other agents do. */
export async function connectMcpTools() {
  const mcp = new MCPAdapter({
    servers: { 'support-desk': { transport: 'stdio', ...SERVER_COMMAND, stderr: 'ignore' } },
    prefixToolNameWithServerName: false, // keep 'issue_refund', same name as in the other engines
  });
  return { mcp, tools: await mcp.listTools() };
}

/** LangGraph as a web engine. Pass fakes in tests; otherwise it uses the configured LLM. */
export async function createGraphEngine(fakes?: { model: ChatModel; screen: Screen }): Promise<Engine> {
  const { mcp, tools } = await connectMcpTools();
  const llm = new ChatOpenAI({ model: MODEL, apiKey: LLM_CONFIG.apiKey, configuration: { baseURL: LLM_CONFIG.baseURL } });
  const AttackCheck = z.object({ isAttack: z.boolean(), reason: z.string() });
  const classifier = llm.withStructuredOutput(AttackCheck);
  const model = fakes?.model ?? llm.bindTools(tools);
  const screen = fakes?.screen ?? ((text) => classifier.invoke([new SystemMessage(SCREENER_INSTRUCTIONS), new HumanMessage(text)]));
  const graph = buildGraph(model, screen, tools);
  let thread = 0;

  return {
    turn: (text, askHuman) => runGraphTurn(graph, `chat-${thread}`, text, askHuman),
    reset: () => void thread++, // a new thread_id = a fresh conversation in the checkpointer
    close: () => mcp.close(),
  };
}

// Run only when started directly (npm run graph), not when a test or web.ts imports it.
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await checkLLM(createLLM());
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const engine = await createGraphEngine();
  const goal = process.argv.slice(2).join(' ') || 'Order A101 arrived broken. Can I get a refund?';
  try {
    for await (const ev of engine.turn(goal, async (q) => (await rl.question(`  ${q} [y/N] `)).trim().toLowerCase() === 'y')) {
      console.log(ev.type === 'message' ? `\nagent> ${ev.text}` : `  [${ev.type}] ${JSON.stringify(ev)}`);
    }
  } finally {
    rl.close();
    await engine.close();
  }
}

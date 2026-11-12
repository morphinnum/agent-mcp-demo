/**
 * Which LLM the demo talks to. The default is FREE: an open-weight model running on your own
 * machine through Ollama (https://ollama.com). No API key, no cost, works offline.
 *
 *   (default)            Ollama at http://localhost:11434/v1, model qwen2.5:7b
 *   LLM_PROVIDER=openai  OpenAI's paid API; needs OPENAI_API_KEY
 *   Anything else that speaks the OpenAI-compatible API (LM Studio, a cloud free tier...):
 *                        set LLM_BASE_URL, LLM_API_KEY and LLM_MODEL
 *   LLM_MODEL=...        overrides the model for any provider, e.g. LLM_MODEL=qwen3:8b
 */
import OpenAI from 'openai';
import { setDefaultOpenAIClient, setOpenAIAPI, setTracingDisabled } from '@openai/agents';

const provider = process.env.LLM_PROVIDER ?? 'ollama';

const defaults =
  provider === 'openai'
    ? { baseURL: undefined, apiKey: process.env.OPENAI_API_KEY, model: 'gpt-5.6-luna' }
    : { baseURL: 'http://localhost:11434/v1', apiKey: 'ollama', model: 'qwen2.5:7b' }; // Ollama ignores the key

export const MODEL = process.env.LLM_MODEL ?? defaults.model;

/** Where the configured provider lives. Also used by LangChain's ChatOpenAI in graphAgent.ts. */
export const LLM_CONFIG = {
  baseURL: process.env.LLM_BASE_URL ?? defaults.baseURL,
  apiKey: process.env.LLM_API_KEY ?? defaults.apiKey,
};

/** An OpenAI SDK client pointed at whichever provider is configured. */
export const createLLM = () => new OpenAI(LLM_CONFIG);

/** Make the Agents SDK use that client. Chat Completions is the API every provider supports. */
export async function useConfiguredLLM(): Promise<void> {
  const llm = createLLM();
  await checkLLM(llm);
  setDefaultOpenAIClient(llm);
  setOpenAIAPI('chat_completions');
  if (provider !== 'openai') setTracingDisabled(true); // traces can only be uploaded to OpenAI
}

/** Fail early with a helpful message instead of a confusing error mid-conversation. */
export async function checkLLM(llm: OpenAI): Promise<void> {
  const where = llm.baseURL;
  try {
    const models = await llm.models.list();
    const found = models.data.some((m) => m.id === MODEL);
    if (!found && provider === 'ollama') {
      console.error(`[llm] model ${MODEL} is not downloaded yet. Run: ollama pull ${MODEL}`);
      process.exit(1);
    }
    console.error(`[llm] ${MODEL} via ${where}`);
  } catch {
    console.error(`[llm] cannot reach an LLM at ${where}.`);
    if (provider === 'ollama') console.error('[llm] Is Ollama running? Start the Ollama app, or run: ollama serve');
    process.exit(1);
  }
}

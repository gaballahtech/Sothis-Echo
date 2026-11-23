/**
 * Unified AI calling layer with multi-provider fallback.
 *
 * Priority chain (cheapest / fastest first, best quality within each tier):
 *   1. Google Gemini — 6 free-tier keys × 3 efficient models
 *        (gemini-3-flash-preview → gemini-3.1-flash-lite → gemini-3.5-flash-lite)
 *   2. Cohere — Command A (free trial key)
 *   3. OpenRouter — free model auto-router (last resort)
 *
 * Each attempt is tried in order; on a transient failure (429/503/timeout) the
 * next key / model / provider is used automatically. Returns the first success.
 *
 * Context is preserved across provider switches: every attempt receives the FULL
 * message history (system + all prior turns), so a fallback model never treats
 * the conversation as new.
 *
 * All providers speak a chat-style API, so we normalise to one shape:
 *   callAI({ system, messages, maxTokens, temperature }) -> { text, provider }
 */

// Keys are read from environment variables (set in .env.local for local dev and
// in the Vercel project settings for production). GEMINI_API_KEYS accepts a
// comma-separated list of free-tier Gemini keys for the fallback chain.
const GEMINI_KEYS = [
  process.env.GEMINI_API_KEY,
  ...(process.env.GEMINI_API_KEYS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
].filter(Boolean);

const GEMINI_MODELS = ['gemini-3-flash-preview', 'gemini-3.1-flash-lite', 'gemini-3.5-flash-lite'];

const COHERE_KEY = process.env.COHERE_KEY || '';
const COHERE_MODEL = 'command-a-03-2025';

const OPENROUTER_KEY = process.env.OPENROUTER_KEY || '';
const OPENROUTER_MODEL = 'openrouter/free';

/**
 * Try one Gemini model with one key. Returns { ok, text }.
 */
async function tryGemini(key, model, system, messages, maxTokens, temperature) {
  const contents = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: String(m.text ?? '') }],
  }));
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents,
        generationConfig: { maxOutputTokens: maxTokens, temperature, thinkingConfig: { thinkingBudget: 0 } },
      }),
      signal: AbortSignal.timeout(30000),
    },
  );
  const data = await res.json().catch(() => null);
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
  return { ok: Boolean(res.ok && text), text };
}

/**
 * Try Cohere v2 chat. Returns { ok, text }.
 * Cohere v2 accepts {role, content} messages and a system message in the list.
 */
async function tryCohere(system, messages, maxTokens, temperature) {
  const res = await fetch('https://api.cohere.com/v2/chat', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${COHERE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: COHERE_MODEL,
      messages: [
        { role: 'system', content: system },
        ...messages.map((m) => ({ role: m.role, content: String(m.text ?? '') })),
      ],
      max_tokens: maxTokens,
      temperature,
    }),
    signal: AbortSignal.timeout(30000),
  });
  const data = await res.json().catch(() => null);
  const text = data?.message?.content?.[0]?.text?.trim() || null;
  return { ok: Boolean(res.ok && text), text };
}

/**
 * Try OpenRouter (OpenAI-compatible chat completions). Returns { ok, text }.
 */
async function tryOpenRouter(system, messages, maxTokens, temperature) {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENROUTER_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: [{ role: 'system', content: system }, ...messages.map((m) => ({ role: m.role, content: String(m.text ?? '') }))],
      max_tokens: maxTokens,
      temperature,
    }),
    signal: AbortSignal.timeout(30000),
  });
  const data = await res.json().catch(() => null);
  const text = data?.choices?.[0]?.message?.content?.trim() || null;
  return { ok: Boolean(res.ok && text), text };
}

/**
 * Call an LLM across the provider fallback chain.
 * @param {{system:string, messages:Array<{role:string,text:string}>, maxTokens?:number, temperature?:number}} opts
 * @returns {Promise<{text:string|null, provider:string}>}
 */
export async function callAI({ system, messages, maxTokens = 800, temperature = 0.5 }) {
  // 1) Gemini — for each model, try every key until one succeeds.
  for (const model of GEMINI_MODELS) {
    for (const key of GEMINI_KEYS) {
      try {
        const { ok, text } = await tryGemini(key, model, system, messages, maxTokens, temperature);
        if (ok) return { text, provider: `gemini:${model}` };
      } catch {
        /* transient — try next key */
      }
    }
  }
  // 2) Cohere fallback.
  try {
    const { ok, text } = await tryCohere(system, messages, maxTokens, temperature);
    if (ok) return { text, provider: 'cohere:command-a' };
  } catch {
    /* fall through */
  }
  // 3) OpenRouter fallback.
  try {
    const { ok, text } = await tryOpenRouter(system, messages, maxTokens, temperature);
    if (ok) return { text, provider: 'openrouter:free' };
  } catch {
    /* fall through */
  }
  return { text: null, provider: 'none' };
}
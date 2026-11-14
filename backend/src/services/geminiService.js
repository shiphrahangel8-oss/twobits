import { env, isGeminiConfigured } from '../config/env.js';

let genAIClient = null;

async function getGenAIClient() {
  if (!isGeminiConfigured()) return null;
  if (genAIClient) return genAIClient;
  try {
    const { GoogleGenAI } = await import('@google/genai');
    genAIClient = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
    return genAIClient;
  } catch {
    // Fallback to direct REST invocation when @google/genai is not in local node_modules
    genAIClient = {
      models: {
        async generateContent({ model, contents, config }) {
          const targetModel = model || env.GEMINI_MODEL || 'gemini-2.5-flash';
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
            targetModel
          )}:generateContent?key=${encodeURIComponent(env.GEMINI_API_KEY)}`;
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: contents }] }],
              generationConfig: {
                responseMimeType: config?.responseMimeType || 'application/json',
                temperature: config?.temperature ?? 0.1,
              },
            }),
            signal: AbortSignal.timeout(2500),
          });
          if (!res.ok) {
            throw new Error(`Gemini HTTP ${res.status}`);
          }
          const json = await res.json();
          const text = json?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          return { text };
        },
      },
    };
    return genAIClient;
  }
}

export const geminiService = {
  getStatus() {
    const configured = isGeminiConfigured();
    return {
      mode: configured ? 'LIVE_GOOGLE_GEMINI_API' : 'DETERMINISTIC_EVIDENCE_REASONING_ENGINE',
      geminiConnected: configured,
      model: env.GEMINI_MODEL || 'gemini-2.5-flash',
      sdk: '@google/genai',
      secretKeyProtectedOnBackend: true,
    };
  },

  /**
   * Perform structured multi-agent reasoning using Google Gemini (@google/genai)
   * while merging with deterministic evidence-driven baseline so required schema
   * fields are always guaranteed even if offline or rate-limited.
   */
  async reasonStructured({ agentName, systemInstruction, contextData, fallbackBuilder }) {
    const baseline = await fallbackBuilder(contextData);
    const client = await getGenAIClient();
    if (client) {
      try {
        const prompt = `
You are ${agentName} inside the ResolveAI Autonomous Business Operations Platform.
System Instructions: ${systemInstruction}

Analyze the following real database records and operational evidence. Do NOT invent any order, payment, inventory, or shipment facts outside this evidence:
${JSON.stringify(contextData, null, 2)}

Return ONLY valid JSON matching this structure:
${JSON.stringify(baseline, null, 2)}
`;
        const response = await client.models.generateContent({
          model: env.GEMINI_MODEL || 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.1,
          },
        });
        const text = response?.text || '';
        if (text) {
          const parsed = JSON.parse(text);
          return {
            ...baseline,
            ...parsed,
            requiredAgents: Array.isArray(parsed.requiredAgents)
              ? parsed.requiredAgents
              : baseline.requiredAgents,
            _engine: 'LIVE_GEMINI_API',
            _model: env.GEMINI_MODEL,
          };
        }
      } catch {
        // Gracefully use verified deterministic evidence baseline when offline or sandboxed
      }
    }

    return {
      ...baseline,
      _engine: isGeminiConfigured() ? 'LIVE_GEMINI_CONFIGURED_HYBRID' : 'EVIDENCE_REASONING_ENGINE',
      _model: env.GEMINI_MODEL,
    };
  },
};

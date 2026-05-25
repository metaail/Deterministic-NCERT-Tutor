import { GoogleGenAI } from '@google/genai';
import { env } from '@/lib/utils/env';
import { incrementGeminiUsage } from '@/lib/stats/geminiUsage';

let aiClient: GoogleGenAI | null = null;
function getAiClient() {
    if (!aiClient && env.GEMINI_API_KEY) {
        aiClient = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
    }
    return aiClient;
}

export const CHAT_MODEL = 'gemini-3.1-pro-preview';
export const FALLBACK_MODEL = 'gemini-3.1-pro-preview';
export const EMBEDDING_MODEL = 'gemini-embedding-2-preview';

  export async function generateContentStream(prompt: string, systemInstruction?: string, retries = 2) {
    const ai = getAiClient();
    if (!ai) throw new Error("GEMINI_API_KEY not configured.");
    
    let lastError = null;
    for (let i = 0; i < retries; i++) {
        try {
            incrementGeminiUsage();
            const responseStream = await ai.models.generateContentStream({
                model: CHAT_MODEL,
                contents: prompt,
                config: {
                    systemInstruction: systemInstruction,
                }
            });
            return responseStream;
        } catch (err: any) {
            const errMsg = err.message || JSON.stringify(err);
            if (err.status === 429 || err.status === 'RESOURCE_EXHAUSTED' || errMsg.includes('429') || errMsg.includes('Quota exceeded')) {
                console.warn(`[Rate Limit] Retrying stream in 2 seconds...`);
                await new Promise(res => setTimeout(res, 2000));
                lastError = err;
                continue;
            }
            throw err;
        }
    }
    throw lastError;
  }

  export async function generateContent(prompt: string, systemInstruction?: string, retries = 2): Promise<string> {
    const ai = getAiClient();
    if (!ai) throw new Error("GEMINI_API_KEY not configured.");
    
    let lastError = null;
    for (let i = 0; i < retries; i++) {
      try {
        incrementGeminiUsage();
        const response = await ai.models.generateContent({
          model: CHAT_MODEL,
          contents: prompt,
          config: {
              systemInstruction: systemInstruction,
          }
        });
  
        if (!response.text) {
            throw new Error("Failed to generate text content.");
        }
  
        return response.text;
      } catch (err: any) {
        const errMsg = err.message || JSON.stringify(err);
        if (err.status === 429 || err.status === 'RESOURCE_EXHAUSTED' || errMsg.includes('429') || errMsg.includes('Quota exceeded')) {
          console.warn(`[Rate Limit] Retrying in 2 seconds...`);
          await new Promise(res => setTimeout(res, 2000));
          lastError = err;
          continue;
        }
        throw err;
      }
    }
    
    throw lastError;
  }

export async function generateFallbackContent(prompt: string, historyText: string, retries = 2): Promise<string> {
  const ai = getAiClient();
  if (!ai) throw new Error("GEMINI_API_KEY not configured.");
  
  let lastError = null;
  for (let i = 0; i < retries; i++) {
    try {
      incrementGeminiUsage();
      const response = await ai.models.generateContent({
        model: FALLBACK_MODEL,
        contents: historyText + prompt,
        config: {
            systemInstruction: "You are a highly advanced math and science tutor for NEET/JEE. The student asked a question that was not found in their standard textbook context. Provide a clear, conceptual, and mathematically accurate explanation to help them understand from your internal knowledge. Provide pedantic explanations. Break down the mathematical meaning of terms, conditions, and implications. MATH & FORMULAS: Use ONLY \\( ... \\) for inline math and \\[ ... \\] for block math. NEVER use the $ or $$ delimiters.",
        }
      });

      if (!response.text) {
          throw new Error("Failed to generate text content.");
      }

      return response.text;
    } catch (err: any) {
      const errMsg = err.message || JSON.stringify(err);
      if (err.status === 429 || err.status === 'RESOURCE_EXHAUSTED' || errMsg.includes('429') || errMsg.includes('Quota exceeded')) {
        console.warn(`[Rate Limit] Retrying in 2 seconds...`);
        await new Promise(res => setTimeout(res, 2000));
        lastError = err;
        continue;
      }
      throw err;
    }
  }
  
  throw lastError;
}

export async function generateFallbackContentStream(prompt: string, historyText: string, retries = 2) {
  const ai = getAiClient();
  if (!ai) throw new Error("GEMINI_API_KEY not configured.");
  
  let lastError = null;
  for (let i = 0; i < retries; i++) {
    try {
      incrementGeminiUsage();
      const responseStream = await ai.models.generateContentStream({
        model: FALLBACK_MODEL,
        contents: historyText + prompt,
        config: {
            systemInstruction: "You are a highly advanced math and science tutor for NEET/JEE. The student asked a question that was not found in their standard textbook context. Provide a clear, conceptual, and mathematically accurate explanation to help them understand from your internal knowledge. Provide pedantic explanations. Break down the mathematical meaning of terms, conditions, and implications. MATH & FORMULAS: Use ONLY \\( ... \\) for inline math and \\[ ... \\] for block math. NEVER use the $ or $$ delimiters.",
        }
      });

      return responseStream;
    } catch (err: any) {
      const errMsg = err.message || JSON.stringify(err);
      if (err.status === 429 || err.status === 'RESOURCE_EXHAUSTED' || errMsg.includes('429') || errMsg.includes('Quota exceeded')) {
        console.warn(`[Rate Limit] Retrying in 2 seconds...`);
        await new Promise(res => setTimeout(res, 2000));
        lastError = err;
        continue;
      }
      throw err;
    }
  }
  
  throw lastError;
}
export async function generateEmbedding(text: string): Promise<number[] | null> {
    const ai = getAiClient();
    if (!ai) return null;
    try {
        incrementGeminiUsage();
        const response = await ai.models.embedContent({
            model: EMBEDDING_MODEL,
            contents: text,
        });
        return response.embeddings?.[0]?.values || null;
    } catch (e) {
        console.error("Embedding generation failed", e);
        return null;
    }
}

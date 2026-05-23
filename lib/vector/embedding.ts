import { GoogleGenAI } from '@google/genai';
import { env } from '@/lib/utils/env';

let aiClient: GoogleGenAI | null = null;
function getAiClient() {
    if (!aiClient && env.GEMINI_API_KEY) {
        aiClient = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
    }
    return aiClient;
}

export const EMBEDDING_MODEL = 'gemini-embedding-2-preview'; 

export async function generateEmbedding(text: string): Promise<number[]> {
  const ai = getAiClient();
  if (!ai) throw new Error("GEMINI_API_KEY not configured for embeddings.");
  const response = await ai.models.embedContent({
    model: EMBEDDING_MODEL,
    contents: text, config: { outputDimensionality: 768 }
  });
  const vector = response.embeddings?.[0]?.values;
  if (!vector) throw new Error("Failed to generate embedding");
  return vector;
}

import { GoogleGenAI } from '@google/genai';

export const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
export const cachedAi = ai;

export function getGeminiModel(modelName: string) {
  return ai.models.generateContent;
}

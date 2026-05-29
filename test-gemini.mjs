import { GoogleGenAI } from '@google/genai';
import { env } from './lib/utils/env.js'; // wait, I will just read .env

import dotenv from 'dotenv';
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function test() {
   const start = Date.now();
   let ttft = 0;
   const stream = await ai.models.generateContentStream({
       model: 'gemini-3.1-flash-lite',
       contents: 'Please generate a 500 word essay about the importance of relations and functions in mathematics, simulating a NEET/JEE tutor.',
   });
   for await (const chunk of stream) {
       if (ttft === 0) ttft = Date.now() - start;
   }
   console.log("TTFT (ms):", ttft);
   console.log("Total Time (ms):", Date.now() - start);
}
test();

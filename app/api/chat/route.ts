import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { prompt, history } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "Missing API Key" }, { status: 500 });
    
    const ai = new GoogleGenAI({ apiKey });
    
    const responseStream = await ai.models.generateContentStream({
      model: "gemini-1.5-pro",
      contents: history + "\n\nUser: " + prompt,
      config: {
        systemInstruction: "You are an advanced mathematics tutor specializing in JEE/NEET. Provide highly detailed mathematical explanations. Use purely markdown text.",
      }
    });

    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of responseStream) {
          if (chunk.text) {
            controller.enqueue(new TextEncoder().encode(chunk.text));
          }
        }
        controller.close();
      }
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

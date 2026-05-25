import { NextRequest } from 'next/server';
import { detectIntent } from '@/lib/chat/intentRouter';
import { planRetrieval } from '@/lib/chat/retrievalPlanner';
import { runTutorAgentStream } from '@/lib/chat/streamPipeline';
import { fastMathSolverStream } from '@/lib/chat/fastMathSolver';
import { ChatRequest } from '@/lib/chat/chatTypes';
import { logPromptAudit } from '@/lib/prompts/promptAudit';
import { logMetrics } from '@/lib/chat/retrievalMetrics';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const startTime = Date.now();
    const body = await req.json();
    const request: ChatRequest = {
      subjectCode: body.subjectCode,
      classLevel: body.classLevel,
      chapterKey: body.chapterKey,
      query: body.query,
      history: body.history || []
    };

    if (!request.subjectCode || !request.classLevel || !request.chapterKey || !request.query) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
    }

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // 1. Detect Intent
          const intent = detectIntent(request.query);
          
          if (intent === 'simple_math_query') {
              const historyText = request.history && request.history.length > 0 
                ? "Previous Conversation:\n" + request.history.map(m => `${m.role.toUpperCase()}: ${m.content}`).join("\n") + "\n\n"
                : "";
              const agentStream = await fastMathSolverStream(request.query, historyText, (metrics) => {
                  console.log("[FastMath Stream Metrics]", metrics);
                  logMetrics("/api/chat/stream", metrics);
              });
              
              const reader = agentStream.getReader();
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                controller.enqueue(value);
              }
              controller.close();
              return;
          }

          // 2. Plan Retrieval
          const contextPayload = await planRetrieval(request, intent);
          const retrievalLatency = Date.now() - startTime;
          const cacheHit = contextPayload.textChunks ? (contextPayload.textChunks as any).isCacheHit === true : false;

          // 3. Initiate Streaming Pipeline
          const agentStream = await runTutorAgentStream(request, contextPayload, (metrics) => {
            // Overwrite the combined accurate retrieval time
            metrics.retrievalLatency = retrievalLatency;
            metrics.cacheHit = cacheHit;
            console.log("[Stream Metrics]", metrics);
            logMetrics("/api/chat/stream", metrics);
          });
          
          const reader = agentStream.getReader();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            controller.enqueue(value);
          }
          controller.close();
        } catch (error: any) {
          console.error("[Chat Stream Generator Error]", error);
          controller.enqueue(new TextEncoder().encode(`data: {"error": "${error.message || "Internal server error"}"}\n\n`));
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: any) {
    console.error("[Chat Stream API Error]", error);
    return new Response(JSON.stringify({ error: error.message || "Internal server error" }), { status: 500 });
  }
}

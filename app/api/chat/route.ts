import { NextRequest } from 'next/server';
import { detectIntent } from '@/lib/chat/intentRouter';
import { planRetrieval } from '@/lib/chat/retrievalPlanner';
import { runTutorAgentStream } from '@/lib/chat/streamPipeline';
import { fastMathSolverStream } from '@/lib/chat/fastMathSolver';
import { ChatRequest } from '@/lib/chat/chatTypes';
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
          const intent = detectIntent(request.query);
          
          if (intent === 'simple_math_query') {
              let historyText = "";
              if (request.history && request.history.length > 0) {
                 const shortHistory = request.history.slice(-2);
                 historyText = "Previous Conversation:\n" + shortHistory.map(m => `${m.role.toUpperCase()}: ${m.content}`).join("\n") + "\n\n";
              }
              const agentStream = await fastMathSolverStream(request.query, historyText, (metrics) => {
                  logMetrics("/api/chat", metrics);
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

          const startRetrieval = Date.now();
          const contextPayload = await planRetrieval(request, intent);
          const retrievalLatency = Date.now() - startRetrieval;
          const cacheHit = contextPayload.textChunks ? (contextPayload.textChunks as any).isCacheHit === true : false;

          const startGuard = Date.now();
          const { evaluateGroundingConfidence } = await import('@/lib/chat/groundingGuard');
          const grounding = evaluateGroundingConfidence(request.query, contextPayload, request.chapterKey, request.subjectCode);
          const guardLatency = Date.now() - startGuard;

          if (!grounding.isGrounded) {
             controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ content: grounding.reason })}\n\n`));
             controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ done: true })}\n\n`));
             controller.close();
             return;
          }

          const agentStream = await runTutorAgentStream(request, contextPayload, (metrics) => {
            metrics.retrievalLatency = retrievalLatency;
            metrics.cacheHit = cacheHit;
            logMetrics("/api/chat", metrics);
          });
          
          const reader = agentStream.getReader();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            controller.enqueue(value);
          }
          controller.close();
        } catch (error: any) {
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ error: error.message || "Internal server error" })}\n\n`));
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
    return new Response(JSON.stringify({ error: error.message || "Internal server error" }), { status: 500 });
  }
}

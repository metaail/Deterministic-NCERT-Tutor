import { generateFallbackContentStream } from '@/lib/gemini';
import { ChatRequest, StreamMetrics } from './chatTypes';

export async function runGeneralDoubtStream(
  request: ChatRequest,
  onMetrics?: (metrics: StreamMetrics) => void
): Promise<ReadableStream> {
  const historyText = request.history && request.history.length > 0 
    ? "Previous Conversation:\n" + request.history.map(m => `${m.role.toUpperCase()}: ${m.content}`).join("\n") + "\n\n"
    : "";

  const stream = await generateFallbackContentStream(request.query, historyText);

  const startTime = Date.now();
  let firstTokenTime = 0;
  let tokenCount = 0;

  return new ReadableStream({
    async start(controller) {
      try {
        let isFirst = true;
        for await (const chunk of stream) {
          if (firstTokenTime === 0) firstTokenTime = Date.now();
          const text = chunk.text || "";
          tokenCount += text.length; // rough estimate
          
          if (isFirst) {
            controller.enqueue(
              new TextEncoder().encode(`data: ${JSON.stringify({ content: text, metadata: { isGeneralDoubt: true } })}\n\n`)
            );
            isFirst = false;
          } else {
            controller.enqueue(
              new TextEncoder().encode(`data: ${JSON.stringify({ content: text })}\n\n`)
            );
          }
        }

        const endTime = Date.now();
        const metrics: StreamMetrics = {
          retrievalLatency: 0,
          geminiLatency: endTime - startTime,
          verifierLatency: 0,
          totalLatency: endTime - startTime,
          timeToFirstToken: firstTokenTime ? firstTokenTime - startTime : 0,
          tokensPerSecond: tokenCount / ((endTime - startTime) / 1000 || 1)
        };
        
        if (onMetrics) onMetrics(metrics);
        
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ done: true })}\n\n`));
        controller.close();
      } catch (error: any) {
        controller.enqueue(
          new TextEncoder().encode(`data: ${JSON.stringify({ error: error.message })}\n\n`)
        );
        controller.close();
      }
    }
  });
}

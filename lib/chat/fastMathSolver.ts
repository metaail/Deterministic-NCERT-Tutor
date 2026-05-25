import { generateContentStream } from '@/lib/gemini';
import { SYSTEM_PROMPT } from '@/lib/prompts/systemPrompt';

export async function fastMathSolverStream(
  query: string,
  historyText: string,
  onMetrics?: (metrics: any) => void
) {
  const startTime = Date.now();
  
  // Minimal prompt
  const finalPrompt = historyText + "Answer the following math question directly and concisely without heavy introductions: " + query;
  
  const MATH_PROMPT = "You are an expert Math/Science tutor. Provide direct, pedantic, mathematical answers to simple questions. Do NOT require external context. Use ONLY \\( ... \\) for inline math and \\[ ... \\] for block math. ALWAYS answer accurately.";

  const stream = await generateContentStream(finalPrompt, MATH_PROMPT, 2, 300);
  const startGeminiTime = Date.now();
  
  return new ReadableStream({
    async start(controller) {
      controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ metadata: { intent: 'simple_math_query' } })}\n\n`));

      let ttft = 0;
      let isFirstToken = true;
      let fullResponse = '';
      let verifierWaitMs = 0;
      
      let buffer = '';

      try {
        for await (const chunk of stream) {
          const text = chunk.text;
          if (!text) continue;
          
          if (isFirstToken) {
            ttft = Date.now() - startTime;
            isFirstToken = false;
          }
          
          const startVer = Date.now();
          buffer += text;
          
          // Lightweight verifier check
          const lower = buffer.toLowerCase();
          if (lower.includes('data:image') || lower.includes('base64') || buffer.includes('![')) {
             console.log("Blocked by verifier in fast math");
             controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ error: 'Images blocked' })}\n\n`));
             break;
          }
          let verifiedText = text.replace(/\$\$([\s\S]*?)\$\$/g, '\\[$1\\]');
          verifierWaitMs += (Date.now() - startVer);

          fullResponse += verifiedText;
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ content: verifiedText })}\n\n`));
        }
        
        const endTime = Date.now();
        const totalLatency = endTime - startTime;
        
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ done: true })}\n\n`));

        if (onMetrics) {
          onMetrics({
            retrievalLatency: 0,
            geminiLatency: endTime - startGeminiTime,
            verifierLatency: verifierWaitMs,
            totalLatency: totalLatency,
            timeToFirstToken: ttft,
            tokensPerSecond: fullResponse.length / 4 / (totalLatency / 1000),
            cacheHit: false
          });
        }
        controller.close();
      } catch (err: any) {
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ error: err.message })}\n\n`));
        controller.close();
      }
    }
  });
}

import { ChatRequest, ContextPayload } from './chatTypes';
import { generateContentStream, generateFallbackContentStream } from '@/lib/gemini';
import { SYSTEM_PROMPT } from '@/lib/prompts/systemPrompt';
import { buildTutorPrompt } from '@/lib/prompts/tutorPrompt';
import { buildContextString } from './contextBuilder';
import { searchPyq } from '@/lib/pyq/pyqRetriever';
import { formatPyqContext } from '@/lib/pyq/pyqFormatter';
import { verifyResponse } from './verifier';
import { createStreamVerifier } from './streamVerifier';

export async function runTutorAgentStream(
    request: ChatRequest,
    payload: ContextPayload,
    onMetrics?: (metrics: any) => void
) {
  const startTime = Date.now();
  
  const contextString = buildContextString(payload);
  const prompt = buildTutorPrompt(request.query, contextString);
  
  const historyText = request.history && request.history.length > 0 
    ? "Previous Conversation:\n" + request.history.map(m => `${m.role.toUpperCase()}: ${m.content}`).join("\n") + "\n\n"
    : "";

  const finalPrompt = historyText + prompt;

  // Start PYQ search concurrently, ONLY if pyq_query
  let pyqPromise: Promise<{isGrounded: boolean, pyqs: any[]}> | null = null;
  if (payload.intent === 'pyq_query') {
      pyqPromise = searchPyq(request.query, request.subjectCode, request.classLevel, request.chapterKey);
  }

  // Set Gemini parameters based on responseMode
  let maxOutputTokens = 500;
  let temperature = 0.2;
  
  if (payload.responseMode === 'concise') {
    maxOutputTokens = 150;
    // Lower temperature for highly concise, deterministic answers
    temperature = 0.0;
  } else if (payload.responseMode === 'standard') {
    maxOutputTokens = 300;
    temperature = 0.2;
  } else if (payload.responseMode === 'detailed') {
    maxOutputTokens = 800;
    temperature = 0.3;
  }

  let stream = await generateContentStream(finalPrompt, SYSTEM_PROMPT, 2, maxOutputTokens, temperature);
  const startGeminiTime = Date.now();

  return new ReadableStream({
    async start(controller) {
      let isFirstToken = true;
      let ttft = 0;
      let fullResponse = '';
      let verifierWaitMs = 0;

      const verifier = createStreamVerifier(controller);

      try {
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ metadata: { textChunks: payload.textChunks, intent: payload.intent } })}\n\n`));

        for await (const chunk of stream) {
          const text = chunk.text;
          if (!text) continue;

          if (isFirstToken) {
            ttft = Date.now() - startTime;
            isFirstToken = false;
          }

          const startVer = Date.now();
          const verifiedChunk = verifier.processChunk(text);
          verifierWaitMs += (Date.now() - startVer);

          if (verifiedChunk.error) {
            controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ content: '\n\n[Content blocked by verifier: ' + verifiedChunk.error + ']' })}\n\n`));
            break;
          }

          // If it's a strict not-found case, intercept and override
          if (verifiedChunk.text) {
             const lowerResp = (fullResponse + verifiedChunk.text).toLowerCase();
             if (lowerResp.includes('the retrieved text does not contain this information')) {
                 controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ content: '\n\nThis concept is not available in the currently selected NCERT chapter. Please switch to the relevant chapter or ask a question from the selected chapter.' })}\n\n`));
                 controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ done: true })}\n\n`));
                 break;
             }
             
             fullResponse += verifiedChunk.text;
             controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ content: verifiedChunk.text })}\n\n`));
          }
        }
        
        // Wait for PYQ search
        if (pyqPromise) {
          let pyqs: any[] = [];
          try {
             const pyqResult = await Promise.race([
                pyqPromise,
                new Promise<{isGrounded: boolean, pyqs: any[]}>((_, reject) => setTimeout(() => reject(new Error('PYQ timeout')), 3000))
             ]);
             pyqs = pyqResult.pyqs;
          } catch (e) {
             console.warn("PYQ matching skipped due to timeout:", e);
             pyqs = [];
          }
          const pyqFormatted = formatPyqContext(pyqs);
          // Verify the PYQ formatting as well to be safe against fake citations
          const pyqVerification = verifyResponse(pyqFormatted, pyqs);
          const safePyqText = pyqVerification.isValid ? pyqFormatted : "PYQ Match: No exact indexed PYQ match was found for this query. However, this concept is relevant for NEET/JEE preparation.";
          
          // Append pyqs
          const finalPyqs = "\n\n---\n\n" + safePyqText;
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ content: finalPyqs, metadata: { pyqs } })}\n\n`));
          fullResponse += finalPyqs;
        }

        const endTime = Date.now();
        const totalLatency = endTime - startTime;
        
        // Send Done
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ done: true })}\n\n`));

        if (onMetrics) {
           onMetrics({
             retrievalLatency: startGeminiTime - startTime,
             geminiLatency: endTime - startGeminiTime,
             verifierLatency: verifierWaitMs,
             totalLatency: totalLatency,
             timeToFirstToken: ttft,
             tokensPerSecond: fullResponse.length / 4 / (totalLatency / 1000)
           });
        }

        controller.close();
      } catch (err: any) {
        console.error("Stream error:", err);
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ error: err.message })}\n\n`));
        controller.close();
      }
    }
  });
}

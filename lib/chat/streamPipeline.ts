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
  let pyqPromise: Promise<any[]> | null = null;
  if (payload.intent === 'pyq_query') {
      pyqPromise = searchPyq(request.query, request.subjectCode, request.classLevel, request.chapterKey);
  }

  // Set Gemini max tokens based on intent
  let maxOutputTokens = 500;
  if (payload.intent === 'exercise_solution') maxOutputTokens = 800;
  else if (payload.intent === 'structure_query') maxOutputTokens = 250;

  let stream = await generateContentStream(finalPrompt, SYSTEM_PROMPT, 2, maxOutputTokens);
  const startGeminiTime = Date.now();

  return new ReadableStream({
    async start(controller) {
      let isFirstToken = true;
      let ttft = 0;
      let fullResponse = '';
      let verifierWaitMs = 0;

      const verifier = createStreamVerifier(controller);

      try {
        let isFallbackTriggered = false;
        let initialBuffer = '';
        let initialChunkCount = 0;

        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ metadata: { textChunks: payload.textChunks, intent: payload.intent } })}\n\n`));

        for await (const chunk of stream) {
          const text = chunk.text;
          if (!text) continue;

          // Check for fallback in first few chunks
          if (initialChunkCount < 3) {
            initialBuffer += text.toLowerCase();
            initialChunkCount++;
            if (initialBuffer.includes("cannot find") || initialBuffer.includes("not find") || initialBuffer.includes("not present") || initialBuffer.includes("not defined")) {
              isFallbackTriggered = true;
              break;
            }
          }

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

          if (verifiedChunk.text) {
             fullResponse += verifiedChunk.text;
             controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ content: verifiedChunk.text })}\n\n`));
          }
        }

        if (isFallbackTriggered) {
          console.log("Stream fallback triggered...");
          const fallbackStream = await generateFallbackContentStream(request.query, historyText);
          
          if (!isFirstToken) {
             controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ content: '\n\n...' })}\n\n`));
          }

          for await (const fallbackChunk of fallbackStream) {
            const fallbackText = fallbackChunk.text;
            if (!fallbackText) continue;

            if (isFirstToken) {
               ttft = Date.now() - startTime;
               isFirstToken = false;
            }

            const startVer = Date.now();
            const verifiedFallback = verifier.processChunk(fallbackText);
            verifierWaitMs += (Date.now() - startVer);

            if (verifiedFallback.error) {
               controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ content: '\n\n[Content blocked by verifier: ' + verifiedFallback.error + ']' })}\n\n`));
               break;
            }

            if (verifiedFallback.text) {
               fullResponse += verifiedFallback.text;
               controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ content: verifiedFallback.text })}\n\n`));
            }
          }
        }
        
        // Wait for PYQ search
        if (pyqPromise) {
          let pyqs: any[] = [];
          try {
             pyqs = await Promise.race([
                pyqPromise,
                new Promise<any[]>((_, reject) => setTimeout(() => reject(new Error('PYQ timeout')), 3000))
             ]);
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

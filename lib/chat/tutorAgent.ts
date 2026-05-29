import { ChatRequest, ContextPayload, ChatMessage } from './chatTypes';
import { generateContent, generateFallbackContent } from '@/lib/gemini';
import { SYSTEM_PROMPT } from '@/lib/prompts/systemPrompt';
import { buildTutorPrompt } from '@/lib/prompts/tutorPrompt';
import { buildContextString } from './contextBuilder';
import { verifyResponse } from './verifier';
import { searchPyq } from '@/lib/pyq/pyqRetriever';
import { formatPyqContext } from '@/lib/pyq/pyqFormatter';

export async function runTutorAgent(request: ChatRequest, payload: ContextPayload): Promise<ChatMessage> {
  const contextString = buildContextString(payload);
  const prompt = buildTutorPrompt(request.query, contextString);
  
  const historyText = request.history && request.history.length > 0 
    ? "Previous Conversation:\n" + request.history.map(m => `${m.role.toUpperCase()}: ${m.content}`).join("\n") + "\n\n"
    : "";

  const finalPrompt = historyText + prompt;

  try {
    // Start PYQ search concurrently
    const pyqPromise = searchPyq(request.query, request.subjectCode, request.classLevel, request.chapterKey);
    
    let maxOutputTokens = 500;
    let temperature = 0.2;
    if (payload.responseMode === 'concise') {
      maxOutputTokens = 150;
      temperature = 0.0;
    } else if (payload.responseMode === 'standard') {
      maxOutputTokens = 300;
      temperature = 0.2;
    } else if (payload.responseMode === 'detailed') {
      maxOutputTokens = 800;
      temperature = 0.3;
    }

    let rawResponse = await generateContent(finalPrompt, SYSTEM_PROMPT, 2, maxOutputTokens, temperature);
    
    // Fallback logic for when context is insufficient
    const lowercaseRes = rawResponse.toLowerCase();
    if (lowercaseRes.includes("cannot find") || lowercaseRes.includes("not find") || lowercaseRes.includes("not present") || lowercaseRes.includes("not defined")) {
        console.log("Triggering fallback model configuration...");
        rawResponse = await generateFallbackContent(request.query, historyText);
    }
    
    // Await PYQ step
    const pyqResult = await pyqPromise;
    const pyqs = pyqResult.pyqs;

    // Verify NCERT response (allow fetched PYQs so it doesn't get blocked if it references them)
    const verification = verifyResponse(rawResponse, pyqs);
    let finalContent = verification.sanitizedResponse || rawResponse;

    if (!verification.isValid) {
      console.warn("[Verifier Blocked Response]", verification.reason);
      return {
        role: 'model',
        content: "I synthesized an answer but it violated safety or syntax rules (e.g., contained images or incorrect math formatting). Please try rephrasing your query."
      };
    }

    const pyqFormatted = formatPyqContext(pyqs);

    // Verify the PYQ formatting as well to be safe against fake citations
    const pyqVerification = verifyResponse(pyqFormatted, pyqs);
    const safePyqText = pyqVerification.isValid ? pyqFormatted : "PYQ Match: No exact indexed PYQ match was found for this query. However, this concept is relevant for NEET/JEE preparation.";

    finalContent = finalContent + "\n\n---\n\n" + safePyqText;

    return {
      role: 'model',
      content: finalContent
    };

  } catch (err: any) {
    console.error("[Tutor Agent Error]", err);
    return {
      role: 'model',
      content: `I encountered an error trying to process this request. Error: ${err.message}`
    };
  }
}

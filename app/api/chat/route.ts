import { NextRequest, NextResponse } from 'next/server';
import { detectIntent } from '@/lib/chat/intentRouter';
import { planRetrieval } from '@/lib/chat/retrievalPlanner';
import { runTutorAgent } from '@/lib/chat/tutorAgent';
import { ChatRequest } from '@/lib/chat/chatTypes';
import { logPromptAudit } from '@/lib/prompts/promptAudit';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const request: ChatRequest = {
      subjectCode: body.subjectCode,
      classLevel: body.classLevel,
      chapterKey: body.chapterKey,
      query: body.query,
      history: body.history || []
    };

    if (!request.subjectCode || !request.classLevel || !request.chapterKey || !request.query) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Detect Intent
    const intent = detectIntent(request.query);

    // 2. Plan Retrieval (Hybrid Search or Structure Index)
    const contextPayload = await planRetrieval(request, intent);

    // 3. Run Tutor Agent (Build Prompt, Call Gemini, Verify)
    const responseMessage = await runTutorAgent(request, contextPayload);

    // 4. Audit logging
    await logPromptAudit(request.query, responseMessage.content, intent, responseMessage.content.indexOf('violated safety') === -1);

    // 5. Save to tutorSessions
    const { adminDb } = await import('@/lib/firebase/admin');
    if (adminDb) {
      await adminDb.collection('tutorSessions').add({
        subjectCode: request.subjectCode,
        classLevel: request.classLevel,
        chapterKey: request.chapterKey,
        query: request.query,
        response: responseMessage.content,
        intent,
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      intent,
      message: responseMessage
    });

  } catch (error: any) {
    console.error("[Chat API Error]", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

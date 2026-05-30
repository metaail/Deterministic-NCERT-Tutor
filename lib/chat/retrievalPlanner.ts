import { ChatRequest, ContextPayload, ChatIntent } from './chatTypes';
import { executeHybridSearch } from '@/lib/vector/hybridSearch';
import { adminDb } from '@/lib/firebase/admin';
import { getResponseMode } from './intentRouter';

export async function planRetrieval(request: ChatRequest, intent: ChatIntent): Promise<ContextPayload> {
  const { query, subjectCode, classLevel, chapterKey } = request;
  const responseMode = getResponseMode(intent);

  // Start chapter lookup
  if (!adminDb) throw new Error("Database not initialized");
  
  const [chapterDoc, indexDoc, results] = await Promise.all([
    adminDb.collection('chapters').doc(chapterKey).get(),
    adminDb.collection('chapterStructureIndex').doc(chapterKey).get(),
    executeHybridSearch(query, subjectCode, classLevel, chapterKey)
  ]);

  if (!chapterDoc.exists) throw new Error("Chapter not found");
  if (chapterDoc.data()?.status !== 'published' && chapterDoc.data()?.status !== 'indexed') {
    throw new Error("Chapter is not published yet.");
  }

  const textChunks = results.map((r: any) => {
    const calcScore = r.finalScore || r.denseScore || r.rrfScore || 0;
    return {
      ...r.metadata,
      score: Math.max(0, Math.min(calcScore, 1.0))
    };
  });

  console.log(`[retrievalPlanner] Search returned ${textChunks.length} chunks for ${chapterKey}`);

  if ((results as any).isCacheHit) {
     (textChunks as any).isCacheHit = true;
  }

  return {
    intent,
    responseMode,
    textChunks,
    structureIndex: indexDoc.exists ? indexDoc.data() : null
  };
}

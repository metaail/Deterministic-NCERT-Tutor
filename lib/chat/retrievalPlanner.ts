import { ChatRequest, ContextPayload, ChatIntent } from './chatTypes';
import { executeHybridSearch } from '@/lib/vector/hybridSearch';
import { adminDb } from '@/lib/firebase/admin';

export async function planRetrieval(request: ChatRequest, intent: ChatIntent): Promise<ContextPayload> {
  const { query, subjectCode, classLevel, chapterKey } = request;

  // Start chapter lookup
  if (!adminDb) throw new Error("Database not initialized");
  const chapterDocPromise = adminDb.collection('chapters').doc(chapterKey).get();

  if (intent === 'structure_query') {
    const [chapterDoc, indexDoc] = await Promise.all([
      chapterDocPromise,
      adminDb.collection('chapterStructureIndex').doc(chapterKey).get()
    ]);
    if (!chapterDoc.exists) throw new Error("Chapter not found");
    if (chapterDoc.data()?.status !== 'published' && chapterDoc.data()?.status !== 'indexed') {
      throw new Error("Chapter is not published yet.");
    }
    return {
      intent,
      textChunks: [],
      structureIndex: indexDoc.exists ? indexDoc.data() : null
    };
    } else {
    // We can start hybrid search while chapter verification runs
    // Note: chapter validation failure should reject immediately, it's small overhead if parallelized
    const [chapterDoc, results] = await Promise.all([
      chapterDocPromise,
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

    if ((results as any).isCacheHit) {
       (textChunks as any).isCacheHit = true;
    }

    return {
      intent,
      textChunks,
    };
  }
}

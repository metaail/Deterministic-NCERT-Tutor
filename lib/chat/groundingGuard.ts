import { ContextPayload } from './chatTypes';
import { suggestChapterForQuery } from './topicSuggestion';
import { getRelatedQuestionsFromContext } from './outOfScopeHandler';

export function evaluateGroundingConfidence(
  query: string,
  contextPayload: ContextPayload,
  chapterKey: string,
  subjectCode: string
): { isGrounded: boolean; reason?: string; suggestedChapter?: string | null; relatedQuestions?: string[] } {
  const { textChunks, intent, structureIndex } = contextPayload;
  
  if (intent === 'structure_query' && structureIndex) {
      return { isGrounded: true };
  }

  if (!textChunks || textChunks.length === 0) {
    const suggestedChapter = suggestChapterForQuery(query);
    return { isGrounded: false, reason: "No relevant textbook context found.", suggestedChapter };
  }

  // Filter chunks to see if we have valid ones covering the selected chapter
  const validChunks = textChunks.filter(chunk => {
      // RRF scores are typically < 0.05. Dense scores are < 1.0. 
      // We rely on the search engine's ranking, but add a baseline overlap check.
      const queryWords = query.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 3);
      if (queryWords.length > 0 && chunk.text) {
          const chunkText = chunk.text.toLowerCase();
          const hasOverlap = queryWords.some(w => chunkText.includes(w));
          if (!hasOverlap) {
             console.log(`[GroundingGuard] Rejected chunk ${chunk.chunkId} due to lack of word overlap.`);
             return false;
          }
      } else if (queryWords.length > 0 && !chunk.text && chunk.textPreview) {
          const chunkText = chunk.textPreview.toLowerCase();
          const hasOverlap = queryWords.some(w => chunkText.includes(w));
          if (!hasOverlap) {
             console.log(`[GroundingGuard] Rejected chunk ${chunk.chunkId} due to lack of word overlap in textPreview.`);
             return false;
          }
      }
      
      if (chunk.chapterKey !== chapterKey) {
          console.log(`[GroundingGuard] Rejected chunk ${chunk.chunkId} due to chapterKey mismatch. Expected ${chapterKey}, got ${chunk.chapterKey}`);
          return false;
      }
      if (chunk.subjectCode !== subjectCode) {
          console.log(`[GroundingGuard] Rejected chunk ${chunk.chunkId} due to subjectCode mismatch.`);
          return false;
      }
      if (chunk.status !== 'published') {
          console.log(`[GroundingGuard] Rejected chunk ${chunk.chunkId} due to status. Expected published, got ${chunk.status}`);
          return false;
      }
      
      return true;
  });

  if (validChunks.length === 0) {
      console.log(`[GroundingGuard] No valid chunks remaining out of ${textChunks.length}`);
      const suggestedChapter = suggestChapterForQuery(query);
      const relatedQuestions = getRelatedQuestionsFromContext(contextPayload);
      return { 
        isGrounded: false, 
        reason: "This concept is not strongly supported by the currently selected NCERT chapter.",
        suggestedChapter,
        relatedQuestions
      };
  }

  return { isGrounded: true };
}

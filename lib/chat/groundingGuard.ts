import { ContextPayload } from './chatTypes';

export function evaluateGroundingConfidence(
  query: string,
  contextPayload: ContextPayload,
  chapterKey: string,
  subjectCode: string
): { isGrounded: boolean; reason?: string } {
  const { textChunks } = contextPayload;
  
  if (!textChunks || textChunks.length === 0) {
    return { isGrounded: false, reason: "No relevant textbook context found." };
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
             console.log(`[GroundingGuard] Rejected text: No keyword overlap with query.`);
             return false;
          }
      }
      
      // The properties are flattened from metadata in retrievalPlanner:
      if (chunk.chapterKey !== chapterKey) {
          console.log(`[GroundingGuard] Rejected text: chapterKey ${chunk.chapterKey} != ${chapterKey}`);
          return false;
      }
      if (chunk.subjectCode !== subjectCode) {
          console.log(`[GroundingGuard] Rejected text: subjectCode ${chunk.subjectCode} != ${subjectCode}`);
          return false;
      }
      if (chunk.status !== 'published') {
          console.log(`[GroundingGuard] Rejected text: status ${chunk.status} != published`);
          return false;
      }
      
      return true;
  });

  if (validChunks.length === 0) {
      console.log(`[GroundingGuard] No valid chunks remaining out of ${textChunks.length}`);
      return { isGrounded: false, reason: "This concept is not available in the currently selected NCERT chapter. Please switch to the relevant chapter or ask a question from the selected chapter." };
  }

  
  return { isGrounded: true };
}

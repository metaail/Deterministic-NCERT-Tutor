import { ContextPayload } from './chatTypes';

export function buildContextString(payload: ContextPayload): string {
  if (payload.intent === 'structure_query' && payload.structureIndex) {
    return `[CHAPTER STRUCTURE INDEX]\n${JSON.stringify(payload.structureIndex, null, 2)}`;
  }

  if (payload.textChunks && payload.textChunks.length > 0) {
    let ctx = "[RETRIEVED NCERT CONTEXT]\n";
    payload.textChunks.forEach((chunk, idx) => {
      ctx += `\n--- Chunk ${idx + 1} ---\n`;
      ctx += `Title: ${chunk.chapterTitle || 'N/A'}\n`;
      ctx += `Section: ${chunk.sectionTitle || 'N/A'}\n`;
      ctx += `Page: ${chunk.pageNumber || 'N/A'}\n`;
      if (chunk.figureRefs?.length) ctx += `Figure Refs: ${chunk.figureRefs.join(', ')}\n`;
      if (chunk.tableRefs?.length) ctx += `Table Refs: ${chunk.tableRefs.join(', ')}\n`;
      if (chunk.formulaRefs?.length) ctx += `Formula Refs: ${chunk.formulaRefs.join(', ')}\n`;
      ctx += `Content: ${chunk.text || chunk.textPreview}\n`;
    });
    return ctx;
  }

  return "No relevant context found in this chapter.";
}

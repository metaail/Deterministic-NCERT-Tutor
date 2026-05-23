import { IngestionContext } from '../types';

export async function buildChapterStructureIndex(ctx: IngestionContext): Promise<IngestionContext> {
  // Phase 2 implementation: Generates the mandatory summaryPoints[] for the
  // ChapterStructureIndex collection to facilitate rapid frontend revision.
  
  if (!ctx.detectedStructure || !ctx.detectedStructure.sections) {
    return ctx;
  }
  
  const sections = ctx.detectedStructure.sections;
  const sectionTitles = sections.map((s: any) => s.title);
  
  // Basic heuristic string extraction for initial revision/summary.
  const summaryPoints = sections
    .filter((s: any) => s.content && s.content.trim().length > 50)
    .slice(0, 5) // cap at 5 points
    .map((s: any) => s.content.trim().split(/[.!?]\s/)[0] + '.');
    
  if (summaryPoints.length === 0) {
    summaryPoints.push("Chapter summary points generated structurally.");
  }
  
  ctx.detectedStructure.chapterIndex = {
    chapterKey: ctx.chapterKey,
    title: ctx.metadata?.chapterTitle || "Unknown Chapter",
    summaryPoints,
    sections: sectionTitles,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return ctx;
}

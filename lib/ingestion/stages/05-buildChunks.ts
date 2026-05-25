import { IngestionContext } from '../types';
import { ChapterChunk } from '@/types';
import { SubjectEnum, SubjectCodeEnum, ClassLevelEnum } from '@/lib/validators/models';

export async function buildChunks(ctx: IngestionContext): Promise<IngestionContext> {
  if (!ctx.detectedStructure || !ctx.detectedStructure.sections) {
    return ctx;
  }
  
  const chunks: ChapterChunk[] = [];
  const sections = ctx.detectedStructure.sections;
  let chunkIndex = 0;
  
  const metadata = ctx.metadata || {};
  const subject = metadata.subject && SubjectEnum.safeParse(metadata.subject).success ? metadata.subject : 'Physics';
  const subjectCode = metadata.subjectCode && SubjectCodeEnum.safeParse(metadata.subjectCode).success ? metadata.subjectCode : '042';
  const classLevel = metadata.classLevel && ClassLevelEnum.safeParse(metadata.classLevel).success ? metadata.classLevel : 'Class 11';

  let prevChunkId: string | null = null;
  
  for (const section of sections) {
    if (!section.content || !section.content.trim()) continue;

    // A simple heuristic parser to split section content into atomic chunks
    // Matches "Example X.Y", "Table X.Y", "Fig. X.Y", "Exercises", "Summary"
    const blocks: { type: string, content: string, title?: string, number?: string }[] = [];
    
    // We split by standard NCERT markers. 
    // This regex splits when a block starts at the beginning of a line.
    const splitRegex = /(?=(?:^|\n)(?:Example|Problem)\s+\d+\.\d+|(?:\n)(?:Table|Fig\.)\s+\d+\.\d+|(?:\n)SUMMARY|(?:\n)EXERCISES)/i;
    
    const parts = section.content.split(splitRegex);
    
    for (const part of parts) {
      if (!part.trim()) continue;
      let blockType = 'concept';
      let title = section.title;
      let num = undefined;
      
      const matchExample = part.match(/^(?:Example|Problem)\s+(\d+\.\d+)/i);
      const matchTable = part.match(/^(?:\n)?Table\s+(\d+\.\d+)/i);
      const matchFig = part.match(/^(?:\n)?Fig\.\s+(\d+\.\d+)/i);
      const matchSummary = part.match(/^(?:\n)?SUMMARY/i);
      const matchExercise = part.match(/^(?:\n)?EXERCISES/i);

      if (matchExample) { blockType = 'example'; num = matchExample[1]; title = `Example ${num}`; }
      else if (matchTable) { blockType = 'table'; num = matchTable[1]; title = `Table ${num}`; }
      else if (matchFig) { blockType = 'figure'; num = matchFig[1]; title = `Figure ${num}`; }
      else if (matchSummary) { blockType = 'summary'; title = 'Summary'; }
      else if (matchExercise) { blockType = 'exercise'; title = 'Exercises'; }

      // Check for formulas: lines with \( or \[
      const hasFormula = part.includes('\\(') || part.includes('\\[');
      if (hasFormula && blockType === 'concept') blockType = 'formula';

      blocks.push({ type: blockType, content: part.trim(), title, number: num });
    }

    for (const block of blocks) {
      const chunkId = `${ctx.chapterKey}_chunk_${chunkIndex}`;
      
      const chunk: ChapterChunk = {
        chunkId,
        chapterKey: ctx.chapterKey,
        subject,
        subjectCode,
        classLevel,
        chapterTitle: metadata.chapterTitle || 'Unknown Chapter',
        sectionTitle: section.title,
        chunkIndex,
        chunkType: block.type === 'concept' ? "Explanatory" : "Atomic",
        chunkRole: block.type,
        contentType: "Text",
        pageNumber: 1, // To be mapped 
        concept: block.title || section.title,
        concepts: [block.title || section.title],
        conceptTags: [block.type],

        ncertPageNumber: metadata.detectedChapterNumber || undefined,
        exampleNumber: block.type === 'example' ? block.number : undefined,
        tableNumber: block.type === 'table' ? block.number : undefined,
        figureNumber: block.type === 'figure' ? block.number : undefined,
        
        isDefinition: block.content.toLowerCase().includes(' is defined as '),
        isLaw: block.content.toLowerCase().includes(' law ') || block.content.toLowerCase().includes(' principle '),
        isFormula: block.type === 'formula',
        isSolvedExample: block.type === 'example',
        isExercise: block.type === 'exercise',
        isSummaryPoint: block.type === 'summary',
        isTable: block.type === 'table',
        isFigureCaption: block.type === 'figure',

        vectorType: block.type,
        prerequisiteConcepts: [],
        relatedConcepts: [],
        retrievalAliases: [],
        headingPath: [section.title],
        previousChunkId: prevChunkId || undefined,
        nextChunkId: undefined,
        
        figureRefs: block.type === 'figure' && block.number ? [block.number] : [],
        tableRefs: block.type === 'table' && block.number ? [block.number] : [],
        formulaRefs: [],
        exerciseRefs: [],
        exampleRefs: block.type === 'example' && block.number ? [block.number] : [],
        
        hasFormula: block.content.includes('\\(') || block.content.includes('\\['),
        formulaLatexList: [],
        
        text: block.content,
        embeddingId: '',
        embeddingModel: 'not_generated_phase_2',
        embeddingStatus: 'pending',
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (prevChunkId && chunks.length > 0) {
        chunks[chunks.length - 1].nextChunkId = chunkId;
      }
      
      chunks.push(chunk);
      prevChunkId = chunkId;
      chunkIndex++;
    }
  }
  
  ctx.generatedChunks = chunks;
  return ctx;
}

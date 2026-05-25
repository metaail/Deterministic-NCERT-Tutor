import { IngestionContext } from './types';
import { parsePdf } from './stages/01-parsePdf';
import { extractPages } from './stages/02-extractPages';
import { validateIdentity } from './stages/02b-validateIdentity';
import { normalizeText } from './stages/03-normalizeText';
import { detectStructure } from './stages/04-detectStructure';
import { buildChunks } from './stages/05-buildChunks';
import { validateChunks } from './stages/05b-validateChunks';
import { buildChapterStructureIndex } from './stages/06-buildChapterStructureIndex';
import { saveFirestore } from './stages/07-saveFirestore';
import { finalizeChapter } from './stages/08-finalizeChapter';

/**
 * The deterministic coordinator for the NCERT ingestion pipeline.
 * Executes processing stages sequentially. Asynchronous recursive 
 * workflows are strictly forbidden to ensure data integrity.
 */
export async function runIngestionPipeline(initialContext: IngestionContext): Promise<void> {
  try {
    let ctx = await parsePdf(initialContext);
    ctx = await extractPages(ctx);
    ctx = await validateIdentity(ctx);
    ctx = await normalizeText(ctx);
    ctx = await detectStructure(ctx);
    ctx = await buildChunks(ctx);
    ctx = await validateChunks(ctx);
    ctx = await buildChapterStructureIndex(ctx);
    ctx = await saveFirestore(ctx);
    await finalizeChapter(ctx);
  } catch (error) {
    console.error(`Pipeline failed for job ${initialContext.jobId}:`, error);
    // Error handling state mutations will be implemented here.
    throw error;
  }
}

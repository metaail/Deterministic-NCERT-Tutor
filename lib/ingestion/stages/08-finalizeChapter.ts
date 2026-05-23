import { IngestionContext } from '../types';
import { adminDb } from '@/lib/firebase/admin';
import { upsertPendingChunks } from '@/lib/vector/upsertChunks';

export async function finalizeChapter(ctx: IngestionContext): Promise<void> {
  // Phase 2 implementation: Mutates the ChapterDocument and IngestionJob status 
  // from 'processing' to 'indexed'.
  
  if (!adminDb) {
    console.warn(`[Pipeline] Cannot finalize chapter for job ${ctx.jobId}. Admin DB null.`);
    return;
  }
  
  try {
    const batch = adminDb.batch();
    
    // Update Chapter 
    const chapterRef = adminDb.collection('chapters').doc(ctx.chapterKey);
    batch.set(chapterRef, {
      ...ctx.metadata,
      status: 'indexed',
      totalChunks: ctx.generatedChunks?.length || 0,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    
    // Update Job
    const jobRef = adminDb.collection('ingestionJobs').doc(ctx.jobId);
    batch.set(jobRef, {
      status: 'indexed',
      progress: 100,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    
    await batch.commit();
    console.log(`[Pipeline] Finalized ingestion job ${ctx.jobId} for chapter ${ctx.chapterKey}.`);
    
    // Trigger Phase 3 Post-Ingestion Vector Indexing
    console.log(`[Pipeline] Triggering vector indexing...`);
    try {
      const indexedCount = await upsertPendingChunks();
      console.log(`[Pipeline] Vector indexing complete. Upserted ${indexedCount} chunks.`);
    } catch (idxError) {
      console.error(`[Pipeline] Vector indexing failed:`, idxError);
      // We don't fail the ingestion job if indexing fails, just log it.
    }

  } catch (error) {
    console.error(`[Pipeline] Error finalizing chapter:`, error);
  }
}

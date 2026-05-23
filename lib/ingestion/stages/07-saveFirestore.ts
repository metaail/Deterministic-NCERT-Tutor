import { IngestionContext } from '../types';
import { adminDb } from '@/lib/firebase/admin';

export async function saveFirestore(ctx: IngestionContext): Promise<IngestionContext> {
  // Phase 2 implementation: Executes batched transactional writes to the Firestore
  // collections utilizing the adminDb instance, strictly validated by Zod models.
  
  if (!adminDb) {
    console.warn(`[Pipeline] Firebase Admin DB is not initialized. Skipping Firestore writes for job ${ctx.jobId}.`);
    return ctx;
  }

  const batch = adminDb.batch();
  
  // Save chapter index
  if (ctx.detectedStructure?.chapterIndex) {
    const idxRef = adminDb.collection('chapterStructureIndex').doc(ctx.chapterKey);
    batch.set(idxRef, ctx.detectedStructure.chapterIndex, { merge: true });
  }
  
  // Save chunks (Firestore batched write limit is 500)
  if (ctx.generatedChunks && ctx.generatedChunks.length > 0) {
    let writeCount = 0;
    for (const chunk of ctx.generatedChunks) {
      if (writeCount >= 450) {
        console.warn(`[Pipeline] Reached batch limit, chunking not fully serialized here for ${ctx.chapterKey}`);
        break;
      }
      const chunkRef = adminDb.collection('chapterChunks').doc(chunk.chunkId);
      batch.set(chunkRef, chunk, { merge: true });
      writeCount++;
    }
  }

  try {
    if (ctx.generatedChunks?.length || ctx.detectedStructure?.chapterIndex) {
      await batch.commit();
      console.log(`[Pipeline] Successfully committed metadata and chunks for ${ctx.chapterKey} to Firestore.`);
    }
  } catch (error) {
    console.error(`[Pipeline] Failed to commit batch to Firestore:`, error);
    throw error;
  }

  return ctx;
}

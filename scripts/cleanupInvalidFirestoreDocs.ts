import { adminDb } from '../lib/firebase/admin';
import { 
  ChapterDocumentSchema, 
  IngestionJobSchema 
} from '../lib/validators/models';

async function scanAndClean(collectionName: string, schema: any, confirm: boolean) {
  if (!adminDb) return;
  const snapshot = await adminDb.collection(collectionName).get();
  
  let invalidCount = 0;
  const invalidIds: string[] = [];
  
  snapshot.forEach(doc => {
    const data = doc.data();
    const parsed = schema.safeParse(data);
    if (!parsed.success) {
      invalidCount++;
      invalidIds.push(doc.id);
    }
  });

  console.log(`\nCollection: ${collectionName}`);
  console.log(`Found ${invalidCount} invalid documents.`);
  if (invalidCount > 0) {
    console.log(`Invalid IDs: ${invalidIds.join(', ')}`);
  }

  if (confirm && invalidCount > 0) {
    console.log(`Deleting ${invalidCount} invalid documents...`);
    const batch = adminDb.batch();
    for (const id of invalidIds) {
      batch.delete(adminDb.collection(collectionName).doc(id));
    }
    await batch.commit();
    console.log(`Deleted successfully.`);
  } else if (invalidCount > 0) {
    console.log(`[DRY RUN] Would delete ${invalidCount} documents. Run with CONFIRM_CLEANUP=true to execute.`);
  }
}

async function main() {
  const confirm = process.env.CONFIRM_CLEANUP === 'true';
  console.log(`Starting Phase 7D-Fix Cleanup...`);
  console.log(`Mode: ${confirm ? 'EXECUTE' : 'DRY RUN'}`);

  await scanAndClean('chapters', ChapterDocumentSchema, confirm);
  await scanAndClean('ingestionJobs', IngestionJobSchema, confirm);

  console.log(`\nCleanup task finished.`);
}

main().catch(console.error);

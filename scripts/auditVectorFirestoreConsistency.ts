import { adminDb } from '../lib/firebase/admin';
import { Pinecone } from '@pinecone-database/pinecone';
import { env } from '../lib/utils/env';
import { getNamespace } from '../lib/vector/namespace';

async function main() {
  if (!adminDb) {
    console.error("Firestore not initialized");
    process.exit(1);
  }
  if (!env.PINECONE_API_KEY) {
    console.error("Missing PINECONE_API_KEY");
    process.exit(1);
  }

  console.log("Starting Phase 7F Firebase and Pinecone Consistency Audit...\n");

  const pc = new Pinecone({ apiKey: env.PINECONE_API_KEY });
  const index = pc.Index('neet-jee-reference-tutor-dense');

  const namespaces = [
    'class11_PHY',
    'class11_CHM',
    'class11_BIO',
    'class11_MTH',
    'class12_PHY',
    'class12_CHM',
    'class12_BIO',
    'class12_MTH'
  ];

  // 1. Fetch all Firestore chunks
  console.log("Fetching Firestore chunks...");
  const snapshot = await adminDb.collection('chapterChunks').get();
  
  const firestoreChunks = new Map<string, any>();
  snapshot.forEach(doc => {
    firestoreChunks.set(doc.id, doc.data());
  });

  console.log(`Found ${firestoreChunks.size} Firestore chunks.\n`);

  // 2. Fetch all Pinecone vectors
  const pineconeVectors = new Map<string, any>();
  let totalVectors = 0;

  console.log("Fetching Pinecone vectors...");
  for (const ns of namespaces) {
    try {
      const nsIndex = index.namespace(ns);
      let paginationToken: string | undefined = undefined;
      const allIds = [];

      do {
        const listResults: any = await nsIndex.listPaginated({ limit: 100, paginationToken });
        if (listResults.vectors) {
          allIds.push(...listResults.vectors.map((v: any) => v.id));
        }
        paginationToken = listResults.pagination?.next;
      } while (paginationToken);

      for (let i = 0; i < allIds.length; i += 100) {
        const batchIds = allIds.slice(i, i + 100).filter(Boolean);
        if (batchIds.length === 0) continue;
        
        // Use FetchOptions properly
        const fetchResponse: any = await nsIndex.fetch({ ids: batchIds });

        for (const id of batchIds) {
          const vector = fetchResponse.records[id];
          if (vector && vector.metadata) {
            pineconeVectors.set(id, { ...vector.metadata, namespace: ns });
            totalVectors++;
          }
        }
      }
    } catch (e: any) {
      console.log(`Failed fetching from ${ns}: ${e.message}`);
    }
  }

  console.log(`Found ${totalVectors} Pinecone vectors.\n`);

  let matchedCount = 0;
  const missingVectors: string[] = [];
  const orphanVectors: string[] = [];
  const orphanFirestoreChunks: string[] = [];
  
  const mismatchTable: any[] = [];
  const namespaceMismatchTable: any[] = [];
  const recommendedFixes = new Set<string>();

  // 3. Compare Firestore chunks against Pinecone vectors
  for (const [id, fbData] of firestoreChunks.entries()) {
    const pcMeta = pineconeVectors.get(id);
    if (!pcMeta) {
      if (fbData.status === 'published') {
        missingVectors.push(id);
        recommendedFixes.add(`Missing Vector: Re-embed and upsert chunk ${id}`);
      }
      orphanFirestoreChunks.push(id);
    } else {
      matchedCount++;

      // Check fields matching strictly
      let mismatched = false;
      let mismatchDetails: any = { id };

      if (fbData.chapterKey !== pcMeta.chapterKey) { mismatched = true; mismatchDetails.chapterKey = `FB:${fbData.chapterKey} != PC:${pcMeta.chapterKey}`; }
      if (fbData.subjectCode !== pcMeta.subjectCode) { mismatched = true; mismatchDetails.subjectCode = `FB:${fbData.subjectCode} != PC:${pcMeta.subjectCode}`; }
      if (fbData.classLevel !== pcMeta.classLevel) { mismatched = true; mismatchDetails.classLevel = `FB:${fbData.classLevel} != PC:${pcMeta.classLevel}`; }
      
      if (fbData.status && fbData.status !== pcMeta.status) { mismatched = true; mismatchDetails.status = `FB:${fbData.status} != PC:${pcMeta.status}`; }
      if (fbData.contentHash && fbData.contentHash !== pcMeta.contentHash) { mismatched = true; mismatchDetails.contentHash = `FB:${fbData.contentHash} != PC:${pcMeta.contentHash}`; }

      // Check Namespace correctness
      const expectedNs = getNamespace(fbData.classLevel, fbData.subjectCode);
      if (pcMeta.namespace !== expectedNs) {
        namespaceMismatchTable.push({
          id,
          expectedNs,
          actualNs: pcMeta.namespace
        });
        recommendedFixes.add(`Namespace Mismatch: Move vector ${id} from ${pcMeta.namespace} to ${expectedNs}`);
      }

      if (mismatched) {
        mismatchTable.push(mismatchDetails);
        recommendedFixes.add(`Metadata Mismatch: Update metadata for vector ${id} to match Firestore chunk.`);
      }

      // Check Draft availability
      if (fbData.status === 'draft' && pcMeta.status !== 'draft') {
         recommendedFixes.add(`Draft Leak: Vector ${id} is draft in FB but ${pcMeta.status} in PC.`);
      }
    }
  }

  // 4. Find orphan vectors (in PC but not in FB)
  for (const [id, pcMeta] of pineconeVectors.entries()) {
    if (!firestoreChunks.has(id)) {
      orphanVectors.push(id);
      recommendedFixes.add(`Orphan Vector: Delete vector ${id} from namespace ${pcMeta.namespace}`);
    }
  }

  console.log("========================================");
  console.log("           CONSISTENCY REPORT           ");
  console.log("========================================");
  console.log(`Firestore chunk count: ${firestoreChunks.size}`);
  console.log(`Pinecone vector count: ${totalVectors}`);
  console.log(`Matched count:         ${matchedCount}`);
  console.log("");
  console.log(`Missing Vectors (in FB, not in PC): ${missingVectors.length}`);
  if (missingVectors.length > 0) {
    console.log(`  IDs: ${missingVectors.slice(0, 10).join(', ')}${missingVectors.length > 10 ? '...' : ''}`);
  }
  
  console.log(`Orphan Vectors (in PC, not in FB):  ${orphanVectors.length}`);
  if (orphanVectors.length > 0) {
    console.log(`  IDs: ${orphanVectors.slice(0, 10).join(', ')}${orphanVectors.length > 10 ? '...' : ''}`);
  }
  
  console.log(`Orphan Firestore chunks:            ${orphanFirestoreChunks.length}`);
  
  console.log("");
  if (mismatchTable.length > 0) {
    console.log("METADATA MISMATCH TABLE:");
    console.table(mismatchTable.slice(0, 10)); // display up to 10
    console.log(`Total explicit mismatches: ${mismatchTable.length}`);
  } else {
    console.log("METADATA MISMATCH TABLE: NONE");
  }

  console.log("");
  if (namespaceMismatchTable.length > 0) {
    console.log("NAMESPACE MISMATCH TABLE:");
    console.table(namespaceMismatchTable.slice(0, 10));
    console.log(`Total namespace mismatches: ${namespaceMismatchTable.length}`);
  } else {
    console.log("NAMESPACE MISMATCH TABLE: NONE");
  }

  console.log("");
  if (recommendedFixes.size > 0) {
    console.log("RECOMMENDED FIXES:");
    let i = 1;
    for (const fix of recommendedFixes) {
      console.log(`${i++}. ${fix}`);
      if (i > 10) {
        console.log("   ... and more");
        break;
      }
    }
  }

  console.log("----------------------------------------");
  const totalIssues = missingVectors.length + orphanVectors.length + mismatchTable.length + namespaceMismatchTable.length;
  
  if (totalIssues === 0) {
    console.log("\n✅ DATA LAYER IS PRODUCTION-READY.");
    process.exit(0);
  } else {
    console.log("\n❌ INCONSISTENCIES DETECTED. Fix required before proceeding.");
    process.exit(1);
  }
}

main().catch(console.error);

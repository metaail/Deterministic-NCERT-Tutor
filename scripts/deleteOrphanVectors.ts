import { adminDb } from '../lib/firebase/admin';
import { Pinecone } from '@pinecone-database/pinecone';
import { env } from '../lib/utils/env';

async function main() {
  if (!adminDb) process.exit(1);
  if (!env.PINECONE_API_KEY) process.exit(1);

  const pc = new Pinecone({ apiKey: env.PINECONE_API_KEY });
  const index = pc.Index('neet-jee-reference-tutor-dense');
  const namespaces = ['class11_PHY', 'class11_CHM', 'class11_BIO', 'class11_MTH', 'class12_PHY', 'class12_CHM', 'class12_BIO', 'class12_MTH'];

  const snapshot = await adminDb.collection('chapterChunks').get();
  const firestoreChunks = new Set<string>();
  snapshot.forEach(doc => firestoreChunks.add(doc.id));

  let totalDeleted = 0;
  const isConfirm = process.env.CONFIRM_DELETE === 'true';
  const failedDeletions: string[] = [];
  
  const namespaceBreakdown = new Map<string, number>();

  for (const ns of namespaces) {
    const nsIndex = index.namespace(ns);
    let paginationToken: string | undefined = undefined;
    const allIds: string[] = [];

    do {
        try {
            const listResults: any = await nsIndex.listPaginated({ limit: 100, paginationToken });
            if (listResults.vectors) {
              allIds.push(...listResults.vectors.map((v: any) => v.id));
            }
            paginationToken = listResults.pagination?.next;
        } catch (e: any) {
            console.warn(`Could not list ${ns}: ${e.message}`);
            break;
        }
    } while (paginationToken);

    const orphanIds = allIds.filter(id => !firestoreChunks.has(id));
    
    if (orphanIds.length > 0) {
      if (isConfirm) {
        try {
          await nsIndex.deleteMany({ ids: orphanIds });
          totalDeleted += orphanIds.length;
          namespaceBreakdown.set(ns, orphanIds.length);
          console.log(`Deleted ${orphanIds.length} orphan vectors from ${ns}`);
        } catch (e: any) {
          console.error(`Failed deleting in ${ns}: ${e.message}`);
          failedDeletions.push(...orphanIds);
        }
      } else {
        console.log(`[DRY RUN] Would delete ${orphanIds.length} orphan vectors from ${ns}`);
        namespaceBreakdown.set(ns, orphanIds.length);
        totalDeleted += orphanIds.length;
      }
    }
  }

  console.log(`\nTotal orphans ${isConfirm ? 'deleted' : 'found'}: ${totalDeleted}`);
  for (const [ns, count] of namespaceBreakdown.entries()) {
    console.log(`  ${ns}: ${count}`);
  }
  if (failedDeletions.length > 0) {
      console.log(`Failed deletions: ${failedDeletions.length}`);
  }
}

main().catch(console.error);

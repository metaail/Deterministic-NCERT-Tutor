import { adminDb } from '../lib/firebase/admin';
import { Pinecone } from '@pinecone-database/pinecone';
import { env } from '../lib/utils/env';
import { getNamespace } from '../lib/vector/namespace';
import { mapToVectorStatus } from '../lib/vector/statusMapper';
import { ChapterChunk } from '../types';

async function main() {
  if (!adminDb || !env.PINECONE_API_KEY) process.exit(1);

  const pc = new Pinecone({ apiKey: env.PINECONE_API_KEY });
  const index = pc.Index('neet-jee-reference-tutor-dense');
  const namespaces = ['class11_PHY', 'class11_CHM', 'class11_BIO', 'class11_MTH', 'class12_PHY', 'class12_CHM', 'class12_BIO', 'class12_MTH'];

  const snapshot = await adminDb.collection('chapterChunks').get();
  const firestoreChunks = new Map<string, ChapterChunk>();
  snapshot.forEach(doc => firestoreChunks.set(doc.id, doc.data() as ChapterChunk));

  let totalUpdated = 0;
  let namespaceMoves = 0;

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
        } catch(e) { break; }
    } while (paginationToken);

    for (let i = 0; i < allIds.length; i += 100) {
      const batchIds = allIds.slice(i, i + 100).filter(Boolean);
      if (batchIds.length === 0) continue;

      const fetchResponse: any = await nsIndex.fetch({ ids: batchIds });

      for (const id of batchIds) {
        const pcMeta = fetchResponse.records[id]?.metadata;
        const fbData = firestoreChunks.get(id);

        if (!pcMeta || !fbData) continue; // skip orphans

        const expectedNs = getNamespace(fbData.classLevel, fbData.subjectCode);
        const mappedStatus = mapToVectorStatus(fbData.status || '');
        
        let needsUpdate = false;
        if (pcMeta.status !== mappedStatus) needsUpdate = true;
        if (pcMeta.chapterKey !== fbData.chapterKey) needsUpdate = true;
        if (Boolean(pcMeta.contentHash) && pcMeta.contentHash !== fbData.contentHash && Boolean(fbData.contentHash)) needsUpdate = true;
        
        if (ns !== expectedNs) {
            // Need to move namespace (read vector, write to new ns, delete from old ns)
            const vecDetails = fetchResponse.records[id];
            const updatedMeta = {
               ...pcMeta,
               status: mappedStatus,
               chapterKey: fbData.chapterKey,
               contentHash: fbData.contentHash || pcMeta.contentHash
            };
            
            await index.namespace(expectedNs).upsert({
               records: [{ id, values: vecDetails.values, metadata: updatedMeta }]
            });
            await nsIndex.deleteMany([id]);
            namespaceMoves++;
            totalUpdated++;
            console.log(`Moved ${id} from ${ns} to ${expectedNs} and updated metadata.`);
        } else if (needsUpdate) {
            // Must fetch the whole vector to specify `values` since we are skipping partial update to be safe
            // Actually, pinecone has `update` API for metadata only:
            await nsIndex.update({
               id,
               metadata: {
                 ...pcMeta,
                 status: mappedStatus,
                 chapterKey: fbData.chapterKey,
                 contentHash: fbData.contentHash || pcMeta.contentHash
               }
            });
            totalUpdated++;
            console.log(`Updated metadata for ${id} in ${ns}`);
        }
      }
    }
  }

  console.log(`\nMetadata Resync Complete.`);
  console.log(`Total vectors updated: ${totalUpdated}`);
  console.log(`Total namespace moves: ${namespaceMoves}`);
}

main().catch(console.error);

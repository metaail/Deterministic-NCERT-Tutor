import { adminDb } from '../lib/firebase/admin';
import { getPineconeClient, INDEX_NAME_DENSE } from '../lib/vector/client';
import { generateEmbedding } from '../lib/vector/embedding';

async function main() {
    console.log("Vector Rebuild tool starting...");
    if (!adminDb) {
         console.error("Firebase uninitialized");
         process.exit(1);
    }

    const pc = getPineconeClient();
    if (!pc) {
         console.error("Pinecone uninitialized");
         process.exit(1);
    }
    
    const index = pc.Index(INDEX_NAME_DENSE);

    // Iterate published chapters
    const chaptersSnap = await adminDb.collection('chapters').where('status', '==', 'published').get();
    
    console.log(`Found ${chaptersSnap.size} published chapters to rebuild.`);

    for (const doc of chaptersSnap.docs) {
         const chapterKey = doc.id;
         const data = doc.data();
         
         const namespace = data.subjectCode || 'ZOO';
         const nsIndex = index.namespace(namespace);

         const chunksSnap = await adminDb.collection('chapterChunks').where('chapterKey', '==', chapterKey).get();
         
         console.log(`Rebuilding ${chunksSnap.size} vectors for chapter ${chapterKey} in namespace ${namespace}...`);

         for (const cDoc of chunksSnap.docs) {
              const cData = cDoc.data();
              if (!cData.embeddingId) continue;
              
              const vec = await generateEmbedding(cData.text);
              if (vec) {
                  await nsIndex.upsert([{
                       id: cData.embeddingId,
                       values: vec,
                       metadata: {
                           chunkId: cDoc.id,
                           chapterKey: cData.chapterKey || '',
                           baseText: cData.text || '',
                           chunkType: cData.chunkType || '',
                           subjectCode: data.subjectCode || '',
                           classLevel: data.classLevel || '',
                           status: 'published'
                       }
                  }] as any);
              }
         }
    }

    console.log("Rebuild complete.");
    process.exit(0);
}

main();

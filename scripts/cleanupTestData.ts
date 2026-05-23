import { getFirestore } from 'firebase-admin/firestore';
import { Pinecone } from '@pinecone-database/pinecone';
import { env } from '@/lib/utils/env';
import * as admin from 'firebase-admin';

async function cleanup() {
    if (!admin.apps.length) {
        admin.initializeApp({ projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'demo-project' });
    }
    const db = getFirestore();
    const pc = new Pinecone({ apiKey: env.PINECONE_API_KEY });
    const index = pc.Index(process.env.PINECONE_INDEX || 'default-index');

    console.log("Cleaning up chunks from Pinecone...");
    await index.deleteAll();

    console.log("Cleaning up metadata from Firestore...");
    const batchSize = 100;
    
    // Cleanup chunks
    const chunksSnapshot = await db.collection('document_chunks').get();
    let batch = db.batch();
    let counter = 0;
    for (const doc of chunksSnapshot.docs) {
        batch.delete(doc.ref);
        counter++;
        if (counter % batchSize === 0) {
            await batch.commit();
            batch = db.batch();
            console.log(`Deleted ${counter} chunks`);
        }
    }
    if (counter % batchSize !== 0) await batch.commit();
    console.log(`Finished deleting ${counter} chunks.`);

    // Cleanup chapters
    const chaptersSnapshot = await db.collection('chapters').get();
    batch = db.batch();
    counter = 0;
    for (const doc of chaptersSnapshot.docs) {
        batch.delete(doc.ref);
        counter++;
        if (counter % batchSize === 0) {
            await batch.commit();
            batch = db.batch();
        }
    }
    if (counter % batchSize !== 0) await batch.commit();
    console.log(`Finished deleting ${counter} chapters.`);

}

cleanup().catch(console.error);

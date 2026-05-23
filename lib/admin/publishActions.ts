'use server';

import { adminDb } from '@/lib/firebase/admin';
import { getPineconeClient, INDEX_NAME_DENSE } from '@/lib/vector/client';
import { revalidatePath } from 'next/cache';

export async function publishChapter(chapterKey: string) {
    if (!adminDb) throw new Error("Firebase Admin not configured");

    const chapterRef = adminDb.collection('chapters').doc(chapterKey);
    const chapterDoc = await chapterRef.get();
    if (!chapterDoc.exists) throw new Error("Chapter not found");
    const data = chapterDoc.data();

    const batch = adminDb.batch();

    // 1. Update Chapter Status
    batch.update(chapterRef, { status: 'published', updatedAt: new Date().toISOString() });

    // 2. Update Structure Index
    const structureRef = adminDb.collection('chapterStructureIndex').doc(chapterKey);
    const structureDoc = await structureRef.get();
    if (structureDoc.exists) {
        batch.update(structureRef, { status: 'published' });
    }

    // 3. Update all Chunks
    const chunksSnap = await adminDb.collection('chapterChunks').where('chapterKey', '==', chapterKey).get();
    
    const vectorIdsToUpdate: string[] = [];
    chunksSnap.docs.forEach(doc => {
        batch.update(doc.ref, { status: 'published' });
        const cData = doc.data();
        if (cData.embeddingId) {
            vectorIdsToUpdate.push(cData.embeddingId);
        }
    });

    await batch.commit();

    // 4. Pinecone metadata update
    const pc = getPineconeClient();
    if (pc && vectorIdsToUpdate.length > 0) {
        const index = pc.Index(INDEX_NAME_DENSE);
        // Subject codes act as namespaces
        const namespace = data?.subjectCode || '';
        if (namespace) {
            // Pinecone limit is unknown for a single concurrent update loop, but we can do them sequentially or in batches. Let's do batches of 100.
            const nsIndex = index.namespace(namespace);
            for (const vid of vectorIdsToUpdate) {
                try {
                    await nsIndex.update({
                        id: vid,
                        metadata: { status: 'published' }
                    });
                } catch (e) {
                    console.error("Pinecone update failed for vector " + vid, e);
                }
            }
        }
    }

    revalidatePath('/admin/chapters');
    revalidatePath(`/admin/chapters/${chapterKey}`);
    
    return { success: true };
}

export async function publishPyqPaper(paperId: string) {
    if (!adminDb) throw new Error("Firebase Admin not configured");

    const paperRef = adminDb.collection('pyqPapers').doc(paperId);
    const paperDoc = await paperRef.get();
    if (!paperDoc.exists) throw new Error("Paper not found");

    const batch = adminDb.batch();

    batch.update(paperRef, { status: 'published', publishedAt: new Date().toISOString(), updatedAt: new Date().toISOString() });

    const questionsSnap = await adminDb.collection('pyqQuestions').where('paperId', '==', paperId).get();
    questionsSnap.docs.forEach(doc => {
        batch.update(doc.ref, { status: 'published', updatedAt: new Date().toISOString() });
    });

    await batch.commit();
    return { success: true };
}

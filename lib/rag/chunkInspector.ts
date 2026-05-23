import { adminDb } from '@/lib/firebase/admin';

export async function inspectChunk(chunkId: string) {
    if (!adminDb) return null;
    const snap = await adminDb.collection('chapterChunks').doc(chunkId).get();
    return snap.exists ? snap.data() : null;
}

export async function getChapterChunks(chapterKey: string, limit = 50) {
    if (!adminDb) return [];
    const snap = await adminDb.collection('chapterChunks')
        .where('chapterKey', '==', chapterKey)
        .orderBy('chunkIndex', 'asc')
        .limit(limit)
        .get();
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

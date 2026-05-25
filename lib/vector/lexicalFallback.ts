import { adminDb } from '@/lib/firebase/admin';
import { ChapterChunk } from '@/types';

// App-side lexical fallback matching chunks dynamically since sparse is unavailable.
export async function lexicalSearchFallback(
    query: string,
    subjectCode: string, 
    classLevel: string, 
    chapterKey: string, 
    topK: number = 12
) {
    if (!adminDb) return [];
    
    const snapshot = await adminDb.collection('chapterChunks')
        .where('chapterKey', '==', chapterKey)
        .where('status', '==', 'published')
        .get();
        
    const tokens = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    
    const scored = snapshot.docs.map(doc => {
        const data = doc.data() as ChapterChunk;
        
        // Subject verification
        if (data.subjectCode !== subjectCode || data.classLevel !== classLevel) return { id: data.chunkId, score: 0, metadata: {} };
        
        const text = data.text.toLowerCase();
        let score = 0;
        tokens.forEach(token => {
            if (text.includes(token)) score += 0.1;
        });
        return {
            id: data.chunkId,
            score,
            metadata: {
                ...data,
                status: data.status as "published" | "draft" 
            }
        };
    }).filter(d => d.score > 0);
    
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
}

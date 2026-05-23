import { adminDb } from '@/lib/firebase/admin';

export interface RetrievalLog {
    query: string;
    intent: string;
    namespace: string;
    retrievalRoute: string; // 'pinecone_hybrid' | 'structure_bypass'
    topKChunks: any[];
    scores: number[];
    rerankerBoosts: boolean[];
    timestamp: string;
    chapterKey?: string;
}

export async function logRetrieval(logEntry: RetrievalLog) {
    console.log(`[Retrieval Logger] Intent: ${logEntry.intent} | Route: ${logEntry.retrievalRoute} | TopK: ${logEntry.topKChunks.length}`);
    if (adminDb) {
        try {
            await adminDb.collection('retrievalLogs').add(logEntry);
        } catch (e) {
            console.error("Failed to persist retrieval log", e);
        }
    }
}

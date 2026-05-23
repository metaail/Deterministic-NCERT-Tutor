import { planRetrieval } from '@/lib/chat/retrievalPlanner';
import { logRetrieval } from './retrievalLogger';
import { ChatRequest } from '@/lib/chat/chatTypes';

export interface BenchmarkResult {
    query: string;
    passed: boolean;
    namespaceUsed: string;
    topKCount: number;
    error?: string;
}

export async function runBenchmark(queries: {query: string, intent: any, subjectCode: string, classLevel: string, chapterKey: string}[]): Promise<BenchmarkResult[]> {
    const results: BenchmarkResult[] = [];

    for (const q of queries) {
        let passed = false;
        let pResult = null;
        let topKCount = 0;
        let namespaceUsed = q.subjectCode;
        let errMessage = undefined;

        try {
            const req: ChatRequest = {
                query: q.query,
                subjectCode: q.subjectCode,
                classLevel: q.classLevel,
                chapterKey: q.chapterKey,
                history: []
            };

            const payload = await planRetrieval(req, q.intent);
            
            pResult = payload;
            topKCount = payload.textChunks ? payload.textChunks.length : 0;
            
            if (q.intent === 'structure_query' && payload.structureIndex) {
                 passed = true;
            } else if (payload.textChunks && payload.textChunks.length > 0) {
                 passed = true;
            }

            await logRetrieval({
                query: q.query,
                intent: payload.intent,
                namespace: namespaceUsed,
                retrievalRoute: payload.intent === 'structure_query' ? 'structure_bypass' : 'pinecone_hybrid',
                topKChunks: payload.textChunks || [],
                scores: payload.textChunks?.map((_: any) => 1.0) || [],
                rerankerBoosts: payload.textChunks?.map((_: any) => false) || [],
                timestamp: new Date().toISOString(),
                chapterKey: q.chapterKey
            });

        } catch (e: any) {
             console.error("Benchmark failed for", q.query, e);
             errMessage = e.message;
        }

        results.push({
            query: q.query,
            passed,
            namespaceUsed,
            topKCount,
            error: errMessage
        });
    }

    return results;
}
